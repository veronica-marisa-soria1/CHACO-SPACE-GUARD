const KEY='chaco-space-guard-v1';
export const fresh=()=>({version:1,started:false,phase:0,completed:[],credits:1000,spent:0,systems:0,classified:[],sequence:[],regional:false,opened:[],nasa:false,actions:[],quality:0,distinction:false,station:null,weather:false,observation:false,decisions:[],badges:[],status:'en curso',nextMission:false,messages:[],sound:false,mission2:null,mission3:null});
export let state=fresh();
export function saveGame(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{return false}}
export function loadGame(){try{const s=JSON.parse(localStorage.getItem(KEY));if(!s)return false;if(s.version!==1||!Number.isInteger(s.phase)||s.phase<0||s.phase>6||!Number.isInteger(s.credits)||s.credits<0||s.credits>1000||s.spent!==1000-s.credits||!['completed','classified','sequence','opened','actions','decisions','badges','messages'].every(k=>Array.isArray(s[k]))||!Number.isInteger(s.systems)||s.systems<0||s.systems>3)throw Error();
// Validar también la estructura interna para no restaurar estados ilegibles.
if(!['en curso','completada'].includes(s.status)||!Number.isFinite(s.quality)||s.quality<0||s.quality>100||!s.completed.every(n=>Number.isInteger(n)&&n>=1&&n<=6)||!s.opened.every(n=>Number.isInteger(n)&&n>=0&&n<3)||!s.sequence.every((n,i)=>n===i)||!s.classified.every(t=>['ASTEROIDE','METEORO','METEORITO'].includes(t))||!s.actions.every(t=>['review','risk','observe','orbit'].includes(t))||!['decisions','badges','messages'].every(k=>s[k].every(t=>typeof t==='string'))||!['started','regional','nasa','distinction','weather','observation','nextMission','sound'].every(k=>typeof s[k]==='boolean')||(s.station!==null&&![0,1,2].includes(s.station)))throw Error();
state={...fresh(),...s};return true}catch{state=fresh();return false}}
export function resetGame(){state=fresh();saveGame()}
export function spend(cost,label){if(!Number.isFinite(cost)||cost<0||state.credits<cost)return false;state.credits-=cost;state.spent+=cost;state.decisions.push(`${label}: ${cost} créditos`);return true}
export function score(){return {conceptos:state.completed.includes(2)?15:0,nasa:state.nasa?25:0,fuentes:state.distinction?20:0,observaciones:state.observation?15:0,recursos:state.completed.includes(5)?(state.spent<=150?10:5):0,informe:state.status==='completada'?15:0}}
export const total=()=>Object.values(score()).reduce((a,b)=>a+b,0);
