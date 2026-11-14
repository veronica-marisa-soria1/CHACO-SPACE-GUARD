// Todas las magnitudes son ficticias y nominales, sin pretensión de simulación física.
export function installed(ids,catalog){return catalog.filter(c=>ids.includes(c.id))}
export const calculateMass=(ids,catalog)=>installed(ids,catalog).reduce((n,c)=>n+c.mass,0);
export const calculateCost=(ids,catalog)=>installed(ids,catalog).reduce((n,c)=>n+c.cost,0);
export function powerBudget(ids,catalog,profile='simultaneous'){
 const parts=installed(ids,catalog),generation=parts.reduce((n,c)=>n+c.generation,0);
 // Por turnos: cámara, espectrómetro y transmisión nunca operan simultáneamente.
 // Propulsión/control y autonomía conservan su demanda en el peor turno.
 const payload=['camera','spectrometer','antenna'];
 const consumption=profile==='staggered'?parts.filter(c=>!payload.includes(c.id)).reduce((n,c)=>n+c.power,0)+Math.max(0,...parts.filter(c=>payload.includes(c.id)).map(c=>c.power)):parts.reduce((n,c)=>n+c.power,0);
 return {generation,consumption,margin:generation-consumption};
}
export const calculatePowerMargin=(ids,catalog,profile='simultaneous')=>powerBudget(ids,catalog,profile).margin;
export function validateRequirements(m3,catalog,requirements){return requirements.required.filter(id=>!m3.components.includes(id)).map(id=>`Falta ${catalog.find(c=>c.id===id)?.name||id}`)}
export function validateSpacecraft(m3,catalog,requirements,balance){
 const ids=m3.components,mass=calculateMass(ids,catalog),cost=calculateCost(ids,catalog),p=powerBudget(ids,catalog,m3.profile),remaining=balance-cost,errors=validateRequirements(m3,catalog,requirements),warnings=[];
 if(ids.some(id=>!catalog.some(c=>c.id===id))||new Set(ids).size!==ids.length)errors.push('Componentes desconocidos o duplicados');
 if(mass>requirements.maxMass)errors.push('Masa superior a 240 kg: retirar componentes');
 if(p.margin<requirements.minMargin)errors.push('Margen eléctrico inferior a 40 W: agregar generación o programar turnos');
 if(cost>balance)errors.push('Presupuesto insuficiente');
 if(remaining<requirements.reserve)errors.push('Reserva obligatoria para Misión 4 inferior a 250 créditos');
 if(cost>requirements.targetCost)warnings.push('Se supera el costo objetivo de 420 créditos');
 if(m3.profile==='staggered')warnings.push('Operación por turnos: instrumentos sin simultaneidad; mayor tiempo operativo');
 return {valid:errors.length===0,errors,warnings,mass,cost,...p,remaining,capabilities:installed(ids,catalog).map(c=>c.capability)};
}
