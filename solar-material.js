import * as THREE from './vendor/three.module.js';
// Procedural photosphere illustration, not a live solar observation or scientific model.
export function solarMaterial(){return new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`
 varying vec3 point;varying vec3 normalView;varying vec3 eye;
 void main(){point=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);normalView=normalize(normalMatrix*normal);eye=normalize(-p.xyz);gl_Position=projectionMatrix*p;}
`,fragmentShader:`
 uniform float time;varying vec3 point;varying vec3 normalView;varying vec3 eye;
 float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){vec3 n=normalize(point);float broad=noise3(n*7.);float convection=noise3(n*31.+vec3(time*.009));float grain=noise3(n*165.+vec3(time*.025));float cells=smoothstep(.21,.76,grain);float brightness=.38+.30*broad+.32*cells;
 vec3 warm=mix(vec3(.57,.20,.035),vec3(1.,.80,.43),brightness);warm+=vec3(.10,.09,.055)*convection;
 float spot1=smoothstep(.994,.9996,dot(n,normalize(vec3(.40,-.25,.88))));float spot2=smoothstep(.998,.9998,dot(n,normalize(vec3(-.1,.18,.98))));warm*=1.-.75*spot1-.56*spot2;
 float limb=.47+.53*pow(max(0.,dot(normalize(normalView),normalize(eye))),.42);gl_FragColor=vec4(warm*limb,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }
`});}
