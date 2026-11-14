import {beep} from './audio.js';
import {loadSBDB} from './nasa-sbdb.js';
import {compatible,makeObservation,observationQuality,stations,targets,instruments} from './observation-simulator.js';
import {
  chargeOperation,createMission2,creditsAvailable,freshMission2Demo,loadMission2Demo,mission2ObservationsComplete,
  mission2Report,mission2Total,persistMission2,phaseUnlocked
} from './mission2-state.js';
import {renderMission2} from './mission2-ui.js';

const correctObjectives=['diameter','orbit','surface'];
const expectedSamples={metal:'metal',rock:'rock',mixed:'mixed'};
const expectedTechniques={photometry:'photometry',spectroscopy:'spectroscopy',astrometry:'astrometry',radar:'radar'};
const expectedClaims={
  photoEvidence:'evidence',diameter:'estimate',rotation:'estimate',astrometry:'evidence',
  surface:'estimate',metalCore:'notProven',exactOrbit:'notProven',impact:'notProven'
};
const phases=['Expediente abierto','Laboratorio Campo del Cielo','Operación ventana de observación','Trayectoria bajo análisis','Perfil científico CG-01','Consejo científico del Chaco'];

export function mission2Unlocked(root){return root.status==='completada'&&root.nextMission===true&&root.completed.includes(6)}

function legacySummary(root,previousScore,scenario){
  return {
    mission1Completed:mission2Unlocked(root),
    previousScore,
    previousDecisions:[...root.decisions],
    previousBadges:[...root.badges],
    mission1Credits:root.credits,
    expediente:{
      name:'CG-01',type:'SIMULACIÓN',fictional:true,
      ...(scenario?.initial||{})
    }
  };
}

export function createMission2Session(root,{demo=false,previousScore=0}={}){
  const m2=demo?loadMission2Demo():createMission2(root,legacySummary(root,previousScore),false);
  if(!demo&&m2.sound===undefined)m2.sound=root.sound;
  if(m2.messages.length===0){
    m2.messages.push('Operadora, el expediente CG-01 continúa abierto. Durante nuestra primera misión identificamos un objeto que necesita seguimiento científico. Ahora debemos investigar sus características para comprender mejor su comportamiento. Necesitamos obtener información sobre su tamaño, composición, rotación y trayectoria. Cada observación tiene un costo. Cada decisión influirá en nuestro presupuesto y en la calidad de la investigación. Desde Campo del Cielo, Chaco, comenzamos una nueva etapa. Bienvenida a la OPERACIÓN HUELLAS DEL COSMOS.');
  }
  persistMission2(root,m2);
  return {root,m2,demo,nasa:null,nasaError:'',scenario:null,observationScenario:null,assetError:''};
}

async function loadJSON(path){
  const response=await fetch(path);
  if(!response.ok)throw Error(`No se pudo cargar ${path} (HTTP ${response.status}).`);
  return response.json();
}

export async function loadMission2Assets(session){
  const results=await Promise.allSettled([
    loadSBDB(),
    loadJSON('data/cg01-mission2.json'),
    loadJSON('data/observation-scenarios.json')
  ]);
  if(results[0].status==='fulfilled')session.nasa=results[0].value;
  else session.nasaError=results[0].reason.message;
  if(results[1].status==='fulfilled'){
    const data=results[1].value;
    if(data.object!=='CG-01'||data.type!=='SIMULACIÓN'||data.fictional!==true)throw Error('El expediente de simulación CG-01 no pasó la validación.');
    session.scenario=data;
    if(!session.demo&&!session.m2.legacy.expediente?.diameterMeters){
      session.m2.legacy.expediente={name:data.object,type:data.type,fictional:true,...data.initial};
      persistMission2(session.root,session.m2);
    }
  }else session.assetError=results[1].reason.message;
  if(results[2].status==='fulfilled'){
    const data=results[2].value;
    if(data.type!=='SIMULACIÓN'||data.seed!=='CG01-VENTANA-01'||!Array.isArray(data.stations)||data.stations.length!==3)throw Error('El escenario reproducible de observación no pasó la validación.');
    if(!data.stations.every((station,index)=>station.id===stations[index].id&&station.cost===stations[index].cost&&station.name===stations[index].name))throw Error('El archivo de estaciones no coincide con la simulación de observación.');
    session.observationScenario=data;
  }else session.assetError=[session.assetError,results[2].reason.message].filter(Boolean).join(' ');
}

export function renderMission2Session(session){
  return renderMission2(session.root,session.m2,{nasa:session.nasa,nasaError:session.nasaError,scenario:session.scenario,observationScenario:session.observationScenario,assetError:session.assetError});
}

