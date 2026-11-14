export function evaluateTrajectory(m3,trajectories,mass){
 const launch=trajectories.launches.find(p=>p.id===m3.launch),strategy=trajectories.strategies.find(p=>p.id===m3.strategy),errors=[];
 if(!strategy)errors.push('Seleccionar estrategia de encuentro');
 if(!launch)errors.push('Seleccionar perfil de lanzamiento');
 if(launch&&mass>launch.capacity)errors.push('Masa excede la capacidad del perfil de lanzamiento');
 if(launch&&strategy&&!launch.strategies.includes(strategy.id))errors.push('Perfil de lanzamiento incompatible con la estrategia');
 if(!m3.components.includes('propulsion'))errors.push('Falta propulsión y control de actitud');
 if(m3.strategy==='close'&&!m3.components.includes('autonomy'))errors.push('La aproximación exigente requiere autonomía en este escenario');
 return {passed:errors.length===0,errors,explanation:errors.join('. ')||'Perfil compatible, capacidad de masa y maniobra verificadas. Trayectoria ilustrativa sin efemérides.',risk:m3.strategy==='close'?'Exposición operativa elevada':m3.strategy==='flyby'?'Tiempo cercano reducido':'Mayor complejidad de maniobra'};
}
