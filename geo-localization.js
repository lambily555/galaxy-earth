(()=>{
'use strict';
const data=window.ATLAS_NAMES,normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,\s*(County|City) of$/i,'').replace(/[¹²³]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const raw=f=>f.properties.name||f.properties.NAME_ZH||f.properties.shapeName||f.properties.ADMIN||'区域';
function get(f,iso){
 const p=f.properties,original=raw(f);if(p.ADM0_A3==='CHN')return {name:'中国',original:'中华人民共和国',translated:true};
 if(/[\u3400-\u9fff]/.test(original))return {name:original,original,translated:true};
 const country=data.countryCodes[p.shapeGroup||iso],sourceCode=String(p.shapeISO||''),explicit=/^[a-z]{2}-[a-z0-9]{1,4}$/i.test(sourceCode)?sourceCode.toLowerCase().replace('-',''):'';let code=data.codes[explicit]&&(!country||explicit.startsWith(country))?explicit:null;
 const depth=Number(String(p.shapeType||'').replace('ADM',''));
 if(!code&&country&&depth)for(const variant of original.split('/')){const candidate=data.aliases[country+'|'+depth+'|'+normalize(variant)];if(candidate){code=candidate;break;}}
 return {name:code?data.codes[code].zh:original,original,translated:!!code,code,source:code?data.source:null};
}
window.ATLAS_LOCALIZATION={get,raw};
})();
