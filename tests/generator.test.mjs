import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateWorld,parseSeed,RandomStream,Terrain} from '../generator.js';
const assets=JSON.parse(readFileSync(new URL('../assets/world-hs1.json',import.meta.url)));
const references=JSON.parse(readFileSync(new URL('./hs1-reference.json',import.meta.url)));
for(const bad of ['','HS2-1','HS1-0','HS1--1','HS1-2147483648','HS1-1x'])assert.throws(()=>parseSeed(bad));
assert.equal(parseSeed(' hs1-42 '),42);
for(const ref of references){
 const map=generateWorld(ref.seed,assets);
 assert.equal(map.points.length,ref.points.length+3456+64+96+192+46+map.points.filter(p=>p.kind==='Flying enemy').length,ref.seed+' doubled resource count');
 for(const [kind,id,oldX,y] of ref.points){
  const x=kind==='Tunnel 1'?assets.passMountains.west:kind==='Tunnel 2'?assets.passMountains.east:oldX;
  const point=map.points.find(p=>p.kind===kind&&p.id===id);
  // Static enemy markers intentionally share id 0; validate their geometry by nearest point.
  const candidates=map.points.filter(p=>p.kind===kind&&(kind==='Enemy'||p.id===id));
  assert.ok(point && candidates.some(p=>Math.hypot(p.x-x,p.y-y)<.02),`${ref.seed}: ${kind} ${id} differs from Unreal`);
 }
 assert.equal(map.points.filter(p=>p.kind==='Hydrite').length,2304);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf').length,384);
 for(const [kind,count] of [['Iron',32],['Bronze',32],['Asterium',32],['Vesperite',32],['Glass',192],['Verdite',2304]])assert.equal(map.points.filter(p=>p.kind===kind).length,count);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf'&&p.x<2000).length,96);
 assert.equal(map.points.filter(p=>p.kind==='Vitraleaf'&&p.x>=2000).length,288);
 const minerals=map.points.filter(p=>['Hydrite','Verdite'].includes(p.kind)).sort((a,b)=>a.id-b.id);
 const groups=points=>{const result=[];for(const p of points){const group=result.at(-1),last=group?.at(-1);if(!last||Math.hypot(p.x-last.x,p.y-last.y)>=4)result.push([p]);else group.push(p);}return result;};
 const originals=minerals.slice(0,1152),added=minerals.slice(1152),originalGroups=groups(originals),addedGroups=groups(added);
 assert.equal(addedGroups.length,originalGroups.length*3,'Three added locations per original group');
 for(let g=0;g<addedGroups.length;g++){
  assert.equal(addedGroups[g].length,originalGroups[g%originalGroups.length].length,'Original group sizes retained');
  assert.deepEqual(addedGroups[g].map(p=>p.kind),originalGroups[g%originalGroups.length].map(p=>p.kind),'New locations duplicate each resource type count');
  for(const p of addedGroups[g])for(const q of [...originals,...addedGroups.slice(0,g).flat()])assert.ok(Math.hypot(p.x-q.x,p.y-q.y)>=(g<originalGroups.length?50:40),'New groups are separated from existing locations');
 }
 assert.deepEqual(generateWorld(ref.seed,assets),map,'repeatability');
 console.log(ref.seed+': original HS1 placements retained; '+originalGroups.length+' original + '+addedGroups.length+' new mineral locations');
}
assert.notDeepEqual(generateWorld('HS1-1',assets).points,generateWorld('HS1-42',assets).points);
console.log('HS1 generator checks passed.');

const additions=JSON.parse(readFileSync(new URL('./resource-additions-reference.json',import.meta.url)));
const expanded=generateWorld('HS1-123456789',assets);
assert.equal(additions.length,3808);
for(const [kind,id,x,y] of additions){const p=expanded.points.find(p=>p.kind===kind&&p.id===id);assert.ok(p&&Math.hypot(p.x-x,p.y-y)<.02,`Additional ${kind} ${id} differs from Unreal`);}
console.log('All 3808 added resource sites match Unreal within 2 cm.');

for(const seed of ['HS1-1','HS1-42','HS1-123456789']){
 const p=generateWorld(seed,assets).points;
 assert.equal(p.filter(p=>p.kind==='Enemy').length,27);
 assert.equal(p.filter(p=>p.kind==='Settlement capsule').length,4);
 assert.equal(p.filter(p=>p.kind==='Settlement chest').length,1);
 assert.equal(p.filter(p=>p.kind==='Medical regulator').length,1);
 const f=p.filter(p=>p.kind==='Flying enemy');assert.ok(f.length>=51&&f.length<=127);assert.ok(f.every(p=>p.x>2000&&p.x<4000&&p.remaining===100));
 assert.equal(f.filter(p=>Math.hypot(p.x-2350,p.y+180)<4).length,3);
}
console.log('Western settlement and seeded stinger checks passed.');

