// HS1 placement, matching Hispace UE 5.7.3. Units inside the generator: centimetres.
const f=Math.fround, PI=f(Math.PI), TAU=f(2*PI);
const sin=a=>f(Math.sin(a)), cos=a=>f(Math.cos(a));
const polar=(a,r,ox=0)=>({x:f(ox+f(cos(a)*r)),y:f(sin(a)*r),z:0});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function parseSeed(text){const m=/^HS[12]-([1-9][0-9]{0,9})$/.exec(String(text).trim().toUpperCase());if(!m||Number(m[1])>2147483647)throw Error('Enter an HS1 or HS2 world seed, for example HS1-123456789.');return Number(m[1]);}
export function subseed(seed,salt){let v=(seed^salt)>>>0;v=(v^(v>>>16))>>>0;v=Math.imul(v,0x7feb352d)>>>0;v=(v^(v>>>15))>>>0;v=Math.imul(v,0x846ca68b)>>>0;v=(v^(v>>>16))>>>0;return v%1000000+1;}
export function towerMedkitOffsets(seed){
 const r=new RandomStream((subseed(seed,106)^0x5c17a3)|0),floors=[0,1,2,3,4,5,6,7,8],result=[];
 for(let i=0;i<4;i++){const pick=r.integer(0,floors.length-1),floor=floors.splice(pick,1)[0],room=floor*4+r.integer(0,3);const y=r.integer(0,1)?1.5:-1.5,x=r.integer(0,1)?1.8:-1.8;result.push({x:(room%2?8.25:-8.25)+x,y:(Math.floor(room%4/2)?7.5:-7.5)+y,z:floor*4+.12});}return result;
}
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
  const second=p.x>=200000&&p.x<600000&&Math.abs(p.y)<=250000;
  const third=p.x>=600000&&p.x<=1050000&&Math.abs(p.y)<=250000;
  if(!second&&!third&&(Math.abs(p.x)>250000||Math.abs(p.y)>250000))return null;
  const g=this.grids[third?2:second?1:0],x=p.x-(third?800000:second?400000:0),y=p.y;
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
 const version=String(seedText).trim().toUpperCase().startsWith('HS2-')?2:1;
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
 const routeHouses=[0,1,2],routeKeys=[0,1,2,3,4],routeRandom=random(391);
 for(let i=2;i>0;i--){const j=routeRandom.integer(0,i);[routeHouses[i],routeHouses[j]]=[routeHouses[j],routeHouses[i]];}if(routeHouses.join()==='0,1,2')[routeHouses[0],routeHouses[2]]=[routeHouses[2],routeHouses[0]];
 routeHouses.unshift(5);routeHouses.push(3,4);
 for(let i=4;i>0;i--){const j=routeRandom.integer(0,i);[routeKeys[i],routeKeys[j]]=[routeKeys[j],routeKeys[i]];}if(routeKeys.join()==='0,1,2,3,4')[routeKeys[0],routeKeys[4]]=[routeKeys[4],routeKeys[0]];
 const points=asset.points.filter(p=>!(p.kind==='Enemy'&&p.id>=800&&p.id<960)||((p.id-800)%4)<new RandomStream((subseed(seed,106)^0x614129^Math.imul(Math.floor((p.id-800)/4),7919))|0).integer(1,4)).map(p=>{if(p.kind==='Tower medkit'){const at=towerMedkitOffsets(seed)[p.id],tower=asset.points.find(q=>q.kind==='Asterion Spire');return {...p,x:tower.x+at.x,y:tower.y+at.y,z:tower.z+at.z};}if(p.kind==='Cargo module'||p.kind==='Survey module'){const r=new RandomStream(subseed(seed,824)),blue=r.integer(2,17),red=r.integer(20,34),room=p.kind==='Cargo module'?blue:red,tower=asset.points.find(q=>q.kind==='Asterion Spire');return {...p,x:tower.x+(room%2?8.25:-8.25)-2,y:tower.y+(Math.floor(room%4/2)?7.5:-7.5)+2,z:tower.z+Math.floor(room/4)*4+.25};}if(p.kind!=='Access key')return {...p};const house=routeHouses[routeKeys.indexOf(p.id)],cabin=asset.points.find(p=>p.kind==='Outpost cabin'&&p.id===house),sites=[[-240,-150,113],[-185,-150,113],[65,155,56],[-55,155,56]],offset=sites[random(392+p.id).integer(0,3)];const angle=([155,245,325,35,110,80][house]+new RandomStream(741989+house*7919).range(-17,17))*Math.PI/180;return {...p,x:cabin.x+(Math.cos(angle)*offset[0]-Math.sin(angle)*offset[1])/100,y:cabin.y+(Math.sin(angle)*offset[0]+Math.cos(angle)*offset[1])/100,z:cabin.z+offset[2]/100};});

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
   if(Math.hypot(p.x-400000,p.y)>185000||distance(p,guard)<9000||distance(p,{x:275000,y:-85000})<9000||!terrain.valid(p,.9)||packs.some(o=>distance(p,o)<12000))continue;
   centre=p;break;
  }
  if(!centre)continue;packs.push(centre);const count=r.integer(1,3);
  for(let i=0;i<count;i++){const a=f(f(f(i*2)*PI)/count);flyer({x:centre.x+f(Math.cos(a)*180),y:centre.y+f(Math.sin(a)*180)});}
 }
 // Append-only west-basin wildlife: separate streams preserve all original encounters.
 const missions=[guard,{x:275000,y:-85000},{x:219750,y:11250},{x:213000,y:2600}];
 const populate=(salt,groups,large)=>{const added=random(salt),sites=[];let serial=0;
  for(let group=0;group<groups;group++){let centre=null;
   for(let attempt=0;attempt<5000;attempt++){const p={x:added.range(215000,395000),y:added.range(-180000,180000)};
    if(Math.hypot(p.x-400000,p.y)>185000||missions.some(m=>distance(p,m)<20000)||!terrain.valid(p,.9)||packs.some(o=>distance(p,o)<10000)||sites.some(o=>distance(p,o)<(large?50000:16000)))continue;
    centre=p;break;
   }
   if(!centre)continue;sites.push(centre);const count=large?1:added.integer(1,3);
   for(let member=0;member<count;member++){const angle=f(f(f(member*2)*PI)/count);const p=large?centre:{x:centre.x+f(cos(angle)*180),y:centre.y+f(sin(angle)*180)};p.z=terrain.height(p)+(large?120.8:47);add(large?'Enemy':'Flying enemy',p,(large?400:200)+serial++,large?340:100);}
  }
 };
 populate(302,28,false);populate(303,4,true);
 const houseBlockers=points.filter(p=>['Hydrite','Verdite','Vitraleaf','Glass','Iron','Bronze','Asterium','Vesperite','Sulphrite'].includes(p.kind));
 const missionBlockers=points.filter(p=>['Research','Cache 1','Cache 2','Cache 3','Suit pod','Mining cache'].includes(p.kind));
 for(let world=0;world<2;world++){let count=0;
  for(const p of asset.abandonedCandidates||[]){if(p.world!==world||count>=24)continue;
   if(houseBlockers.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<9)||missionBlockers.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<70))continue;
   points.push({kind:'Abandoned house',id:world*24+count,x:p.x,y:p.y,z:p.z,remaining:1});
   if(count===3||count===17){const a=p.yaw*Math.PI/180;points.push({kind:'Cabin medkit',id:world*2+(count===17?1:0),x:p.x-1.7*Math.cos(a)-Math.sin(a),y:p.y-1.7*Math.sin(a)+Math.cos(a),z:p.z+.24,remaining:1});}
   count++;
  }
 }
 const faunaR=random(827),faunaCentres=[],oldFoes=points.filter(p=>['Enemy','Flying enemy'].includes(p.kind));
 const faunaMissions=points.filter(p=>['Medical regulator','Southern crash field','Asterion Spire','Outpost cabin'].includes(p.kind)).map(p=>({x:p.x*100,y:p.y*100}));
 faunaMissions.push({x:213000,y:2600},{x:200000,y:0});
 const settlement=points.filter(p=>p.kind==='Settlement capsule').map(p=>({x:p.x*100,y:p.y*100}));
 const cabins=points.filter(p=>p.kind==='Abandoned house').map(p=>({x:p.x*100,y:p.y*100}));
 for(let group=0;group<16;group++){
  let centre=null;
  for(let attempt=0;attempt<5000;attempt++){
   const p={x:f(faunaR.range(group<8?225000:405000,group<8?395000:575000)),y:f(faunaR.range(-165000,165000))};
   if(Math.hypot(p.x-400000,p.y)>175000||faunaMissions.some(q=>distance(p,q)<18000)||settlement.some(q=>distance(p,q)<12000)||cabins.some(q=>distance(p,q)<4000)||oldFoes.some(q=>Math.hypot(p.x-q.x*100,p.y-q.y*100)<4500)||faunaCentres.some(q=>distance(p,q)<18000)||!terrain.valid(p,.9))continue;
   let clear=true;const ground=terrain.height(p);
   for(let side=0;side<8;side++){const angle=f(side*PI/4),rim={x:p.x+f(cos(angle)*320),y:p.y+f(sin(angle)*320)};if(!terrain.valid(rim,.88)||Math.abs(terrain.height(rim)-ground)>120)clear=false;}
   if(clear){centre=p;break;}
  }
  if(!centre)throw Error(`Could not place fauna pack ${group}.`);faunaCentres.push(centre);
  const count=faunaR.integer(2,4),species=['Riftstalker','Prismback','Ashmaw','Duskmantis'][group%4],hp=[120,180,240,150][group%4];
  for(let member=0;member<count;member++){const angle=f(f(f(member*2)*PI)/count),p={x:centre.x+f(cos(angle)*300),y:centre.y+f(sin(angle)*300)};points.push({kind:'Enemy',species,pack:4000+group,id:1200+group*4+member,x:p.x/100,y:p.y/100,z:terrain.height(p)/100+[.6536,.6888,.9,.6888][group%4],remaining:hp});}
 }
 const relayFoes=points.filter(p=>['Enemy','Flying enemy'].includes(p.kind)),relayResources=points.filter(p=>['Hydrite','Verdite','Vitraleaf','Glass'].includes(p.kind)),relayOres=points.filter(p=>['Iron','Bronze','Asterium','Vesperite'].includes(p.kind)),relayMissions=points.filter(p=>['Asterion Spire','Medical regulator','Southern crash field'].includes(p.kind));
 const near=(p,q,r)=>Math.hypot(p.x-q.x*100,p.y-q.y*100)<r;
 const relayClear=p=>p.x>=220000&&p.y<=-50000&&Math.hypot(p.x-400000,p.y)<=180000&&!relayMissions.some(q=>near(p,q,12000))&&!cabins.some(q=>distance(p,q)<3000)&&!relayFoes.some(q=>near(p,q,2500))&&!relayOres.some(q=>near(p,q,2000))&&!relayResources.some(q=>near(p,q,1000))&&terrain.valid(p,.94)&&[-350,350].every(x=>[-350,350].every(y=>Math.abs(terrain.height({x:p.x+x,y:p.y+y})-terrain.height(p))<=55));
 let relay=null;
 for(const foe of relayFoes){if(!foe.species||foe.y>-600)continue;for(const radius of [5000,7000]){for(let angle=0;angle<16;angle++){const a=f(angle*22.5*PI/180),p={x:f(foe.x*100+f(cos(a)*radius)),y:f(foe.y*100+f(sin(a)*radius))};if(relayClear(p)){relay=p;break;}}if(relay)break;}if(relay)break;}
 if(!relay)throw Error('Could not place northern service house.');
 let floor=terrain.height(relay);for(const x of [-150,150])for(const y of [-140,140])floor=Math.max(floor,terrain.height({x:relay.x+x,y:relay.y+y}));
 points.push({kind:'North relay',id:0,x:relay.x/100,y:relay.y/100,z:(floor+5)/100,remaining:1});
 const denseR=random(1827);
 for(let group=16;group<176;group++){
  let centre=null;
  for(let attempt=0;attempt<5000;attempt++){
   const p={x:f(denseR.range(217000,583000)),y:f(denseR.range(-183000,183000))};
   if(Math.hypot(p.x-400000,p.y)>185000||(p.x>=578000&&Math.abs(p.y)<=14000)||faunaMissions.some(q=>distance(p,q)<18000)||settlement.some(q=>distance(p,q)<12000)||cabins.some(q=>distance(p,q)<4000)||oldFoes.some(q=>Math.hypot(p.x-q.x*100,p.y-q.y*100)<4500)||faunaCentres.some(q=>distance(p,q)<11000)||!terrain.valid(p,.9))continue;
   let clear=true;const ground=terrain.height(p);
   for(let side=0;side<8;side++){const angle=f(side*PI/4),rim={x:p.x+f(cos(angle)*320),y:p.y+f(sin(angle)*320)};if(!terrain.valid(rim,.88)||Math.abs(terrain.height(rim)-ground)>120)clear=false;}
   if(clear){centre=p;break;}
  }
  if(!centre)throw Error(`Could not place fauna pack ${group}.`);faunaCentres.push(centre);
  const count=denseR.integer(2,4),species=['Riftstalker','Prismback','Ashmaw','Duskmantis'][group%4],hp=[120,180,240,150][group%4];
  for(let member=0;member<count;member++){const angle=f(f(f(member*2)*PI)/count),p={x:centre.x+f(cos(angle)*300),y:centre.y+f(sin(angle)*300)};points.push({kind:'Enemy',species,pack:4000+group,id:1200+group*4+member,x:p.x/100,y:p.y/100,z:terrain.height(p)/100+[.6536,.6888,.9,.6888][group%4],remaining:hp});}
 }

 for(let i=0;i<36;i++){const a=i*2.399963229728653,radius=35000+(i%6)*25000,p={x:800000+Math.cos(a)*radius,y:Math.sin(a)*radius};points.push({kind:['Cobaltite','Pyronite','Crythium'][i%3],id:132+i,x:p.x/100,y:p.y/100,z:terrain.height(p)/100,remaining:40,advancedMinerOnly:true,toxic:i%3!==0});}
 points.push({kind:'The Sable Crucible',id:0,x:3900,y:1450,z:terrain.height({x:390000,y:145000})/100,remaining:36});
 points.push({kind:'The Hollow Foundry',id:0,x:6280,y:-100,z:terrain.height({x:628000,y:-10000})/100,remaining:30});
 points.push({kind:'Rocket launch site',id:0,x:8000,y:0,z:terrain.height({x:800000,y:0})/100,remaining:1});
 const rocketR=random(3827),rocketCentres=[];
 for(let group=0;group<160;group++){let centre=null;for(let attempt=0;attempt<3000;attempt++){const p={x:f(rocketR.range(615000,985000)),y:f(rocketR.range(-185000,185000))},radius=Math.hypot(p.x-800000,p.y);if(radius>185000||radius<9000||(p.x<=622000&&Math.abs(p.y)<=14000)||rocketCentres.some(q=>distance(p,q)<8000)||!terrain.valid(p,.88))continue;centre=p;break;}if(!centre)continue;rocketCentres.push(centre);const count=rocketR.integer(2,4),type=group%10<5?5+group%5:group%10<9?1+group%4:0,names=['Stinger','Riftstalker','Prismback','Ashmaw','Duskmantis','Cinderclaw','Frostspine','Ironhide','Voidstrider','Embermaw'];for(let member=0;member<count;member++){const a=member*2*Math.PI/count,p={x:centre.x+Math.cos(a)*300,y:centre.y+Math.sin(a)*300};points.push({kind:type?'Enemy':'Flying enemy',species:names[type],pack:6000+group,id:2000+group*4+member,x:p.x/100,y:p.y/100,z:terrain.height(p)/100+.9,remaining:type>=5?180+(type-5)*40:[100,120,180,240,150][type]});}}
 const frontierBlockers=points.filter(p=>['Cobaltite','Pyronite','Crythium','Glass','Hydrite','Verdite','Vitraleaf'].includes(p.kind));
 const frontierFoes=points.filter(p=>p.pack>=6000),frontierHomes=[];let frontierLoot=0;
 for(const p of asset.frontierCandidates||[]){
  if(frontierHomes.length>=24)break;
  if(frontierBlockers.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<22)||frontierFoes.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<18)||frontierHomes.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<70))continue;
  const index=frontierHomes.length;frontierHomes.push(p);points.push({kind:'Frontier ruin',id:index,x:p.x,y:p.y,z:p.z,remaining:1});
  if(index%4===3)continue;const a=p.yaw*Math.PI/180;
  points.push({kind:index%4===0?'Frontier medkit':'Frontier ammo',id:frontierLoot++,x:p.x-2.72*Math.cos(a)-1.6*Math.sin(a),y:p.y-2.72*Math.sin(a)+1.6*Math.cos(a),z:p.z+.288,remaining:1});
 }
 const {collision,...base}=asset;return {...base,points,villageRoute:{houses:routeHouses,keys:routeKeys},worldSeed:seed,worldGeneratorVersion:version,seedId:`HS${version}-${seed}`,mapMode:'initial-world',snapshot:`Initial world · HS${version}-${seed} · no saved progress`};
}
