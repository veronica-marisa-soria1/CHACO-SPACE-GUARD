export function evaluateCommunication(m3,requirements){
 const antenna=m3.components.includes('antenna'),deep=m3.communication.architecture==='deep',contacts=m3.communication.contacts;
 const capacity=antenna&&deep?contacts*requirements.contactCapacityMB:0;
 return {passed:antenna&&deep&&capacity>=requirements.dataMB,capacity,data:requirements.dataMB,explanation:!antenna?'Falta antena de alta ganancia.':!deep?'El enlace directo local no sustituye una red de espacio profundo.':capacity<requirements.dataMB?`Solo ${capacity} MB de ${requirements.dataMB} MB: aumentar contactos.`:`${capacity} MB disponibles para ${requirements.dataMB} MB. Red y antena compatibles.`,chain:'CENTINELA-01 → Red de espacio profundo → Centro de Control Campo del Cielo (ficticio)'};
}
