import {saveGame,spend} from './game-state.js';

const DEMO_KEY='chaco-space-guard-mission2-demo-v1';
export const mission2Phases=[
  'Expediente abierto',
  'Laboratorio Campo del Cielo',
  'Operación ventana de observación',
  'Trayectoria bajo análisis',
  'Perfil científico CG-01',
  'Consejo científico del Chaco'
];
const fresh=(credits,legacy={},demo=false)=>({
  version:1,phase:0,completed:[],initialCredits:credits,credits,spent:0,legacy,
  objectives:[],priority:null,samples:{},selectedSample:null,compositionAnswer:false,
  techniques:{},selectedTechnique:null,observations:{},
  plan:{target:null,instrument:null,station:null,weatherPending:false,windowReady:false,quality:0,weatherChoice:null},
  weatherEventSeen:false,timeDelayHours:0,orbitShape:null,orbitInterpretation:false,orbitAnalysis:false,
  orbitRotation:0,claims:{},reportPrepared:false,contingency:false,recommendation:null,
  finalScore:0,status:'en curso',mission3:null,badges:[],decisions:[],messages:[],sound:false,
  operations:[],demo
});

function validMission2(saved){
  return Boolean(saved&&saved.version===1&&Number.isInteger(saved.phase)&&saved.phase>=0&&saved.phase<=5
    &&Array.isArray(saved.completed)&&saved.completed.every(phase=>Number.isInteger(phase)&&phase>=0&&phase<=5)
    &&Array.isArray(saved.operations)&&Array.isArray(saved.messages)&&Array.isArray(saved.decisions)
    &&Number.isFinite(saved.initialCredits)&&saved.initialCredits>=0&&saved.initialCredits<=1000
    &&Number.isFinite(saved.spent)&&saved.spent>=0&&Number.isFinite(saved.credits)&&saved.credits>=0
    &&saved.observations&&typeof saved.observations==='object'
    &&saved.plan&&typeof saved.plan==='object'&&saved.legacy&&typeof saved.legacy==='object'
    &&typeof saved.demo==='boolean');
}

export function isMission2Unlocked(root){
  return root.status==='completada'&&root.nextMission===true&&root.completed.includes(6);
}

export function createMission2(root,legacy={},demo=false){
  if(demo)return fresh(1000,{mode:'DEMO DEBUG',sampleCase:'Expediente ficticio de ejemplo',...legacy},true);
  if(validMission2(root.mission2)&&root.mission2.demo===false)return root.mission2;
  root.mission2=fresh(root.credits,{...legacy,mission1Credits:root.credits},false);
  saveGame();
  return root.mission2;
}

export function loadMission2Demo(){
  try{
    const saved=JSON.parse(localStorage.getItem(DEMO_KEY));
    if(validMission2(saved)&&saved.demo===true)return saved;
  }catch{}
  return fresh(1000,{mode:'DEMO DEBUG',sampleCase:'Expediente CG-01 de ejemplo, no enlazado a la partida real'},true);
}

export function freshMission2Demo(){
  return fresh(1000,{mode:'DEMO DEBUG',sampleCase:'Expediente CG-01 de ejemplo, no enlazado a la partida real'},true);
}

export function persistMission2(root,m2){
  if(m2.demo){
    try{localStorage.setItem(DEMO_KEY,JSON.stringify(m2));return true}catch{return false}
  }
  root.mission2=m2;
  return saveGame();
}

export function creditsAvailable(root,m2){return m2.demo?m2.credits:root.credits}

export function chargeOperation(root,m2,id,cost,label){
  if(m2.operations.includes(id))return {ok:false,reason:'duplicate'};
  if(!Number.isFinite(cost)||cost<0||creditsAvailable(root,m2)<cost)return {ok:false,reason:'credits'};
  if(m2.demo)m2.credits-=cost;
  else{
    if(!spend(cost,label))return {ok:false,reason:'credits'};
    m2.credits=root.credits;
  }
  m2.spent+=cost;
  m2.operations.push(id);
  m2.decisions.push(`${label}: ${cost} créditos`);
  return {ok:true};
}

export function phaseUnlocked(m2,phase){
  if(phase===0)return true;
  return m2.completed.includes(phase-1);
}

export function mission2Score(m2){
  const allObs=['photometry','astrometry','spectroscopy'].every(k=>m2.observations[k]?.valid);
  return {
    objectives:m2.completed.includes(0)?15:0,
    meteorites:m2.completed.includes(1)?10:0,
    instruments:allObs?20:0,
    nasa:m2.completed.includes(3)?20:0,
    evidence:m2.completed.includes(4)?15:0,
    resources:m2.spent<=200?10:m2.spent<=250?5:0,
    report:m2.status==='completada'?10:0
  };
}

export function mission2Total(m2){return Object.values(mission2Score(m2)).reduce((sum,value)=>sum+value,0)}

export function mission2Progress(m2){return Math.round(m2.completed.length/6*100)}

export function mission2ObservationsComplete(m2){
  return ['photometry','astrometry','spectroscopy'].every(k=>m2.observations[k]?.valid);
}

export function mission2Report(m2,credits){
  return {
    object:'CG-01 (objeto totalmente ficticio)',
    initial:{diameter:'120–180 m',relativeVelocity:'18 km/s',horizon:'12 años',composition:'Desconocida',rotation:'Desconocida',trajectory:'Incertidumbre elevada'},
    results:{
      diameter:m2.observations.photometry?'145–155 m (estimación narrativa)':'Sin datos posteriores',
      rotation:m2.observations.photometry?'8–12 h (estimación narrativa)':'Desconocida',
      surface:m2.observations.spectroscopy?'Indicios compatibles con material rocoso (inferencia narrativa)':'Desconocida',
      trajectory:m2.observations.astrometry&&m2.orbitAnalysis?'Incertidumbre moderada (simulación educativa)':'Incertidumbre elevada'
    },
    uncertainties:['La mineralogía y composición global no están demostradas.','La trayectoria conserva incertidumbre; no es una probabilidad de impacto.','CG-01 no corresponde a un objeto catalogado por NASA/JPL.'],
    observations:m2.observations,
    objectives:m2.objectives,
    priority:m2.priority,
    instruments:['Fotometría','Astrometría óptica','Espectroscopía'].filter((_,i)=>m2.observations[['photometry','astrometry','spectroscopy'][i]]),
    resources:{initial:m2.initialCredits,missionSpent:m2.spent,creditsRemaining:credits},
    score:mission2Total(m2)
  };
}
