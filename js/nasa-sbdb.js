function numberField(list,name){
  const item=Array.isArray(list)?list.find(entry=>entry.name===name):null;
  if(!item||item.value===undefined||item.value===null||item.value==='')return null;
  const value=Number(item.value);
  return Number.isFinite(value)?{value,unit:item.units||''}:null;
}

export function normalizeSBDB(raw,queriedAt=new Date().toISOString().slice(0,10)){
  if(!raw?.object||!raw?.orbit)throw Error('La respuesta SBDB no contiene un objeto y su órbita.');
  const orbit=raw.orbit,physical=Array.isArray(raw.phys_par)?raw.phys_par:[];
  const elements=orbit.elements;
  return {
    source:'NASA/JPL Small-Body Database (SBDB)',
    url:'https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Eros&phys-par=1',
    object:raw.object.shortname||raw.object.fullname||raw.object.des||'Objeto sin nombre en la respuesta',
    queriedAt,sampleOnly:false,
    notice:'Dato de referencia de un asteroide real. No describe CG-01.',
    orbit:{
      semiMajorAxis:numberField(elements,'a'),
      eccentricity:numberField(elements,'e'),
      inclination:numberField(elements,'i'),
      period:numberField(elements,'per'),
      firstObservation:orbit.first_obs||null,
      lastObservation:orbit.last_obs||null,
      observationArcDays:orbit.data_arc?Number(orbit.data_arc):null
    },
    physical:{
      diameter:numberField(physical,'diameter'),
      rotationPeriod:numberField(physical,'rot_per')
    }
  };
}

export async function loadSBDB(fetcher=fetch){
  let liveError='';
  try{
    const response=await fetcher('https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Eros&phys-par=1',{signal:AbortSignal.timeout(4500)});
    if(!response.ok)throw Error(`HTTP ${response.status}`);
    return normalizeSBDB(await response.json());
  }catch(error){
    liveError=error instanceof Error?error.message:'Error de conexión';
  }
  const response=await fetcher('data/nasa-sbdb-sample.json');
  if(!response.ok)throw Error(`No se pudo consultar SBDB ni cargar data/nasa-sbdb-sample.json: ${liveError}`);
  const sample=await response.json();
  if(sample.source!=='NASA/JPL Small-Body Database (SBDB)'||sample.object!=='433 Eros'||!sample.sampleOnly)throw Error('El respaldo NASA/JPL no pasó la validación de procedencia.');
  return {...sample,backup:true,liveError,notice:`${sample.notice} Consulta en vivo no disponible (${liveError}).`};
}
