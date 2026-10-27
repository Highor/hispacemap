// No worker or terrain request is started until the user accepts the spoiler gate.
let worker,sequence=0;
const pending=new Map();
export function requestWorld(seed){
 if(!worker){
  worker=new Worker(new URL('./map-worker.js?v=readable-text-1',import.meta.url),{type:'module'});
  worker.onmessage=({data})=>{const job=pending.get(data.id);if(!job)return;pending.delete(data.id);if(data.error)job.reject(new Error(data.error));else job.resolve(data.map);};
  worker.onerror=()=>{worker.terminate();worker=null;for(const job of pending.values())job.reject(new Error('Map generator could not start. Please try again.'));pending.clear();};
 }
 const id=++sequence;
 return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,seed});});
}
