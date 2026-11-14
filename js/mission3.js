import {beep} from './audio.js';
import {freshMission3,mission3Unlocked,loadGame,saveGame,designBalance,commitDesign,invalidate,newId} from './mission3-state.js';
import {loadComponents} from './spacecraft-components.js';
import {editComponent} from './spacecraft-builder.js';
import {validateSpacecraft} from './spacecraft-validator.js';
import {evaluateTrajectory} from './trajectory-simulator.js';
import {evaluateCommunication} from './communication-simulator.js';
import {requirementsComplete,bindRequirementDrag} from './mission3-minigames.js';
import {renderMission3,mountMission3Visuals} from './mission3-ui.js';
export {mission3Unlocked};
export function createMission3Session(root,{demo=false}={}){
 if(!demo&&!mission3Unlocked(root))throw Error('MISIÓN BLOQUEADA. Debés completar Operación Huellas del Cosmos para continuar');
 const saved=loadGame(root,demo);let actualRoot=root,m3;
 if(demo){actualRoot={credits:saved?.credits??680,spent:0,decisions:[],sound:false};m3=saved?.m3??freshMission3(680,{demo:true})}
 else{root.playId??=newId();const heritage=root.mission3;m3=saved??freshMission3(root.credits,{playId:root.playId,expediente:structuredClone(heritage.expediente||{}),decisions:[...root.decisions],recommendation:heritage.recommendation});root.mission3.design=m3}
 return {root:actualRoot,m3,demo,catalog:null,requirements:null,scenario:null,trajectories:null,events:null,error:'',saveError:false};
}
async function json(name){const r=await fetch(`data/${name}.json`);if(!r.ok)throw Error(`Falta ${name}.json (HTTP ${r.status})`);const d=await r.json();if(d.type!=='SIMULACIÓN')throw Error(`Escenario sin identificación de simulación: ${name}`);return d}
export async function loadMission3Assets(s){try{const [catalog,requirements,scenario,trajectories,events]=await Promise.all([loadComponents(),json('mission3-requirements'),json('cg01-mission3'),json('mission3-trajectories'),json('mission3-events')]);if(!Number.isFinite(requirements.maxMass)||!requirements.objectives||!trajectories.launches?.length||!Array.isArray(events.events)||scenario.fictional!==true)throw Error('Datos de Misión 3 incompletos');Object.assign(s,{catalog,requirements,scenario,trajectories,events,error:''});if(s.demo&&!s.m3.legacy.expediente)s.m3.legacy.expediente={results:scenario.results,uncertainties:scenario.uncertainties,recommendation:scenario.recommendation};return true}catch(e){s.error=`No se pudo abrir el taller: ${e.message}. Revisá los archivos y reintentá. No se generaron datos de reemplazo.`;return false}}
export function renderMission3Session(s){return renderMission3(s)}
export function mountMission3(root,s,rerender){if(!s.catalog)return;mountMission3Visuals?.(root,s);bindRequirementDrag(root,async(objective,system)=>{await handleMission3Action(s,'m3-objective',objective);await handleMission3Action(s,'m3-match',system);rerender()})}
function message(s,text,ok=false){s.m3.messages.push(text);s.m3.messages=s.m3.messages.slice(-30);beep(s.m3.sound,ok)}
function complete(s,n){if(!s.m3.completed.includes(n))s.m3.completed.push(n);message(s,`Fase ${n+1} completada. ${n<5?'Siguiente estación habilitada.':''}`,true)}
export function diagnostics(s){return validateSpacecraft(s.m3,s.catalog,s.requirements,designBalance(s))}
export function runTest(s,id){const d=diagnostics(s),m=s.m3;let result;
 if(id==='energy')result={passed:d.margin>=s.requirements.minMargin,explanation:`Generación ${d.generation} W − demanda ${d.consumption} W = ${d.margin} W. Mínimo 40 W. ${d.margin<40?'Agregar paneles o programar turnos.':'Perfil nominal suficiente.'}`};
 if(id==='communications')result=evaluateCommunication(m,s.requirements);
 if(id==='science'){const missing=['camera','spectrometer'].filter(id=>!m.components.includes(id));result={passed:missing.length===0,explanation:missing.length?'Faltan cámara o espectrómetro: incorporar instrumentos.':'Imágenes y espectros disponibles. La masa e interior del asteroide siguen pendientes; no se prometen mediciones imposibles.'}}
 if(id==='maneuver')result=evaluateTrajectory(m,s.trajectories,d.mass);
 if(!result)return null;m.tests[id]={...result,revision:m.revision};message(s,`${result.passed?'PRUEBA APROBADA':'PRUEBA FALLIDA'}: ${result.explanation}`,result.passed);return result;
}
export function mission3Score(s){if(!s.catalog)return {total:0};const m=s.m3,d=diagnostics(s),comm=evaluateCommunication(m,s.requirements),route=evaluateTrajectory(m,s.trajectories,d.mass);const values={requirements:requirementsComplete(m,s.requirements)?15:0,instruments:['camera','spectrometer'].every(id=>m.components.includes(id))?20:0,engineering:d.mass<=240&&d.margin>=40?20:0,budget:d.remaining>=250&&d.cost<=designBalance(s)?(d.cost<=420?15:10):0,planning:comm.passed&&route.passed?(m.strategy==='rendezvous'?15:10):0,tests:['energy','communications','science','maneuver'].every(id=>m.tests[id]?.passed&&m.tests[id].revision===m.revision)?10:0,justification:m.review.length===4?5:0};return {...values,total:Object.values(values).reduce((a,b)=>a+b,0)}}
export function approveDesign(s){const m=s.m3;if(m.approved)return {ok:true,duplicate:true};const d=diagnostics(s),comm=evaluateCommunication(m,s.requirements),route=evaluateTrajectory(m,s.trajectories,d.mass),score=mission3Score(s);let errors=[...d.errors];if(!requirementsComplete(m,s.requirements))errors.push('Falta definir requisitos');if(![0,1,2,3,4].every(n=>m.completed.includes(n)))errors.push('Fases previas incompletas');if(!comm.passed)errors.push(comm.explanation);if(!route.passed)errors.push(...route.errors);if(!['energy','communications','science','maneuver'].every(id=>m.tests[id]?.passed&&m.tests[id].revision===m.revision))errors.push('Pruebas críticas pendientes o desactualizadas');if(m.review.length!==4||score.total<60)errors.push('Falta revisión fundamentada o puntaje mínimo');if(errors.length)return {ok:false,error:errors.join('. ')};
 const report={spacecraftId:'CENTINELA-01',mission:3,scenario:'CG-01',simulation:true,conceptOnly:true,playId:m.playId,components:[...m.components],totalMassKg:d.mass,totalCostCredits:d.cost,nominalPowerMarginW:d.margin,generationW:d.generation,consumptionW:d.consumption,operationProfile:m.profile,scientificCapabilities:d.capabilities.filter(c=>['imaging','spectral_analysis'].includes(c)),communicationProfile:{...m.communication,...comm},trajectoryPlan:{strategy:m.strategy,launch:m.launch,...route},testResults:structuredClone(m.tests),designApproved:true,score:score.total,creditsRemaining:d.remaining,risks:[route.risk,...d.warnings,'Masa y estructura interna de CG-01 pendientes','Concepto de reconocimiento: no incluye capacidad de desvío'],legacy:structuredClone(m.legacy),decisionLog:[...m.decisions]};return commitDesign(s,report)
}
export async function handleMission3Action(s,action,id='',data={}){const m=s.m3;
 if(action==='m3-retry'){await loadMission3Assets(s);return true}
 if(action==='m3-sound'){m.sound=!m.sound;beep(m.sound,true);saveGame(s);return true}
 if(action==='m3-intro'){m.intro=false;saveGame(s);return true}
 if(action==='m3-phase'){const n=Number(id);if(Number.isInteger(n)&&n>=0&&n<6&&(n===0||m.completed.includes(n-1)||m.approved))m.phase=n;else message(s,'Completá la fase anterior para desbloquear esta estación.');saveGame(s);return true}
 if(!s.catalog||s.error)return true;
 if(action==='m3-download'&&m.report){const blob=new Blob([JSON.stringify(m.report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='CENTINELA-01-concepto.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return true}
 if(action==='m3-inspect'){const c=s.catalog.find(c=>c.id===id);if(c)message(s,`${c.name}: ${c.description} Compatibilidad: plataforma base; ${c.cost} CR, ${c.mass} kg, demanda ${c.power} W, aporte ${c.generation} W.`);return true}
 if(action==='m3-rotate'){m.rotation=(m.rotation+20)%360;return true}
 if(action==='m3-save'){s.saveError=!saveGame(s);message(s,s.saveError?'Guardado no disponible. Habilitá almacenamiento local.':'Borrador guardado. No se cobraron créditos.');return true}
 if(action==='m3-reset-demo'&&s.demo){s.root.credits=680;s.root.spent=0;s.m3=freshMission3(680,{expediente:{results:s.scenario.results,uncertainties:s.scenario.uncertainties},demo:true});saveGame(s);return true}
 if(m.approved){message(s,'Diseño aprobado y cerrado. Su expediente y costo quedan conservados para la Misión 4.');return true}
 const expectedPhase={'m3-objective':0,'m3-match':0,'m3-priority':0,'m3-requirements':0,'m3-install':1,'m3-remove':1,'m3-validate':1,'m3-profile':1,'m3-diagnosis':2,'m3-strategy':3,'m3-launch':3,'m3-architecture':3,'m3-contacts':3,'m3-plan':3,'m3-test':4,'m3-tests':4,'m3-review':5,'m3-approve':5};const phase=expectedPhase[action];if(phase>0&&!m.completed.includes(phase-1)){message(s,'Acción bloqueada: completá primero los objetivos anteriores.');return true}
 if(action==='m3-objective'&&id in s.requirements.objectives)m.selectedObjective=id;
 if(action==='m3-match'){const target=m.selectedObjective;if(s.requirements.objectives[target]===id){m.matches[target]=id;message(s,'Necesidad científica conectada con el sistema adecuado.',true)}else message(s,'Revisá la función: imágenes, materiales, transmisión, maniobra o energía.');}
 if(action==='m3-priority'&&s.catalog.some(c=>c.id===id)&&['required','optional'].includes(data.value))m.priorities[id]=data.value;
 if(action==='m3-requirements'){if(requirementsComplete(m,s.requirements))complete(s,0);else message(s,'Relacioná los cinco objetivos y clasificá los seis sistemas requeridos; autonomía es opcional en el escenario estándar.')}
 if(action==='m3-install'||action==='m3-remove'){if(editComponent(m,s.catalog,id,action==='m3-install'))message(s,'Borrador actualizado sin cargo. Pruebas anteriores invalidadas.')} 
 if(action==='m3-profile'&&['simultaneous','staggered'].includes(id)&&m.profile!==id){m.profile=id;invalidate(m);message(s,id==='staggered'?'Perfil por turnos: cámara, espectrómetro y enlace se alternan. Se evalúa el turno de mayor demanda; aumenta el tiempo de operación.':'Todos los instrumentos operan a la vez. Se recalcula la suma de demandas.')}
 if(action==='m3-validate'||action==='m3-diagnosis'){const d=diagnostics(s);m.metrics=d;if(d.valid)complete(s,action==='m3-validate'?1:2);else message(s,d.errors.join('. '))}
 const change=(key,value)=>{if(m[key]!==value){m[key]=value;invalidate(m);m.completed=[0,1,2];m.decisions.push(`${key}: ${value}`)}};
 if(action==='m3-strategy'&&s.trajectories.strategies.some(p=>p.id===id))change('strategy',id);
 if(action==='m3-launch'&&s.trajectories.launches.some(p=>p.id===id))change('launch',id);
 if(action==='m3-architecture'&&['deep','direct'].includes(id)&&m.communication.architecture!==id){m.communication.architecture=id;invalidate(m);m.completed=[0,1,2]}
 if(action==='m3-contacts'&&[1,2,3].includes(Number(id))&&m.communication.contacts!==Number(id)){m.communication.contacts=Number(id);invalidate(m);m.completed=[0,1,2]}
 if(action==='m3-plan'){const t=evaluateTrajectory(m,s.trajectories,diagnostics(s).mass);if(t.passed)complete(s,3);else message(s,t.errors.join('. '));const c=evaluateCommunication(m,s.requirements);message(s,c.explanation,c.passed);}
 if(action==='m3-test')runTest(s,id);
 if(action==='m3-tests'){if(['energy','communications','science','maneuver'].every(id=>m.tests[id]?.passed&&m.tests[id].revision===m.revision)&&diagnostics(s).valid)complete(s,4);else message(s,'Completá y superá las cuatro pruebas críticas. Corregí las alertas en taller o planificación.')}
 if(action==='m3-review'){const n=Number(id);if([0,1,2,3].includes(n)){const d=diagnostics(s),checks=[['camera','spectrometer'].every(id=>m.components.includes(id)),d.valid,evaluateTrajectory(m,s.trajectories,d.mass).passed&&evaluateCommunication(m,s.requirements).passed,true];if(checks[n])m.review=m.review.includes(n)?m.review.filter(i=>i!==n):[...m.review,n];else message(s,'La evidencia actual no permite confirmar este punto: revisá el diagnóstico.')}}
 if(action==='m3-approve'){const r=approveDesign(s);message(s,r.ok?'PROYECTO CENTINELA APROBADO. CENTINELA-01: CONCEPTO VIABLE. MISIÓN 4 DESBLOQUEADA.':r.error,r.ok)}
 if(action==='m3-demo-budget'&&s.demo&&[600,680,850].includes(Number(id))){s.root.credits=Number(id);m.initialCredits=Number(id);invalidate(m);message(s,'Presupuesto DEMO actualizado. La partida real permanece intacta.')}
 if(action==='m3-reset-demo'&&s.demo){s.root.credits=680;s.root.spent=0;s.m3=freshMission3(680,{expediente:{results:s.scenario.results,uncertainties:s.scenario.uncertainties},demo:true})}
 s.saveError=!saveGame(s);return true;
}

