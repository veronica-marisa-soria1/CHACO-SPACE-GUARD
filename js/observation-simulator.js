export const stations=[
  {id:'campo',name:'Base Campo del Cielo',instrument:'Fotometría básica',capability:'photometry',condition:'Cielo parcialmente cubierto',cost:25,hours:2},
  {id:'quitilipi',name:'Estación Quitilipi',instrument:'Astrometría óptica',capability:'astrometry',condition:'Cielo despejado',cost:35,hours:3},
  {id:'apoyo',name:'Estación Nacional de Apoyo',instrument:'Espectroscopía',capability:'spectroscopy',condition:'Disponibilidad limitada',cost:50,hours:4}
];
export const targets=[
  {id:'diameter',name:'Acotar el diámetro',instrument:'photometry',description:'Variaciones de brillo y modelo didáctico de tamaño.'},
  {id:'rotation',name:'Estimar la rotación',instrument:'photometry',description:'Curva de luz simulada; la forma puede influir en el brillo.'},
  {id:'orbit',name:'Mejorar el conocimiento orbital',instrument:'astrometry',description:'Mediciones de posición repetidas para refinar la trayectoria.'},
  {id:'surface',name:'Buscar indicios de superficie',instrument:'spectroscopy',description:'Características de la luz compatibles con materiales; no confirma mineralogía.'}
];
export const instruments=[
  {id:'photometry',name:'Fotometría',description:'Mide variaciones de brillo.'},
  {id:'astrometry',name:'Astrometría óptica',description:'Mide posiciones aparentes del objeto.'},
  {id:'spectroscopy',name:'Espectroscopía',description:'Analiza características de la luz para buscar indicios composicionales.'}
];

export function compatible(targetId,instrumentId,stationId){
  const target=targets.find(item=>item.id===targetId);
  const station=stations.find(item=>item.id===stationId);
  return Boolean(target&&station&&target.instrument===instrumentId&&station.capability===instrumentId);
}

export function observationQuality(stationId,weatherChoice){
  if(stationId==='campo')return weatherChoice==='reschedule'?92:weatherChoice==='continue'?58:0;
  if(stationId==='quitilipi')return 90;
  if(stationId==='apoyo')return 78;
  return 0;
}

export function makeObservation(m2){
  const {target,instrument,station,weatherChoice}=m2.plan;
  if(!compatible(target,instrument,station))return {ok:false,reason:'incompatible'};
  if(!m2.plan.windowReady)return {ok:false,reason:'window'};
  const quality=observationQuality(station,weatherChoice);
  if(quality<50)return {ok:false,reason:'quality'};
  const record={
    valid:true,target,instrument,station,quality,
    result:instrument==='photometry'?'Curva de brillo simulada, utilizable con limitaciones.':
      instrument==='astrometry'?'Posiciones ópticas simuladas añadidas al arco de observación.':
      'Espectro simulado con indicios compatibles con material rocoso.',
    uncertainty:quality<70?'Calidad limitada por nubosidad; requiere confirmación.':'Resultado educativo de calidad adecuada; conserva incertidumbres.'
  };
  return {ok:true,kind:instrument,record};
}
