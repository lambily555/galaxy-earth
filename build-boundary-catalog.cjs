'use strict';
// Refresh only public source metadata; boundary geometry stays on-demand in D-drive cache.
const fs=require('node:fs'),path=require('node:path');
const fields=['boundaryISO','boundaryType','boundaryCanonical','boundaryName','boundaryID','boundaryYearRepresented','admUnitCount','simplifiedGeometryGeoJSON','gjDownloadURL','boundaryLicense','licenseSource','boundarySource'];
(async()=>{
 const input=process.argv[2];let rows;
 if(input)rows=JSON.parse(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));
 else{const response=await fetch('https://www.geoboundaries.org/api/current/gbOpen/ALL/ALL/',{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error('Catalog HTTP '+response.status);rows=await response.json();}
 if(!Array.isArray(rows)||!rows.length)throw Error('Empty boundary catalog');
 const seen=new Set(),layers=rows.filter(r=>{const key=r.boundaryISO+'-'+r.boundaryType;if(!/^[A-Z]{3}$/.test(r.boundaryISO)||!/^ADM[0-5]$/.test(r.boundaryType)||seen.has(key))return false;seen.add(key);return true;}).map(r=>Object.fromEntries(fields.map(k=>[k,r[k]||''])));
 const data={provider:'geoBoundaries gbOpen',retrieved:new Date().toISOString(),source:'https://www.geoboundaries.org/api/current/gbOpen/ALL/ALL/',layers};
 fs.writeFileSync(path.join(__dirname,'assets','boundary-catalog.json'),JSON.stringify(data));
 console.log('Boundary catalog:',new Set(layers.map(x=>x.boundaryISO)).size,'countries/territories,',layers.length,'layers');
})().catch(e=>{console.error(e);process.exitCode=1;});
