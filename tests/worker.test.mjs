import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Worker} from 'node:worker_threads';
const file=new URL('../map-worker.js',import.meta.url);
const source=(await readFile(file,'utf8')).replace("'./generator.js?v=world-four-rivers-1'",JSON.stringify(new URL('../generator.js',import.meta.url).href)).replaceAll('import.meta.url',JSON.stringify(file.href));
const bootstrap=`import {parentPort} from 'node:worker_threads';import {readFile} from 'node:fs/promises';globalThis.self={postMessage:data=>parentPort.postMessage(data)};globalThis.fetch=async url=>{parentPort.postMessage({fetch:String(url)});return {ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))};};${source};parentPort.on('message',data=>self.onmessage({data}));parentPort.postMessage({ready:true});`;
const worker=new Worker(new URL('data:text/javascript,'+encodeURIComponent(bootstrap)));
let sequence=0;const pending=new Map(),requests=[];let ready;
const started=new Promise(resolve=>{ready=resolve;});
worker.on('message',data=>{if(data.ready)ready();else if(data.fetch)requests.push(data.fetch);else {const resolve=pending.get(data.id);pending.delete(data.id);resolve(data);}});
const job=seed=>new Promise(resolve=>{const id=++sequence;pending.set(id,resolve);worker.postMessage({id,seed});});
try{
 await started;assert.equal(requests.length,0,'An idle worker must not fetch either terrain');
 const bad=await job('HS3-0');assert.ok(bad.error);assert.equal(requests.length,0,'Invalid seeds must not trigger downloads');
 const first=await job('HS2-123456789');assert.equal(first.map.worldGeneratorVersion,2);assert.equal(first.map.worldSeed,123456789);assert.equal(first.map.points.length,8831);assert.equal(requests.length,1);assert.match(requests[0],/world-hs2\.json/);
 const second=await job('HS2-42');assert.equal(second.map.worldSeed,42);assert.equal(requests.length,1,'Same-version generation reuses terrain');
 const old=await job('HS1-42');assert.equal(old.map.worldGeneratorVersion,1);assert.equal(old.map.worldSeed,42);assert.equal(requests.length,2);assert.match(requests[1],/world-hs1\.json/);
 console.log('Worker integration: idle/invalid seeds, actual HS1/HS2 generation, correlated replies and per-version caching passed.');
}finally{await worker.terminate();}
