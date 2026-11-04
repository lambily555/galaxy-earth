"""Non-destructive geometry/source cross-check, not certification of legal borders."""
import json, math, sys
from pathlib import Path
import numpy as np
import shapely
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

root=Path(__file__).resolve().parent
catalog=json.loads((root/'assets/boundary-catalog.json').read_text(encoding='utf-8'))
world=json.loads((root/'assets/countries.geojson').read_text(encoding='utf-8'))['features']
manifest=json.loads((root/'qa/global-data-audit.json').read_text(encoding='utf-8'))['countries']
aliases={'KOS':'XKX','SDS':'SSD','SAH':'ESH','PSX':'PSE','ALD':'ALA'}
refs={}
for f in world:
    code=aliases.get(f['properties']['ADM0_A3'],f['properties']['ADM0_A3'])
    refs[code]=shape(f['geometry'])

def projection(reference):
    parts=list(reference.geoms) if hasattr(reference,'geoms') else [reference]
    center=max(parts,key=lambda g:g.area).centroid
    lon0,lat0=np.radians([center.x,center.y])
    def convert(coords):
        lon,lat=np.radians(coords[:,0]),np.radians(coords[:,1]); delta=lon-lon0
        denominator=np.maximum(1e-10,1+np.sin(lat0)*np.sin(lat)+np.cos(lat0)*np.cos(lat)*np.cos(delta))
        k=np.sqrt(2/denominator)
        return np.column_stack((k*np.cos(lat)*np.sin(delta),k*(np.cos(lat0)*np.sin(lat)-np.sin(lat0)*np.cos(lat)*np.cos(delta))))
    return lambda g:shapely.transform(g,convert)

def checked(features,project):
    geoms=[]; invalid=0; bad=[]
    for f in features:
        g=shape(f['geometry']);coords=shapely.get_coordinates(g)
        if not np.isfinite(coords).all() or (np.abs(coords[:,0])>180.0001).any() or (np.abs(coords[:,1])>90.0001).any():
            bad.append(f['properties'].get('shapeName',f['properties'].get('name','?')));continue
        if not g.is_valid:invalid+=1;g=shapely.make_valid(g)
        p=project(g)
        if not p.is_valid:p=shapely.make_valid(p)
        if not p.is_empty:geoms.append(p)
    return geoms,invalid,bad

if '--outlines-only' in sys.argv:
    rows=[]
    for iso,reference in refs.items():
        row={'iso':iso,'originalValid':bool(reference.is_valid),'reference':'Natural Earth 1:50m'}
        file=root/f'assets/boundary-cache/{iso}-ADM0.json'
        if file.exists():
            try:
                data=json.loads(file.read_text(encoding='utf-8'));project=projection(reference);actual,invalid,bad=checked(data['features'],project)
                ref=shapely.make_valid(project(shapely.make_valid(reference)));union=shapely.union_all(actual)
                row.update(source=data.get('source',{}),invalidOriginalGeometries=invalid,invalidCoordinates=bad,referenceDifferencePct=round(ref.symmetric_difference(union).area/(ref.area or 1)*100,2),sameSource='natural earth' in str(data.get('source',{}).get('source','')).lower())
            except Exception as exc:row['error']=str(exc)
        else:row['comparisonUnavailable']=True
        rows.append(row)
    (root/'qa/country-outline-geometry.json').write_text(json.dumps({'method':'Cross-source geometry comparison only, not certification of sovereign or administrative boundaries. Natural Earth is a simplified reference; some compared sources derive from it.','results':rows},ensure_ascii=False,indent=2),encoding='utf-8')
    print('COUNTRY OUTLINES',len(rows),'compared',sum('referenceDifferencePct' in r for r in rows))
    sys.exit(0)

rows=[]
for entry in manifest:
    iso=entry['iso'];levels=entry['levels']
    if not levels or iso not in refs:continue
    first=levels[0]['level'];file=root/f'assets/boundary-cache/{iso}-{first}.json'
    if not file.exists():continue
    try:
        data=json.loads(file.read_text(encoding='utf-8'));reference=refs[iso];project=projection(reference)
        parent,invalid,bad=checked(data['features'],project);ref=project(shapely.make_valid(reference));ref=shapely.make_valid(ref)
        union=shapely.union_all(parent);size=ref.area or 1
        missing=ref.difference(union).area/size;extra=union.difference(ref).area/size;overlap=max(0,sum(g.area for g in parent)-union.area)/(union.area or 1)
        row={'iso':iso,'name':entry['name'],'level':first,'year':data.get('source',{}).get('year'),'invalidOriginalGeometries':invalid,'invalidCoordinates':bad,'referenceMissingPct':round(missing*100,2),'referenceExtraPct':round(extra*100,2),'siblingOverlapPct':round(overlap*100,3),'review':bool(bad or invalid or missing>.05 or extra>.03 or overlap>.001)}
        if len(levels)>1:
            childfile=root/f'assets/boundary-cache/{iso}-{levels[1]["level"]}.json'
            if childfile.exists():
                childdata=json.loads(childfile.read_text(encoding='utf-8'));children,ci,cb=checked(childdata['features'],project);tree=STRtree(parent);weak=0
                for child in children:
                    candidates=tree.query(child);best=max((child.intersection(parent[int(i)]).area for i in candidates),default=0)
                    if child.area and best/child.area<.90:weak+=1
                row.update(childLevel=levels[1]['level'],childCount=len(children),childrenWithLessThan90PctInOneParent=weak,invalidChildGeometries=ci,invalidChildCoordinates=cb)
                row['review']=row['review'] or bool(ci or cb or weak)
        rows.append(row)
    except Exception as exc:rows.append({'iso':iso,'name':entry['name'],'review':True,'error':str(exc)})
    report={'method':'Shapely validity, local equal-area comparison to independent Natural Earth 1:50m outlines, and child-parent area containment. Differences flag review, not proof of incorrect legal borders. Inputs can have different dates and shoreline simplification. Source geometry is not modified.','results':rows}
    (root/'qa/boundary-geometry-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'iso':iso,'checked':len(rows),'review':rows[-1]['review']},ensure_ascii=False),flush=True)
print('COMPLETE',len(rows),'country datasets;',sum(r['review'] for r in rows),'need source/geometry review')
