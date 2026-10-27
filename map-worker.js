import {generateWorld,parseSeed} from './generator.js?v=world-four-rivers-1';
const assets=new Map();
const loadAsset=version=>{
 if(!assets.has(version))assets.set(version,fetch(new URL(`./assets/world-hs${version}.json?v=world-four-rivers-1`,import.meta.url)).then(response=>{if(!response.ok)throw new Error('Terrain could not be loaded. Please try again.');return response.json();}).catch(error=>{assets.delete(version);throw error;}));
 return assets.get(version);
};
self.onmessage=async({data:{id,seed}})=>{
 try{parseSeed(seed);const version=String(seed).trim().toUpperCase().startsWith('HS2-')?2:1;const asset=await loadAsset(version);self.postMessage({id,map:generateWorld(seed,asset)});}
 catch(error){self.postMessage({id,error:error.message});}
};
