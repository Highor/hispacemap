import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateWorld,parseSeed,RandomStream} from '../generator.js';
const assets=JSON.parse(readFileSync(new URL('../assets/world-hs1.json',import.meta.url)));
const references=JSON.parse(readFileSync(new URL('./hs1-reference.json',import.meta.url)));
for(const bad of ['','HS2-1','HS1-0','HS1--1','HS1-2147483648','HS1-1x'])assert.throws(()=>parseSeed(bad));
assert.equal(parseSeed(' hs1-42 '),42);
for(const ref of references){
 const map=generateWorld(ref.seed,assets);
 assert.equal(map.points.length,ref.points.length+1152+64+96+192,ref.seed+' doubled resource count');
 for(const [kind,id,x,y] of ref.points){
  const point=map.points.find(p=>p.kind===kind&&p.id===id);
  // Static enemy markers intentionally share id 0; validate their geometry by nearest point.
  const candidates=map.points.filter(p=>p.kind===kind&&p.id===id);
  assert.ok(point && candidates.some(p=>Math.hypot(p.x-x,p.y-y)<.02),`${ref.seed}: ${kind} ${id} differs from Unreal`);
 }
 assert.equal(map.points.filter(p=>p.kind==='Hydrite').length,1152);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf').length,384);
 for(const [kind,count] of [['Iron',32],['Bronze',32],['Asterium',32],['Vesperite',32],['Glass',192],['Verdite',1152]])assert.equal(map.points.filter(p=>p.kind===kind).length,count);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf'&&p.x<2000).length,96);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf'&&p.x>=2000).length,288);
 const minerals=map.points.filter(p=>['Hydrite','Verdite'].includes(p.kind)).sort((a,b)=>a.id-b.id);
 const groups=points=>{const result=[];for(const p of points){const group=result.at(-1),last=group?.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=4)result.push([p]);else group.push(p);}return result;};
 const originals=minerals.slice(0,1152),added=minerals.slice(1152),originalGroups=groups(originals),addedGroups=groups(added);
 assert.equal(addedGroups.length,originalGroups.length,'Exactly one new location per original group');
 for(let g=0;g<originalGroups.length;g++){
  assert.equal(addedGroups[g].length,originalGroups[g].length,'Original group sizes retained');
  assert.deepEqual(addedGroups[g].map(p=>p.kind),originalGroups[g].map(p=>p.kind),'New locations duplicate each resource type count');
  for(const p of addedGroups[g])for(const q of [...originals,...addedGroups.slice(0,g).flat()])assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=50,'New groups are at least 50 m from existing locations');
 }
 assert.deepEqual(generateWorld(ref.seed,assets),map,'repeatability');
 console.log(ref.seed+': original HS1 placements retained; '+originalGroups.length+' original + '+addedGroups.length+' new mineral locations');
}
assert.notDeepEqual(generateWorld('HS1-1',assets).points,generateWorld('HS1-42',assets).points);
console.log('HS1 generator checks passed.');

const additions=JSON.parse(readFileSync(new URL('./resource-additions-reference.json',import.meta.url)));
const expanded=generateWorld('HS1-123456789',assets);
assert.equal(additions.length,1504);
for(const [kind,id,x,y] of additions){const p=expanded.points.find(p=>p.kind===kind&&p.id===id);assert.ok(p&&Math.hypot(p.x-x,p.y-y)<.02,`Additional ${kind} ${id} differs from Unreal`);}
console.log('All 1504 added resource sites match Unreal within 2 cm.');
