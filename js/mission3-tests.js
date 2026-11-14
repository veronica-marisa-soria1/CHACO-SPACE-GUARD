// Ejecutar desde la carpeta del proyecto: node js/mission3-tests.js
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const storage=new Map();globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};globalThis.matchMedia=()=>({matches:true});
globalThis.document={querySelector:()=>null};
globalThis.fetch=async url=>{try{const d=await fs.readFile(new URL('../'+url,import.meta.url),'utf8');return {ok:true,json:async()=>JSON.parse(d)}}catch{return {ok:false,status:404}}};
const G=await import('./game-state.js'),S=await import('./mission3-state.js'),V=await import('./spacecraft-validator.js'),M=await import('./mission3.js');
const root=G.state;
assert.equal(S.mission3Unlocked(root),false);assert.throws(()=>M.createMission3Session(root),/BLOQUEADA/);
root.mission2={status:'completada',completed:[0,1,2,3,4,5],observations:{}};root.mission3={unlocked:true,expediente:{results:{diameter:'145–155 m',rotation:'Desconocida'},uncertainties:['Masa pendiente']}};root.credits=680;root.spent=320;root.decisions=['Decisión heredada'];
const originalM2=JSON.stringify(root.mission2),s=M.createMission3Session(root);await M.loadMission3Assets(s);assert.equal(s.error,'');assert.equal(s.m3.legacy.expediente.results.rotation,'Desconocida');
const recommended=['base','camera','spectrometer','antenna','propulsion','solar'];
assert.equal(V.calculateMass(recommended,s.catalog),219);assert.equal(V.calculateCost(recommended,s.catalog),420);assert.equal(V.calculatePowerMargin(recommended,s.catalog),85);assert.equal(V.calculatePowerMargin(recommended,s.catalog,'staggered'),165);
const a=(action,id='',data={})=>M.handleMission3Action(s,'m3-'+action,id,data);
await a('phase','4');assert.equal(s.m3.phase,0);
for(const [id,target] of Object.entries(s.requirements.objectives)){await a('objective',id);await a('match',target)}
for(const id of ['base','camera','spectrometer','antenna','propulsion'])await a('priority',id,{value:'required'});await a('priority','autonomy',{value:'optional'});await a('requirements');assert.ok(s.m3.completed.includes(0));
await a('phase','1');for(const id of recommended)await a('install',id);assert.equal(root.credits,680);assert.ok(!V.validateSpacecraft({...s.m3,components:[]},s.catalog,s.requirements,680).valid);
const heavyCatalog=s.catalog.map(c=>c.id==='base'?{...c,mass:120}:c);assert.ok(V.validateSpacecraft(s.m3,heavyCatalog,s.requirements,680).errors.some(x=>x.includes('Masa')));
assert.ok(!V.validateSpacecraft({...s.m3,components:recommended.filter(x=>x!=='solar')},s.catalog,s.requirements,680).valid);assert.ok(!V.validateSpacecraft(s.m3,s.catalog,s.requirements,600).valid);
await a('validate');await a('phase','2');await a('diagnosis');await a('phase','3');await a('strategy','rendezvous');await a('launch','light');await a('plan');assert.ok(!s.m3.completed.includes(3));await a('launch','heavy');await a('architecture','deep');await a('plan');assert.ok(s.m3.completed.includes(3));await a('phase','4');await a('test','communications');assert.equal(s.m3.tests.communications.passed,false);
await a('phase','3');await a('contacts','3');assert.deepEqual(s.m3.tests,{});await a('plan');await a('phase','4');for(const id of ['energy','communications','science','maneuver'])await a('test',id);await a('tests');assert.ok(s.m3.completed.includes(4));
await a('phase','1');await a('remove','camera');assert.deepEqual(s.m3.tests,{});assert.equal(s.m3.completed.includes(4),false);await a('install','camera');await a('validate');await a('diagnosis');await a('plan');for(const id of ['energy','communications','science','maneuver'])await a('test',id);await a('tests');await a('phase','5');
assert.equal(M.approveDesign(s).ok,false);for(let i=0;i<4;i++)await a('review',String(i));assert.equal(M.mission3Score(s).total,100);
// Persistencia fallida: no cobrar ni desbloquear.
const writer=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota')};assert.equal(M.approveDesign(s).ok,false);assert.equal(root.credits,680);assert.ok(!root.mission4);localStorage.setItem=writer;
assert.equal(M.approveDesign(s).ok,true);assert.equal(root.credits,260);assert.equal(root.spent,740);assert.equal(root.mission4.unlocked,true);assert.equal(s.m3.report.totalMassKg,219);assert.equal(s.m3.report.score,100);assert.equal(JSON.stringify(root.mission2),originalM2);
assert.equal(M.approveDesign(s).duplicate,true);assert.equal(root.credits,260);await a('remove','camera');assert.ok(s.m3.components.includes('camera'));
G.saveGame();assert.ok(G.loadGame());const restored=M.createMission3Session(G.state);assert.equal(restored.m3.approved,true);assert.equal(restored.root.credits,260);assert.equal(restored.m3.report.designApproved,true);
const campaignCopy=storage.get('chaco-space-guard-v1'),demo=M.createMission3Session(G.state,{demo:true});await M.loadMission3Assets(demo);await M.handleMission3Action(demo,'m3-intro');await M.handleMission3Action(demo,'m3-demo-budget','850');assert.equal(storage.get('chaco-space-guard-v1'),campaignCopy);const demo2=M.createMission3Session(G.state,{demo:true});assert.equal(demo2.root.credits,850);
const failFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:false,status:404});const missing=M.createMission3Session(G.state,{demo:true});await M.loadMission3Assets(missing);assert.match(missing.error,/No se pudo/);globalThis.fetch=failFetch;
assert.equal(S.validState({version:1}),false);storage.set('chaco-space-guard-mission3-demo-v1','{corrupt');assert.equal(S.loadGame(G.state,true),null);
console.log('PASS M3: bloqueo, expediente heredado, constructor, 420 CR/219 kg/85 W, turnos, faltantes, masa, energía, reserva, trayectoria, comunicaciones fallidas/corregidas, invalidación, aprobación, cobro único, rollback, campaña intacta, recarga, demo aislada, datos faltantes y corrupción.');