// Terrain-only relief update retains every existing HS1 XY/ID fixture above.
const terrain=new Terrain(assets.collision);let low=Infinity,high=-Infinity;
for(let x=-150000;x<=150000;x+=12500)for(let y=-150000;y<=150000;y+=12500)if(Math.hypot(x,y)<180000){const h=terrain.hit({x:400000+x,y});assert.ok(h&&h.normal>=.9);low=Math.min(low,h.z);high=Math.max(high,h.z);}
assert.ok(high-low>2000,'Second basin has at least 20 m of walkable relief');
for(const [x,y] of [[4000,0],[3500,-500],[4500,500]]){const index=Math.round((y+2500)/125)*37+Math.round((x-2000)/125);assert.ok(Math.abs(assets.worldTwo.terrain[index]-terrain.height({x:x*100,y:y*100})/100)<.11,'Display heights match the collision mesh');}
console.log('World 2 relief and display/collision agreement passed.');

for(const seed of ['HS1-1','HS1-42','HS1-123456789']){
 const map=generateWorld(seed,assets),wild=map.points.filter(p=>p.id>=200&&p.id<700&&['Enemy','Flying enemy'].includes(p.kind));
 assert.equal(wild.filter(p=>p.kind==='Enemy').length,4);
 assert.ok(wild.filter(p=>p.kind==='Flying enemy').length>=28);
 for(const p of wild){assert.ok(p.x<4000&&Math.hypot(p.x-4000,p.y)<1852);for(const [x,y] of [[2350,-180],[2750,-850],[2197.5,112.5],[2130,26]])assert.ok(Math.hypot(p.x-x,p.y-y)>198);}
}
console.log('Expanded west wildlife density and mission exclusion checks passed.');

const wildlife=JSON.parse(readFileSync(new URL('./west-wildlife-reference.json',import.meta.url)));
for(const [kind,id,x,y,hp] of wildlife){const p=expanded.points.find(p=>p.kind===kind&&p.id===id);assert.ok(p&&Math.hypot(p.x-x,p.y-y)<.02&&p.remaining===hp,`Western wildlife ${kind} ${id} differs from Unreal`);}
console.log('Western wildlife matches fresh Unreal positions within 2 cm.');

assert.equal(assets.passMountains.west,1975);assert.equal(assets.passMountains.east,2025);assert.equal(assets.passMountains.lengthMetres,50);
assert.ok(assets.passMountains.surface.length>2000);
for(const p of assets.passMountains.surface){assert.ok(p.xy.every(([x,y])=>Math.abs(y)>=2.4999),'Mountain triangles preserve the 5 m centre opening');}
assert.deepEqual(expanded.points.filter(p=>p.kind==='Module record').map(p=>[p.x,p.y]),[[2129.6,25.2]]);
assert.deepEqual(expanded.points.filter(p=>p.kind==='Settlement capsule').map(p=>[p.x,p.y]),[[2185,100],[2185,125],[2210,100],[2210,125]]);
console.log('Actual pass mouths, 5 m gap and unchanged mission locations verified.');

const routes=new Set();
for(const seed of ['HS1-1','HS1-42','HS1-123456789','HS1-777777777']){
 const map=generateWorld(seed,assets),{houses,keys}=map.villageRoute;
 assert.equal(houses[0],5);assert.deepEqual(houses.slice(-2),[3,4]);assert.equal(new Set(houses).size,6);assert.equal(new Set(keys).size,5);assert.notEqual(houses.slice(1,4).join(),'0,1,2');assert.notEqual(keys.join(),'0,1,2,3,4');routes.add(houses.join()+keys.join());
 for(let i=0;i<5;i++){const key=map.points.find(p=>p.kind==='Access key'&&p.id===keys[i]),house=map.points.find(p=>p.kind==='Outpost cabin'&&p.id===houses[i]);assert.ok(Math.hypot(key.x-house.x,key.y-house.y)<3);}
}
assert.ok(routes.size>1);console.log('Seeded key routes are nonsequential, solvable and preserve late rewards.');

const nativeKeys=JSON.parse(readFileSync(new URL('./shuffled-keys-reference.json',import.meta.url)));
for(const [id,x,y,z] of nativeKeys){const p=expanded.points.find(p=>p.kind==='Access key'&&p.id===id);assert.ok(p&&Math.hypot(p.x-x,p.y-y)<.02&&Math.abs(p.z-z)<.02,`Shuffled key ${id} differs from Unreal`);}
console.log('Seeded key placements match fresh Unreal export within 2 cm.');

const southern=generateWorld('HS1-123456789',assets).points.filter(p=>p.kind==='Southern crash field');
assert.equal(southern.length,1);assert.equal(southern[0].x,4200);assert.equal(southern[0].y,1450);

for(const seed of [1,42,123456789]){const guards=generateWorld(`HS1-${seed}`,assets).points.filter(p=>p.kind==='Enemy'&&p.id>=700&&p.id<708);assert.equal(guards.length,8);for(const p of guards){assert.equal(p.remaining,170);assert.ok(Math.abs(Math.hypot(p.x-4200,p.y-1450)-30)<.02);}}
console.log('Eight dormant Shardmaws are visible with 170 HP on every seed.');
