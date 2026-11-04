'use strict';
const fs=require('node:fs'),path=require('node:path');
const folder=path.join(__dirname,'downloads/cldr'),version=fs.readFileSync(path.join(folder,'version.txt'),'utf8').trim();
const decode=s=>s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,v)=>v[0]==='#'?String.fromCodePoint(v[1].toLowerCase()==='x'?parseInt(v.slice(2),16):Number(v.slice(1))):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[v]));
function read(locale){const result={};for(const m of fs.readFileSync(path.join(folder,locale+'.xml'),'utf8').matchAll(/<subdivision\s+type="([^"]+)"([^>]*)>([^<]*)<\/subdivision>/g)){if(!/\balt=/.test(m[2]))result[m[1]]=decode(m[3]);}return result;}
const zh=read('zh'),en=read('en'),es=read('es'),parents={},depth={};
for(const m of fs.readFileSync(path.join(folder,'subdivisions.xml'),'utf8').matchAll(/<subgroup type="([^"]+)" contains="([^"]+)"/g))for(const child of m[2].split(' '))parents[child]=m[1];
function getDepth(code,seen=new Set()){if(depth[code])return depth[code];if(seen.has(code))return 0;seen.add(code);const p=parents[code];return depth[code]=!p?0:/^[A-Z]{2}$/.test(p)?1:1+getDepth(p,seen);}
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/,\s*(County|City) of$/i,'').replace(/[¹²³]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const codes={},aliases={},countryCodes={};for(const [code,chinese] of Object.entries(zh)){if(!en[code])continue;const d=getDepth(code);codes[code]={zh:chinese.replace(/[¹²³]/g,''),en:en[code].replace(/[¹²³]/g,''),depth:d};for(const text of [en[code],es[code]])if(text){const key=code.slice(0,2)+'|'+d+'|'+normalize(text);if(aliases[key]&&aliases[key]!==code)aliases[key]=null;else if(!(key in aliases))aliases[key]=code;}}
// Same administrative unit, source-language variants, linked to explicit CLDR ISO codes.
for(const [text,code] of Object.entries({'Ciudad Autónoma de Melilla':'esml','Ciudad Autónoma de Ceuta':'esce','Principado de Asturias':'esas','Comunitat Valenciana':'esvc','Illes Balears':'esib','Comunidad Foral de Navarra':'esnc'}))if(codes[code])aliases['es|1|'+normalize(text)]=code;
const countries=JSON.parse(fs.readFileSync(path.join(__dirname,'assets/countries.geojson'),'utf8')).features;
for(const f of countries){const p=f.properties,a2=p.ISO_A2_EH||p.ISO_A2;if(/^[A-Z]{2}$/.test(a2))countryCodes[p.ADM0_A3]=a2.toLowerCase();}
countryCodes.XKX='xk';countryCodes.SSD='ss';countryCodes.PSE='ps';countryCodes.ESH='eh';countryCodes.ALA='ax';
const data={source:'Unicode CLDR',version,url:'https://github.com/unicode-org/cldr/tree/'+version+'/common/subdivisions',license:'Unicode-3.0',codes,aliases,countryCodes};
fs.writeFileSync(path.join(__dirname,'geo-names.js'),'window.ATLAS_NAMES='+JSON.stringify(data)+';\n');console.log('Chinese names:',Object.keys(codes).length);
