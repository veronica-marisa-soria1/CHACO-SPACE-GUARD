function paintOrbit(canvas,selected){
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const width=canvas.width,height=canvas.height;
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#071522';ctx.fillRect(0,0,width,height);
  const ellipses=[{id:'circle',rx:85,ry:68,label:'e = 0,05'},{id:'moderate',rx:112,ry:59,label:'e = 0,223'},{id:'elongated',rx:140,ry:40,label:'e = 0,65'}];
  ellipses.forEach((orbit,index)=>{
    ctx.save();ctx.translate(width/2,height/2);ctx.rotate(-.16);
    ctx.strokeStyle=orbit.id===selected?'#38bdf8':`rgba(120,174,197,${.35-index*.06})`;
    ctx.lineWidth=orbit.id===selected?3:1.4;ctx.beginPath();ctx.ellipse(0,0,orbit.rx,orbit.ry,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.arc(-orbit.rx*.35,0,5,0,Math.PI*2);ctx.fill();
    ctx.restore();
    ctx.fillStyle=orbit.id===selected?'#e2e8f0':'#91a7b5';
    ctx.font='14px Segoe UI, sans-serif';ctx.fillText(orbit.label,20+index*190,height-18);
  });
  ctx.fillStyle='#f59e0b';ctx.font='12px Segoe UI, sans-serif';ctx.fillText('Sol (foco ilustrativo)',12,20);
}

function paintAsteroid(canvas,rotation){
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const width=canvas.width,height=canvas.height,cx=width/2,cy=height/2;
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle='#071522';ctx.fillRect(0,0,width,height);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(rotation*Math.PI/180);
  const points=[[0,-75],[49,-58],[80,-17],[71,35],[35,70],[-17,76],[-68,49],[-82,3],[-59,-45]];
  const scaleX=.74+Math.abs(Math.sin(rotation*Math.PI/180))*.26;
  ctx.scale(scaleX,1);ctx.beginPath();
  points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();
  const shade=ctx.createRadialGradient(-30,-36,8,8,10,110);
  shade.addColorStop(0,'#c7b59a');shade.addColorStop(.4,'#716859');shade.addColorStop(1,'#303943');
  ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle='#d5c7ac';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#28313b';
  [[-31,-20,9],[30,15,12],[4,43,7]].forEach(([x,y,r])=>{ctx.beginPath();ctx.ellipse(x,y,r,r*.7,0,0,Math.PI*2);ctx.fill()});
  ctx.restore();
  ctx.fillStyle='#91a7b5';ctx.font='13px Segoe UI, sans-serif';ctx.textAlign='center';
  ctx.fillText('Modelo visual ilustrativo · no está a escala',cx,height-18);
}

export function mountMission2Visuals(root,m2){
  paintOrbit(root.querySelector('#m2-orbit-canvas'),m2.orbitShape);
  paintAsteroid(root.querySelector('#m2-asteroid-canvas'),m2.orbitRotation);
}
