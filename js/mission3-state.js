import {saveGame as saveCampaign,spend} from './game-state.js';
const DEMO_KEY='chaco-space-guard-mission3-demo-v1';
export const newId=()=>globalThis.crypto?.randomUUID?.()||`csg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function mission3Unlocked(root){return root.mission2?.status==='completada'&&root.mission2?.completed?.includes(5)&&root.mission3?.unlocked===true}
export function freshMission3(credits,legacy={}){return {version:1,playId:newId(),phase:0,completed:[],intro:true,initialCredits:credits,components:[],profile:'simultaneous',strategy:null,launch:null,communication:{architecture:'direct',contacts:1},matches:{},selectedObjective:null,priorities:{},tests:{},review:[],approved:false,messages:[],sound:false,decisions:[],report:null,rotation:0,metrics:null,legacy,operations:[],revision:0}}
export function validState(m){return m&&m.version===1&&Number.isInteger(m.phase)&&m.phase>=0&&m.phase<6&&Array.isArray(m.completed)&&m.completed.every(n=>Number.isInteger(n)&&n>=0&&n<6)&&Array.isArray(m.components)&&m.components.every(id=>['base','camera','spectrometer','antenna','propulsion','solar','autonomy'].includes(id))&&new Set(m.components).size===m.components.length&&Array.isArray(m.messages)&&m.messages.every(x=>typeof x==='string')&&Array.isArray(m.review)&&Array.isArray(m.operations)&&Array.isArray(m.decisions)&&m.tests&&m.matches&&m.priorities&&m.communication&&[1,2,3].includes(m.communication.contacts)&&['deep','direct'].includes(m.communication.architecture)&&['simultaneous','staggered'].includes(m.profile)&&typeof m.approved==='boolean'&&(!m.approved||(m.report?.designApproved===true&&Number.isFinite(m.report.totalCostCredits)))}
export function loadGame(root,demo=false){
 if(demo){try{const d=JSON.parse(localStorage.getItem(DEMO_KEY));if(d&&Number.isInteger(d.credits)&&d.credits>=0&&d.credits<=1000&&validState(d.m3))return {credits:d.credits,m3:d.m3}}catch{}return null}
 const m=root.mission3?.design;return validState(m)?m:null;
}
export function saveGame(session){
 if(session.demo){try{localStorage.setItem(DEMO_KEY,JSON.stringify({version:1,credits:session.root.credits,m3:session.m3}));return true}catch{return false}}
 session.root.mission3.design=session.m3;return saveCampaign();
}
export function invalidate(m3){m3.tests={};m3.review=[];m3.completed=m3.completed.filter(n=>n===0);m3.revision++;m3.metrics=null}
export function designBalance(session){return session.root.credits+(session.m3.approved?session.m3.report.totalCostCredits:0)}
// Única transacción de costo: usa la cartera existente; un DEMO usa su raíz aislada.
export function commitDesign(session,report){
 const {m3,root}=session,id=`mission3:${m3.playId}:approval:v1`;
 if(m3.approved||m3.operations.includes(id))return {ok:true,duplicate:true};
 const cost=report.totalCostCredits;if(!Number.isFinite(cost)||cost<0||root.credits<cost)return {ok:false,error:'Créditos insuficientes'};
 const before={credits:root.credits,spent:root.spent,decisions:[...root.decisions],m3:JSON.parse(JSON.stringify(m3)),mission4:root.mission4};
 if(session.demo){root.credits-=cost;root.spent+=cost}else if(!spend(cost,'Aprobación CENTINELA-01'))return {ok:false,error:'No se pudo reservar el presupuesto'};
 m3.approved=true;m3.report=report;m3.operations.push(id);m3.completed=[0,1,2,3,4,5];
 if(!session.demo)root.mission4={unlocked:true,sourceMission:3,spacecraft:report};
 if(!saveGame(session)){root.credits=before.credits;root.spent=before.spent;root.decisions=before.decisions;root.mission4=before.mission4;Object.assign(m3,before.m3);return {ok:false,error:'No se pudo guardar la aprobación. No se cobraron créditos; habilitá almacenamiento local.'}}
 return {ok:true};
}