function complete(session,index){
  const {m2}=session;
  if(!m2.completed.includes(index))m2.completed.push(index);
  m2.completed.sort((a,b)=>a-b);
  if(index<5)message(session,`Fase ${index+1} completada. Se desbloqueó ${phases[index+1]}.`,true);
}

function message(session,text,success=false){
  session.m2.messages.push(text);
  session.m2.messages=session.m2.messages.slice(-40);
  beep(session.m2.sound,success);
  if(!persistMission2(session.root,session.m2)){
    const status=document.querySelector('#save-status');
    if(status)status.textContent='GUARDADO NO DISPONIBLE: mantené esta pestaña abierta';
  }
  const toast=document.querySelector('#toast');
  if(toast){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5500)}
}

function save(session){
  const ok=persistMission2(session.root,session.m2);
  if(!ok){
    const el=document.querySelector('#save-status');
    if(el)el.textContent='GUARDADO NO DISPONIBLE: mantené esta pestaña abierta';
  }
}

function resetPlan(m2,changes){
  m2.plan={...m2.plan,...changes,weatherPending:false,windowReady:false,quality:0,weatherChoice:null};
}

function correctAnswer(session,correct,feedback){
  if(correct){message(session,feedback,true);return true}
  message(session,'Revisá la evidencia y volvé a intentarlo. SARA no modificó ni inventó datos.');
  return false;
}

