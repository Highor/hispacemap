import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateWorld,parseSeed,RandomStream,Terrain} from '../generator.js';
const assets=JSON.parse(readFileSync(new URL('../assets/world-hs1.json',import.meta.url)));
const references=JSON.parse(readFileSync(new URL('./hs1-reference.json',import.meta.url)));
const thirdWorldReferences=JSON.parse(readFileSync(new URL('./world-three-reference.json',import.meta.url)));
for(const bad of ['','HS3-1','HS1-0','HS1--1','HS1-2147483648','HS1-1x'])assert.throws(()=>parseSeed(bad));
assert.equal(parseSeed(' hs1-42 '),42);
for(const ref of references){
 const map=generateWorld(ref.seed,assets);
 assert.equal(map.points.length,ref.points.length+38+5+3456+64+96+192+59+map.points.filter(p=>p.kind==='Enemy'&&p.id>=800).length+map.points.filter(p=>p.kind==='Flying enemy').length+map.points.filter(p=>['Abandoned house','Cabin medkit','Frontier ruin','Frontier medkit','Frontier ammo'].includes(p.kind)).length,ref.seed+' doubled resource count');
 for(const [kind,id,oldX,y] of ref.points){
  // Opening the eastern ridge changes slope-based World 2 vegetation selection.
  if(kind==='Vitraleaf'&&id>=48)continue;
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
assert.equal(assets.collision.length,3);
for(const ref of thirdWorldReferences){
 const map=generateWorld(ref.seed,assets);
 for(const expected of ref.points){const actual=map.points.find(p=>p.kind===expected.kind&&p.id===expected.id);assert.ok(actual&&Math.hypot(actual.x-expected.x,actual.y-expected.y,actual.z-expected.z)<.025,`${ref.seed}: ${expected.kind} ${expected.id} differs from current Unreal terrain`);}
 for(const kind of ['Teleport cache','Teleport receiver','World 3 pass west','World 3 pass east'])assert.equal(map.points.filter(p=>p.kind===kind).length,1);
 assert.ok(map.points.filter(p=>p.kind==='Danger sign').every(p=>p.x<3000));
 const terrain=new Terrain(assets.collision);
 for(let x=597500;x<=606000;x+=250){const hit=terrain.hit({x,y:0});assert.ok(hit&&Math.abs(hit.z-2000)<2&&hit.normal>.94,'World 3 tunnel terrain is continuous');}
 assert.equal(map.worldThree.centerX,8000);assert.equal(map.worldThreePass.lengthMetres,50);
}
console.log('World 3 terrain, unsigned pass, one sender cache and receiver match current native exports.');
assert.notDeepEqual(generateWorld('HS1-1',assets).points,generateWorld('HS1-42',assets).points);
console.log('HS1 generator checks passed.');
const abandonedReference=JSON.parse(readFileSync(new URL('./abandoned-reference.json',import.meta.url)));
const abandonedMap=generateWorld(abandonedReference.seed,assets);
for(const ref of abandonedReference.points){const p=abandonedMap.points.find(p=>p.kind===ref.kind&&p.id===ref.id);assert.ok(p&&Math.hypot(p.x-ref.x,p.y-ref.y,p.z-ref.z)<.025,`Abandoned site ${ref.kind} ${ref.id} differs from Unreal`);}
for(const ref of references){const m=generateWorld(ref.seed,assets),houses=m.points.filter(p=>p.kind==='Abandoned house');assert.equal(houses.filter(p=>p.x<2000).length,24);assert.equal(houses.filter(p=>p.x>=2000).length,24);assert.equal(m.points.filter(p=>p.kind==='Cabin medkit').length,4);}
console.log('Abandoned houses and rare medkits match Unreal; 24 houses and two medkits per world across all fixture seeds.');
const faunaReference=JSON.parse(readFileSync(new URL('./fauna-reference.json',import.meta.url)));
const faunaMap=generateWorld(faunaReference.seed,assets);
for(const ref of faunaReference.points){const p=faunaMap.points.find(p=>p.kind==='Enemy'&&p.id===ref.id);assert.ok(p&&Math.hypot(p.x-ref.x,p.y-ref.y)<.025&&p.species===ref.species&&p.pack===ref.pack&&p.remaining===ref.remaining,`Fauna ${ref.species} ${ref.id} differs from Unreal`);}
for(const ref of references){const fauna=generateWorld(ref.seed,assets).points.filter(p=>p.id>=1200&&p.id<2000&&p.kind==='Enemy'),packs=new Map();for(const p of fauna){assert.ok(p.x>2000);packs.set(p.pack,(packs.get(p.pack)||0)+1);}assert.equal(packs.size,176);assert.ok([...packs.values()].every(n=>n>=2&&n<=4));for(const species of ['Riftstalker','Prismback','Ashmaw','Duskmantis'])assert.equal(new Set(fauna.filter(p=>p.species===species).map(p=>p.pack)).size,44);}
console.log('Four new fauna species: native positions, HP, IDs and pack membership match; every fixture has 176 packs of two to four.');

const additions=JSON.parse(readFileSync(new URL('./resource-additions-reference.json',import.meta.url)));
const expanded=generateWorld('HS1-123456789',assets);
assert.equal(additions.length,3808);
for(const [kind,id,x,y] of additions){const p=expanded.points.find(p=>p.kind===kind&&p.id===id);assert.ok(p&&Math.hypot(p.x-x,p.y-y)<.02,`Additional ${kind} ${id} differs from Unreal`);}
console.log('All 3808 added resource sites match Unreal within 2 cm.');

for(const seed of ['HS1-1','HS1-42','HS1-123456789']){
 const p=generateWorld(seed,assets).points;
 assert.equal(p.filter(p=>p.kind==='Enemy'&&p.id<800).length,28);
 assert.equal(p.filter(p=>p.kind==='Settlement capsule').length,4);
 assert.equal(p.filter(p=>p.kind==='Settlement chest').length,1);
 assert.equal(p.filter(p=>p.kind==='Medical regulator').length,1);
 const f=p.filter(p=>p.kind==='Flying enemy'&&p.id<2000);assert.ok(f.length>=51&&f.length<=127);assert.ok(f.every(p=>p.x>2000&&p.x<4000&&p.remaining===100));
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

for(const seed of ['HS1-1','HS1-42','HS1-123456789']){
 const points=generateWorld(seed,assets).points,fields=points.filter(p=>p.kind==='Sulphrite');
 assert.equal(fields.length,4);assert.deepEqual(fields.map(p=>p.id),[128,129,130,131]);
 for(let i=0;i<4;i++){assert.ok(Math.hypot(fields[i].x-4000,fields[i].y)<500);for(let j=0;j<i;j++)assert.ok(Math.hypot(fields[i].x-fields[j].x,fields[i].y-fields[j].y)>400);}
 const guard=points.filter(p=>p.kind==='Enemy'&&p.id===708);assert.equal(guard.length,1);assert.equal(guard[0].remaining,340);
}
console.log('Four spaced central Sulphrite fields and one Ridgeback match every seed.');

for(const seed of ['HS1-1','HS1-42','HS1-123456789']){
 const p=generateWorld(seed,assets).points;assert.equal(p.filter(p=>p.kind==='Asterion Spire').length,1);
 for(let room=0;room<40;room++){const enemies=p.filter(q=>q.kind==='Enemy'&&q.id>=800+room*4&&q.id<804+room*4);assert.ok(enemies.length>=1&&enemies.length<=4);assert.ok(enemies.every(q=>q.remaining===272));}
 assert.equal(p.filter(p=>p.kind==='Cargo module').length,1);assert.equal(p.filter(p=>p.kind==='Survey module').length,1);
}
console.log('Asterion Spire: forty room packs, seeded modules and loot verified.');

const towerReference=JSON.parse(readFileSync(new URL('./tower-reference.json',import.meta.url)));for(const q of towerReference){const p=expanded.points.find(p=>p.kind===q.kind&&p.id===q.id);assert.ok(p&&Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<.025,'Tower placement differs from native: '+q.kind+' '+q.id);}
console.log('Native tower enemy seats, loot and both random modules match within 2.5cm.');

for(const seed of ['HS1-123456789','HS1-42','HS1-987654321']){const map=generateWorld(seed,assets),kits=map.points.filter(p=>p.kind==='Tower medkit'),tower=map.points.find(p=>p.kind==='Asterion Spire');assert.equal(kits.length,4);assert.equal(new Set(kits.map(p=>Math.floor((p.z-tower.z+.001)/4))).size,4);assert.ok(kits.every(p=>p.z<tower.z+36));}

{const map=generateWorld('HS1-123456789',assets);for(const native of assets.points.filter(p=>p.kind==='Tower medkit')){const web=map.points.find(p=>p.kind===native.kind&&p.id===native.id);assert.ok(Math.hypot(native.x-web.x,native.y-web.y,native.z-web.z)<.025,'Native medkit coordinate mismatch');}}

const northNative=JSON.parse(readFileSync(new URL('./north-relay-reference.json',import.meta.url)));const northWeb=generateWorld('HS1-201026',assets).points.find(p=>p.kind==='North relay');assert.ok(Math.hypot(northNative.x-northWeb.x,northNative.y-northWeb.y,northNative.z-northWeb.z)<.025,'Northern solar house matches Unreal');for(const ref of references){const map=generateWorld(ref.seed,assets),relay=map.points.filter(p=>p.kind==='North relay');assert.equal(relay.length,1);assert.ok(relay[0].x>2200&&relay[0].y< -500);}console.log('Northern solar service house matches Unreal and exists once on every fixture seed.');

for(const ref of references){const m=generateWorld(ref.seed,assets),fauna=m.points.filter(p=>p.kind==='Enemy'&&p.id>=1200&&p.id<2000);assert.ok(fauna.every(p=>!(p.x>=5780&&Math.abs(p.y)<=140)));for(const test of [p=>p.x<4000,p=>p.x>=4000,p=>p.y<0,p=>p.y>=0])assert.ok(new Set(fauna.filter(test).map(p=>p.pack)).size>50);}
console.log('Dense fauna covers both axes and excludes the World 3 tunnel for every reference seed.');

const denseNative=JSON.parse(readFileSync(new URL('./dense-fauna-reference.json',import.meta.url)));const denseWeb=generateWorld(denseNative.seed,assets);for(const p of denseNative.points){const q=denseWeb.points.find(q=>q.kind==='Enemy'&&q.id===p.id);assert.ok(q&&Math.hypot(q.x-p.x,q.y-p.y)<.025&&q.pack===p.pack&&q.species===p.species&&q.remaining===p.remaining,'Dense fauna differs from native '+p.id);}
console.log('All 517 original and added enemies match fresh native positions, species, HP and pack IDs within 2.5cm.');

for(const seed of ['HS1-42','HS1-123456789']){const m=generateWorld(seed,assets);assert.equal(m.points.filter(p=>['Cobaltite','Pyronite','Crythium'].includes(p.kind)).length,36);assert.equal(m.points.filter(p=>p.kind==='Rocket launch site').length,1);assert.equal(new Set(m.points.filter(p=>p.id>=2000&&p.id<3000&&p.pack>=6000&&p.species!=='Stinger').map(p=>p.species)).size,9);}
console.log('World 3 rocket site, three advanced ores and mixed nine-species population verified.');
const rocketNative=JSON.parse(readFileSync(new URL('./rocket-fauna-reference.json',import.meta.url))),rocketWeb=generateWorld('HS1-201026',assets);for(const p of rocketNative){const q=rocketWeb.points.find(q=>q.id===p.id&&q.pack>=6000);assert.ok(q&&Math.hypot(p.x-q.x,p.y-q.y)<.025,'World 3 enemy differs from native: '+p.id);}console.log('All 465 World 3 enemy positions match native within 2.5 cm.');

const hs2=JSON.parse(readFileSync(new URL('../assets/world-hs2.json',import.meta.url)));
assert.equal(parseSeed('HS2-42'),42);
const oldTerrain=new Terrain(assets.collision),newTerrain=new Terrain(hs2.collision);
assert.equal(newTerrain.height({x:800000,y:0}),oldTerrain.height({x:800000,y:0}));
assert.equal(newTerrain.height({x:602000,y:0}),oldTerrain.height({x:602000,y:0}));
assert.ok(newTerrain.height({x:710000,y:-60000})-oldTerrain.height({x:710000,y:-60000})>1000);
for(const [x,y] of [[710000,-60000],[865000,-70000],[900000,60000],[740000,100000],[820000,90000],[700000,50000]]){
 const top=newTerrain.height({x,y});assert.ok(newTerrain.hit({x,y}).normal>.999);
 assert.ok(top-newTerrain.height({x:x-1300,y})>150,'Booster shelf rises over ordinary step height');
}
const second=generateWorld('HS2-201026',hs2);assert.equal(second.worldGeneratorVersion,2);assert.equal(second.seedId,'HS2-201026');
assert.deepEqual(second.points.filter(p=>p.x<5780),generateWorld('HS1-201026',assets).points.filter(p=>p.x<5780));
console.log('HS2 relief, protected sites, booster shelves and old-world stability passed');

const hs2Native=JSON.parse(readFileSync(new URL('./hs2-fauna-reference.json',import.meta.url)));
for(const p of hs2Native){const q=second.points.find(q=>q.id===p.id&&q.pack>=6000);assert.ok(q&&Math.hypot(p.x-q.x,p.y-q.y)<.025,'HS2 fauna differs from native '+p.id);}
assert.equal(second.points.filter(q=>q.pack>=6000).length,hs2Native.length);
assert.ok(second.snapshot.includes('HS2-201026'));
console.log('HS2 native fauna matches all '+hs2Native.length+' enemies within 2.5 cm.');

const foundry=generateWorld("HS1-201026",assets).points.filter(p=>p.kind==='The Hollow Foundry');assert.equal(foundry.length,1);assert.equal(foundry[0].x,6280);assert.equal(foundry[0].y,-100);assert.equal(foundry[0].remaining,30);

const frontierReference=JSON.parse(readFileSync(new URL('./frontier-reference.json',import.meta.url)));
const frontierMap=generateWorld(frontierReference.seed,hs2).points.filter(p=>p.kind.startsWith('Frontier '));
assert.equal(frontierMap.length,42);
for(const p of frontierReference.points){const q=frontierMap.find(q=>q.kind===p.kind&&q.id===p.id);assert.ok(q&&Math.hypot(q.x-p.x,q.y-p.y)<.025&&Math.abs(q.z-p.z)<.025&&q.remaining===p.remaining,'Frontier marker differs from native '+p.kind+' '+p.id);}
console.log('All 24 World 3 ruins and 18 supplies match the native runtime within 2.5 cm.');
