// HS1 placement, matching Hispace UE 5.7.3. Units inside the generator: centimetres.
const f=Math.fround, PI=f(Math.PI), TAU=f(2*PI);
const sin=a=>f(Math.sin(a)), cos=a=>f(Math.cos(a));
const polar=(a,r,ox=0)=>({x:f(ox+f(cos(a)*r)),y:f(sin(a)*r),z:0});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function parseSeed(text){const m=/^HS1-([1-9][0-9]{0,9})$/.exec(String(text).trim().toUpperCase());if(!m||Number(m[1])>2147483647)throw Error('Enter an HS1 world seed, for example HS1-123456789.');return Number(m[1]);}
export function subseed(seed,salt){let v=(seed^salt)>>>0;v=(v^(v>>>16))>>>0;v=Math.imul(v,0x7feb352d)>>>0;v=(v^(v>>>15))>>>0;v=Math.imul(v,0x846ca68b)>>>0;v=(v^(v>>>16))>>>0;return v%1000000+1;}
export class RandomStream{
 constructor(seed){this.seed=seed>>>0;}
 fraction(){this.seed=(Math.imul(this.seed,196314165)+907633515)>>>0;return (this.seed>>>9)/8388608;}
 range(a,b){return a+(b-a)*this.fraction();}
 integer(a,b){return a+Math.trunc(f(this.fraction()*(b-a+1)));}
}
const cell=(axis,value)=>{let lo=0,hi=axis.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(axis[mid]<=value)lo=mid;else hi=mid;}return lo;};
export class Terrain{
 constructor(grids){this.grids=grids;}
 hit(p){
  const second=p.x>=200000&&p.x<=650000&&Math.abs(p.y)<=250000;
  if(!second&&(Math.abs(p.x)>250000||Math.abs(p.y)>250000))return null;
  const g=this.grids[second?1:0],x=p.x-(second?400000:0),y=p.y;
  if(x<g.xs[0]||x>g.xs.at(-1)||y<g.ys[0]||y>g.ys.at(-1))return null;
  const i=cell(g.xs,x),j=cell(g.ys,y),n=g.xs.length;
  const dx=g.xs[i+1]-g.xs[i],dy=g.ys[j+1]-g.ys[j],u=(x-g.xs[i])/dx,v=(y-g.ys[j])/dy;
  const a=g.z[j*n+i],b=g.z[j*n+i+1],c=g.z[(j+1)*n+i],d=g.z[(j+1)*n+i+1];
  const zx=u>=v?(b-a)/dx:(d-c)/dx,zy=u>=v?(d-b)/dy:(c-a)/dy;
  return {z:u>=v?a+(b-a)*u+(d-b)*v:a+(d-c)*u+(c-a)*v,normal:1/Math.hypot(zx,zy,1)};
 }
 height(p){return f(this.hit(p)?.z||0);}
 valid(p,slope){const h=this.hit(p);return h&&h.normal>=f(slope);}
}
export function generateWorld(seedText,asset){
 const seed=parseSeed(seedText),terrain=new Terrain(asset.collision),random=salt=>new RandomStream(subseed(seed,salt));
 let r=random(101),a=f(r.range(0,TAU));const cache1=polar(a,9000);
 r=random(102);const cache2=polar(f(Math.atan2(cache1.y,cache1.x)+PI+r.range(f(-.55),f(.55))),11000);
 r=random(103);const start=f(r.range(0,TAU));let best=Infinity,cache3;
 for(let t=0;t<32;t++){const p=polar(f(start+f(f(f(t*2)*PI)/32)),18000);const slope=f(Math.max(Math.abs(f(terrain.height({x:p.x+200,y:p.y})-terrain.height({x:p.x-200,y:p.y}))),Math.abs(f(terrain.height({x:p.x,y:p.y+200})-terrain.height({x:p.x,y:p.y-200}))))/400);if(slope<best){best=slope;cache3=p;}if(slope<f(.35))break;}
 r=random(104);const suit=polar(f(r.range(0,TAU)),40000),angle=f(Math.atan2(suit.y,suit.x)+1);let research=polar(angle,100000);
 for(let t=0;t<100;t++){const p=polar(f(angle+f(t*f(.31))),100000),z=[];for(const x of [-270,270])for(const y of [-200,200])z.push(terrain.height({x:p.x+x,y:p.y+y}));if(f(Math.max(...z)-Math.min(...z))<50){research=p;break;}}
 const industrySeed=subseed(seed,106),researchSeed=subseed(seed,105);r=new RandomStream(industrySeed);a=f(r.range(0,TAU));const mining=polar(a,63000),ores=[];
 for(let i=0;i<32;i++){const radius=f((i<4||(i>=16&&i<20))?r.range(29000,34000):r.range(65000,145000));let p;
  for(let t=0;t<180;t++){p=polar(f(f(a+f(i*f(2.39996)))+f(t*f(.31))),radius);if(!terrain.valid(p,.92))continue;if(distance(p,research)>1800&&distance(p,mining)>1800&&ores.every(o=>distance(p,o)>3500))break;}
  p.z=terrain.height(p);ores.push(p);
 }
 const glass=[],centres=[];r=new RandomStream(industrySeed^57491);
 while(glass.length<96){const left=96-glass.length;let count=left<=4?left:r.integer(2,4);if(left-count===1)count--;let p;
  for(let t=0;t<500;t++){const aa=f(r.range(0,TAU)),radius=f(r.range(50200,174800));p=polar(aa,radius);if(terrain.valid(p,.9)&&centres.every(c=>distance(p,c)>9000))break;}
  centres.push(p);const bearing=f(r.range(0,TAU));for(let i=0;i<count;i++){const aa=f(bearing+f(f(f(i*2)*PI)/count)),off=polar(aa,90);glass.push({x:p.x+off.x,y:p.y+off.y,z:terrain.height({x:p.x+off.x,y:p.y+off.y})});}
 }
 r=new RandomStream(industrySeed^0x51ac);
 while(ores.length<64){let found=null;for(let t=0;t<5000;t++){const aa=f(r.range(0,TAU)),radius=f(r.range(150800,198800)),p=polar(aa,radius);if(terrain.valid(p,.92)&&ores.every(o=>distance(p,o)>=3500)){p.z=terrain.hit(p).z;found=p;break;}}if(!found)break;ores.push(found);}
 const minerals=[];r=new RandomStream(researchSeed);let clusterEnd=192,cluster={x:0,y:0};
 for(let i=0;i<1152;i++){let p,found=false;
  if(i>=192&&i<clusterEnd){const aa=f(f(f(i*2)*PI)/3),off=polar(aa,140);p={x:cluster.x+off.x,y:cluster.y+off.y,z:0};found=true;}
  for(let t=0;t<800&&!found;t++){const aa=f(r.range(0,TAU)),radius=f(Math.sqrt(r.range(f(11000*11000),f(194800*194800))));p=polar(aa,radius);if(!terrain.valid(p,.9))continue;found=minerals.every(o=>distance(p,o)>=(i<48?7000:5000));}
  if(!found)p=polar(f(i*f(2.399963)),180000);
  if(i>=192&&i>=clusterEnd){cluster=p;clusterEnd=Math.min(1152,i+r.integer(1,3));}
  p.z=terrain.height(p);minerals.push(p);r.range(0,360);
 }
 const plants=[],pois=[cache1,cache2,cache3,suit,research,mining];
 r=new RandomStream(researchSeed^0x4a718);
 for(let t=0;t<20000&&plants.length<48;t++){const aa=f(r.range(0,TAU)),radius=f(Math.sqrt(r.range(f(12000*12000),f(190000*190000)))),p=polar(aa,radius);if(!terrain.valid(p,.9))continue;if(plants.every(o=>distance(p,o)>=26000)&&pois.every(o=>distance(p,o)>=2500)){p.z=terrain.hit(p).z;plants.push(p);}}
 r=new RandomStream(researchSeed^0x7a928);
 for(let t=0;t<40000&&plants.length<192;t++){const aa=f(r.range(0,TAU)),radius=f(Math.sqrt(r.range(f(12000*12000),f(190000*190000)))),p=polar(aa,radius,400000);if(terrain.valid(p,.9)&&plants.slice(48).every(o=>distance(p,o)>=11000)){p.z=terrain.hit(p).z;plants.push(p);}}
 // Additions retain every HS1 resource ID and original coordinate.
 const extra=(source,min,max,offset=600)=>{
  const origin=source.x>200000?400000:0;
  for(let ring=1;ring<=16;ring++)for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
   const p={x:source.x+dx*offset*ring,y:source.y+dy*offset*ring,z:0},radius=Math.hypot(p.x-origin,p.y);
   if(radius>=min&&radius<=max&&terrain.valid(p,.92)){p.z=terrain.hit(p).z;return p;}
  }
  const p={x:source.x+100,y:source.y,z:0};p.z=terrain.height(p);return p;
 };
 for(let i=0;i<64;i++)ores.push(extra(ores[i],i<32?28000:150000,i<32?150000:200000,2500));
 for(let i=0;i<96;i++)glass.push(extra(glass[i],50000,175000));
 const addedRandom=new RandomStream(researchSeed^0x6d312);
 for(let batch=0;batch<3;batch++)for(let begin=0;begin<1152;){
  let end=begin+1;while(end<1152&&distance(minerals[end],minerals[end-1])<400)end++;
  const clear=centre=>{
   if(minerals.some(p=>distance(centre,p)<(batch===0?5400:4400)))return false;
   for(let member=begin;member<end;member++){
    const p={x:centre.x+minerals[member].x-minerals[begin].x,y:centre.y+minerals[member].y-minerals[begin].y,z:0},radius=Math.hypot(p.x,p.y);
    if(radius<11000||radius>194800||!terrain.valid(p,.9))return false;
   }
   return true;
  };
  let centre=null;
  for(let attempt=0;attempt<20000;attempt++){
   const angle=f(addedRandom.range(0,TAU)),radius=f(Math.sqrt(addedRandom.range(f(11000*11000),f(194800*194800)))),p=polar(angle,radius);
   if(clear(p)){centre=p;break;}
  }
  if(!centre)for(let x=-192500;x<=192500&&!centre;x+=2500)for(let y=-192500;y<=192500;y+=2500){const p={x,y,z:0};if(clear(p)){centre=p;break;}}
  if(!centre)throw Error('No terrain site available for additional mineral group.');
  for(let member=begin;member<end;member++){const p={x:centre.x+minerals[member].x-minerals[begin].x,y:centre.y+minerals[member].y-minerals[begin].y,z:0};p.z=terrain.height(p);minerals.push(p);}
  begin=end;
 }
 for(let i=0;i<192;i++)plants.push(extra(plants[i],12000,190000));
 const points=asset.points.map(p=>({...p}));
 const add=(kind,p,id=0,remaining=1)=>points.push({kind,x:p.x/100,y:p.y/100,z:p.z/100,id,remaining});
 for(const [kind,p,id] of [['Cache 1',cache1,1],['Cache 2',cache2,2],['Cache 3',cache3,3],['Suit pod',suit,0],['Research',research,0],['Mining cache',mining,0]]){p.z=terrain.height(p);add(kind,p,id);}
 ores.forEach((p,i)=>add(i%64>=32?(i%2?'Vesperite':'Asterium'):(i%2?'Bronze':'Iron'),p,i,40));
 glass.forEach((p,i)=>add('Glass',p,i));minerals.forEach((p,i)=>add(i%2?'Verdite':'Hydrite',p,i));plants.forEach((p,i)=>add('Vitraleaf',p,i));
 // Western low-hover packs use the same independent seed stream as the game.
 const guard={x:235000,y:-18000,z:0};let encounter=10;
 const flyer=p=>{p.z=terrain.height(p)+47;add('Flying enemy',p,encounter++,100);};
 for(let i=0;i<3;i++){const a=f(f(f(i*2)*PI)/3);flyer({x:guard.x+f(Math.cos(a)*340),y:guard.y+f(Math.sin(a)*340)});}
 r=random(301);const packs=[];
 for(let group=0;group<10;group++){
  let centre=null;
  for(let attempt=0;attempt<5000;attempt++){
   const p={x:r.range(215000,380000),y:r.range(-100000,100000)};
   if(Math.hypot(p.x-400000,p.y)>185000||distance(p,guard)<9000||!terrain.valid(p,.9)||packs.some(o=>distance(p,o)<12000))continue;
   centre=p;break;
  }
  if(!centre)continue;packs.push(centre);const count=r.integer(1,3);
  for(let i=0;i<count;i++){const a=f(f(f(i*2)*PI)/count);flyer({x:centre.x+f(Math.cos(a)*180),y:centre.y+f(Math.sin(a)*180)});}
 }
 const {collision,...base}=asset;return {...base,points,worldSeed:seed,worldGeneratorVersion:1,seedId:`HS1-${seed}`,mapMode:'initial-world',snapshot:`Initial world · HS1-${seed} · no saved progress`};
}
