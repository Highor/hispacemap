import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateWorld} from '../generator.js';
const sites=JSON.parse(fs.readFileSync(new URL('./relief-reference.json',import.meta.url)));
for(const version of [1,2]){
 const asset=JSON.parse(fs.readFileSync(new URL(`../assets/world-hs${version}.json`,import.meta.url)));
 for(const seed of [201026,123456789]){
  const world=generateWorld(`HS${version}-${seed}`,asset),drop=world.points.filter(p=>p.kind==='Skyward relief drop'),pods=world.points.filter(p=>p.kind==='Amberheart Pods');
  assert.equal(drop.length,1);assert.equal(pods.length,48);assert.ok(Math.abs(Math.hypot(drop[0].x-20000,drop[0].y)-1200)<.01);
  pods.forEach((p,i)=>{const native=sites.pods[i];assert.equal(p.id,4100+i);assert.ok(Math.abs(p.x-(20000+native[0]/100))<.001);assert.ok(Math.abs(p.y-native[1]/100)<.001);assert.ok(Math.max(Math.abs(p.x-20000),Math.abs(p.y))>=1500);assert.equal(p.remaining,3);});
 }
}
console.log('RELIEF_MAP_PARITY_OK');