export function handleMission2Action(session,action,id='',data={}){
  const {root,m2,demo}=session;
  const correct=data.correct==='true';
  const rerender=true;
  if(action==='m2-phase'){
    const phase=Number(id);
    if(!Number.isInteger(phase)||phase<0||phase>5||!phaseUnlocked(m2,phase)){message(session,'Completá la fase anterior para desbloquear esta actividad.');return rerender}
    m2.phase=phase;save(session);return rerender;
  }
  if(action==='m2-objective'){
    if(!correctObjectives.includes(id)){
      message(session,id==='color'?'El color de la nave no responde a una incógnita científica de CG-01.':'No se puede decidir un aterrizaje sin datos ni una misión de superficie.');
      return rerender;
    }
    if(m2.objectives.includes(id)){
      m2.objectives=m2.objectives.filter(item=>item!==id);
      if(m2.priority===id)m2.priority=null;
    }else if(m2.objectives.length>=3)message(session,'Seleccioná solo tres objetivos; quitá uno para cambiar tu selección.');
    else m2.objectives.push(id);
  }else if(action==='m2-priority'){
    if(m2.objectives.includes(id))m2.priority=id;
  }else if(action==='m2-complete-objectives'){
    if(correctObjectives.every(item=>m2.objectives.includes(item))&&m2.objectives.length===3&&m2.priority){
      complete(session,0);
    }else message(session,'Elegí diámetro, órbita y superficie/composición, y marcá cuál es la prioridad.');
  }else if(action==='m2-classify'){
    const expected=expectedSamples[data.sample];
    if(!expected)return rerender;
    if(data.type===expected){m2.samples[data.sample]=data.type;message(session,'Clasificación compatible con los materiales predominantes de la muestra.',true)}
    else message(session,'Volvé a observar la muestra: hierro-níquel, silicatos o una combinación de ambos.');
  }else if(action==='m2-composition'){
    if(correct) m2.compositionAnswer=true;
    correctAnswer(session,correct,'Correcto: los meteoritos de Campo del Cielo no demuestran la composición de CG-01.');
  }else if(action==='m2-technique'){
    if(id in expectedTechniques)m2.selectedTechnique=id;
  }else if(action==='m2-match'){
    const technique=data.technique,fn=data.function;
    if(technique!==m2.selectedTechnique){message(session,'Seleccioná primero la técnica que querés relacionar.');return rerender}
    if(expectedTechniques[technique]===fn){m2.techniques[technique]=fn;message(session,'Técnica relacionada con su función.',true)}
    else message(session,'Revisá la función: brillo, luz, posición o mediciones de radar bajo condiciones adecuadas.');
  }else if(action==='m2-complete-lab'){
    if(Object.keys(m2.samples).length===3&&m2.compositionAnswer&&Object.keys(m2.techniques).length===4){
      if(!m2.badges.includes('INVESTIGADOR DEL COSMOS CHAQUEÑO'))m2.badges.push('INVESTIGADOR DEL COSMOS CHAQUEÑO');
      complete(session,1);
    }else message(session,'Clasificá las tres muestras, distinguí evidencia de hipótesis y relacioná las cuatro técnicas.');
  }else if(action==='m2-target'){
    if(!targets.some(target=>target.id===id))return rerender;
    resetPlan(m2,{target:id});
  }else if(action==='m2-instrument'){
    if(!instruments.some(instrument=>instrument.id===id))return rerender;
    resetPlan(m2,{instrument:id});
  }else if(action==='m2-station'){
    if(!stations.some(station=>station.id===id))return rerender;
    resetPlan(m2,{station:id});
  }else if(action==='m2-review-window'){
    const {target,instrument,station}=m2.plan;
    if(!target||!instrument||!station){message(session,'Elegí una propiedad, un instrumento y una estación antes de revisar la ventana.');return rerender}
    if(!compatible(target,instrument,station)){
      message(session,'Instrumento o estación incompatibles con la propiedad: no se generaron datos ni se cobraron créditos.');
      return rerender;
    }
    if(m2.observations[instrument]){message(session,'Esa observación ya está incorporada; no se volverá a cobrar.');return rerender}
    if(station==='campo'&&m2.plan.weatherChoice===null){
      m2.weatherEventSeen=true;m2.plan.weatherPending=true;m2.plan.windowReady=false;
      message(session,'SARA: las condiciones meteorológicas de Campo del Cielo han empeorado. Elegí continuar, reprogramar o cambiar el plan.');
    }else{
      m2.plan.quality=observationQuality(station,m2.plan.weatherChoice);
      m2.plan.windowReady=true;m2.plan.weatherPending=false;
      message(session,`Ventana revisada. Calidad prevista ${m2.plan.quality}%; la estación y el instrumento son compatibles.`,true);
    }
  }else if(action==='m2-weather'){
    if(!m2.plan.weatherPending)return rerender;
    if(id==='continue'){
      m2.plan.weatherChoice='continue';m2.plan.quality=observationQuality('campo','continue');
      m2.plan.windowReady=true;m2.plan.weatherPending=false;
      message(session,'Se continúa con nubosidad: medición posible, pero de calidad limitada. La incertidumbre quedará registrada.');
    }else if(id==='reschedule'){
      m2.plan.weatherChoice='reschedule';m2.plan.quality=observationQuality('campo','reschedule');
      m2.timeDelayHours+=24;m2.plan.windowReady=true;m2.plan.weatherPending=false;
      message(session,'Ventana reprogramada +24 h: mejor calidad simulada sin costo extra.',true);
    }else if(id==='switch'){
      resetPlan(m2,{target:'orbit',instrument:'astrometry',station:'quitilipi',weatherChoice:'switch',windowReady:true,quality:90});
      m2.plan.windowReady=true;m2.plan.weatherPending=false;m2.plan.quality=90;m2.plan.weatherChoice='switch';
      message(session,'Plan cambiado a astrometría óptica en la estación ficticia Quitilipi. El objetivo fotométrico queda pendiente.');
    }
  }else if(action==='m2-authorize'){
    const result=makeObservation(m2);
    if(!result.ok){
      message(session,result.reason==='incompatible'?'El conjunto elegido no es compatible; no se generaron datos ni se cobró.':'Revisá la ventana antes de autorizar.');
      return rerender;
    }
    if(m2.observations[result.kind]){message(session,'Esta medición ya fue procesada y no se cobrará nuevamente.');return rerender}
    const station=stations.find(item=>item.id===m2.plan.station);
    const charge=chargeOperation(root,m2,`observation:${result.kind}:v1`,station.cost,`${station.name} · ${station.instrument}`);
    if(!charge.ok){
      message(session,charge.reason==='duplicate'?'La operación ya está registrada; no hubo un segundo cargo.':'Créditos insuficientes para autorizar esta observación.');
      return rerender;
    }
    m2.observations[result.kind]=result.record;
    m2.plan.windowReady=false;m2.plan.weatherPending=false;
    message(session,`${result.record.result} Calidad ${result.record.quality}%. Costo ${station.cost} CR.`,true);
  }else if(action==='m2-complete-observations'){
    if(mission2ObservationsComplete(m2))complete(session,2);
    else message(session,'Falta evidencia válida de fotometría, astrometría óptica y espectroscopía. Cada técnica debe responder a su pregunta científica.');
  }else if(action==='m2-orbit-shape'){
    if(['circle','moderate','elongated'].includes(id))m2.orbitShape=id;
  }else if(action==='m2-orbit-interpretation'){
    if(correct)m2.orbitInterpretation=true;
    correctAnswer(session,correct,'Correcto: un arco mayor puede restringir la solución, pero no elimina incertidumbre.');
  }else if(action==='m2-orbit-analysis'){
    if(m2.orbitAnalysis){message(session,'El análisis orbital ya fue procesado; no se cobrará de nuevo.');return rerender}
    if(!m2.observations.astrometry?.valid){message(session,'Se necesitan posiciones astrométricas compatibles antes del análisis complementario.');return rerender}
    const result=chargeOperation(root,m2,'orbital-analysis:v1',40,'Análisis orbital complementario');
    if(!result.ok){message(session,result.reason==='duplicate'?'Operación registrada; no hubo segundo cargo.':'Créditos insuficientes para el análisis orbital.');return rerender}
    m2.orbitAnalysis=true;message(session,'Análisis educativo incorporado: incertidumbre moderada simulada; no es una probabilidad de impacto.',true);
  }else if(action==='m2-complete-orbit'){
    if(m2.orbitShape==='moderate'&&m2.orbitInterpretation&&m2.orbitAnalysis)complete(session,3);
    else message(session,'Seleccioná la órbita de excentricidad moderada, interpretá correctamente el arco de observación y procesá el análisis complementario.');
  }else if(action==='m2-rotate'){
    m2.orbitRotation=(m2.orbitRotation+25)%360;
  }else if(action==='m2-claim'){
    const claim=data.claim,category=data.category;
    if(!(claim in expectedClaims))return rerender;
    if(expectedClaims[claim]===category){
      m2.claims[claim]=category;
      message(session,'Clasificación registrada. Separaste correctamente la evidencia de una estimación o una afirmación no demostrada.',true);
    }else message(session,'No confundas medición con inferencia: el diámetro y la rotación son estimaciones, y certeza absoluta no está demostrada.');
  }else if(action==='m2-complete-profile'){
    if(Object.keys(m2.claims).length===Object.keys(expectedClaims).length)complete(session,4);
    else message(session,'Clasificá las ocho afirmaciones para consolidar el perfil y conservar las incertidumbres.');
  }else if(action==='m2-process-report'){
    if(m2.reportPrepared){message(session,'El informe ya fue procesado; no se cobrará otra vez.');return rerender}
    if(![0,1,2,3,4].every(phase=>m2.completed.includes(phase))||!mission2ObservationsComplete(m2)||!m2.orbitAnalysis){
      message(session,'El informe requiere las cinco fases previas, observaciones suficientes y análisis orbital.');
      return rerender;
    }
    const result=chargeOperation(root,m2,'scientific-report:v1',20,'Procesamiento e informe científico');
    if(!result.ok){message(session,result.reason==='duplicate'?'El informe ya está registrado.':'Créditos insuficientes para procesar el informe.');return rerender}
    m2.reportPrepared=true;message(session,'Informe generado con los resultados e incertidumbres de esta partida.',true);
  }else if(action==='m2-contingency'){
    if(m2.contingency){message(session,'La contingencia ya fue asignada.');return rerender}
    const result=chargeOperation(root,m2,'contingency:v1',30,'Contingencia científica opcional');
    if(!result.ok){message(session,'Créditos insuficientes para la contingencia opcional.');return rerender}
    m2.contingency=true;message(session,'Contingencia registrada para una revisión adicional; no altera ni inventa mediciones.');
  }else if(action==='m2-recommend'){
    if(id!=='B'){
      m2.recommendation=id;
      message(session,id==='A'?'No hay evidencia para justificar un impacto inmediato. La recomendación se rechaza.':'La investigación conserva incógnitas; no corresponde cerrar el expediente.');
      return rerender;
    }
    m2.recommendation='B';
    const score=mission2Total(m2);
    if(!m2.reportPrepared||![0,1,2,3,4].every(phase=>m2.completed.includes(phase))||!mission2ObservationsComplete(m2)||!m2.orbitAnalysis||Object.keys(m2.claims).length!==Object.keys(expectedClaims).length||score<60){
      message(session,`Revisión requerida: informe completo, observaciones suficientes, incertidumbres explícitas y mínimo 60 puntos. Puntaje actual: ${score}.`);
      return rerender;
    }
    m2.status='completada';m2.finalScore=mission2Total(m2);complete(session,5);
    const report=mission2Report(m2,creditsAvailable(root,m2));
    m2.mission3={unlocked:true,expediente:report,score:m2.finalScore,creditsRemaining:creditsAvailable(root,m2),recommendation:'Diseñar una misión de reconocimiento basada en datos e incertidumbres.'};
    if(!demo)root.mission3=m2.mission3;
    message(session,'EXPEDIENTE CG-01 APROBADO. MISIÓN 2 COMPLETADA. MISIÓN 3 DESBLOQUEADA: PROYECTO CENTINELA.',true);
  }else if(action==='m2-reset-demo'){
    if(demo){
      const clean=freshMission2Demo();
      clean.messages=[];session.m2=clean;
      message(session,'La partida DEMO fue reiniciada. El progreso real permanece intacto.');
    }
  }else if(action==='m2-sound'){
    m2.sound=!m2.sound;
    if(!demo)root.sound=m2.sound;
    beep(m2.sound,true);
  }else return false;
  save(session);
  return rerender;
}
