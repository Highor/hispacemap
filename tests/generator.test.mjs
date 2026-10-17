import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateWorld,parseSeed,RandomStream} from '../generator.js';
const assets=JSON.parse(readFileSync(new URL('../assets/world-hs1.json',import.meta.url)));
const references=JSON.parse(readFileSync(new URL('./hs1-reference.json',import.meta.url)));
for(const bad of ['','HS2-1','HS1-0','HS1--1','HS1-2147483648','HS1-1x'])assert.throws(()=>parseSeed(bad));
assert.equal(parseSeed(' hs1-42 '),42);
for(const ref of references){
 const map=generateWorld(ref.seed,assets);
 assert.equal(map.points.length,ref.points.length,ref.seed+' point count');
 for(const [kind,id,x,y] of ref.points){
  const point=map.points.find(p=>p.kind===kind&&p.id===id);
  // Static enemy markers intentionally share id 0; validate their geometry by nearest point.
  const candidates=map.points.filter(p=>p.kind===kind&&p.id===id);
  assert.ok(point && candidates.some(p=>Math.hypot(p.x-x,p.y-y)<.02),`${ref.seed}: ${kind} ${id} differs from Unreal`);
 }
 assert.equal(map.points.filter(p=>p.kind==='Hydrite').length,576);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf').length,192);
 assert.deepEqual(generateWorld(ref.seed,assets),map,'repeatability');
 console.log(ref.seed+': '+map.points.length+' Unreal placements matched within 2 cm');
}
assert.notDeepEqual(generateWorld('HS1-1',assets).points,generateWorld('HS1-42',assets).points);
console.log('HS1 generator checks passed.');
