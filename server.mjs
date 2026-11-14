import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT)||8765;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
http.createServer((req,res)=>{let filename;try{filename=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!filename.startsWith(root+path.sep)&&filename!==root)throw Error();if(filename===root)filename=path.join(root,'index.html');if(req.url==='/favicon.ico'){res.writeHead(204);return res.end()}const data=fs.readFileSync(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Archivo no encontrado')}}).listen(port,'127.0.0.1',()=>console.log(`CHACO SPACE GUARD: http://127.0.0.1:${port}/cientifico.html`));

