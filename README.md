# CHACO SPACE GUARD

Juego educativo con **Misión 1: Alerta en Campo del Cielo**, **Misión 2: Operación Huellas del Cosmos** y **Misión 3: Proyecto Centinela**. Proyecto independiente para NASA Space Apps Challenge / Mission Design Game, sin aval ni afiliación institucional de NASA. La Base Campo del Cielo y las estaciones de observación son ficticias.

## Ejecutar

No requiere paquetes, claves, cuentas ni Internet. Servir mediante HTTP; no abrir con `file://`.

Desde esta carpeta:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Alternativa con Node.js 20 o posterior:

```powershell
node server.mjs
```

Abrir **http://127.0.0.1:8765/cientifico.html**. `/index.html` redirige a la entrada solicitada. En VS Code: Live Server → clic derecho en `cientifico.html` → Open with Live Server. Mantener el mismo origen y puerto para recuperar la partida; LocalStorage depende del origen.

## Recorrido para presentar (8–12 minutos)

1. Iniciar misión; leer o saltar la introducción de SARA.
2. Activar energía → consola → conexión de datos. Esta última habilita el respaldo, no indica conexión NASA en vivo.
3. Clasificar conceptos por arrastre o seleccionando tarjeta y descripción. Ordenar espacio → atmósfera → suelo; elegir estudiar materiales del sistema solar.
4. Abrir las tres fichas NASA y reconocer que una aproximación no demuestra un impacto.
5. Revisar expediente (0), análisis educativo (15), solicitud complementaria (35), análisis ampliado (40). Identificar CG-01 como simulación.
6. Seleccionar estación y revisar el cambio meteorológico. Reprogramar la base local cuesta 25; usar Quitilipi cuesta 40. Continuar bajo nubes o sin equipo compatible consume recursos y no cumple el objetivo: se puede corregir pagando una operación adecuada.
7. Recomendar continuar observaciones por la incertidumbre persistente. Descargar el informe JSON al completar.

Ruta eficiente: gasto **115**, saldo **885**, puntuación **100**. Quitilipi: gasto 130, saldo 870. Gastar más de 150 reduce de 10 a 5 los puntos de administración. Sin temporizador ni riesgos aleatorios. Una alerta sin evidencia se rechaza, queda en la bitácora y requiere corrección; no se comunica a terceros. Los errores educativos se pueden corregir y recuperar sus puntos.

## Controles y accesibilidad

Mouse, táctil o Tab/Enter. Seleccionar concepto y descripción es la alternativa a arrastrar. Ayuda disponible en menú y misión. SARA permite ocultar mensajes y consultar el registro. Subtítulos progresivos sin voces externas. Sonidos sintetizados, inicialmente apagados. Respeta `prefers-reduced-motion`. Interfaz responsive.

## Estructura

```text
chaco-space-guard/
  cientifico.html            Entrada principal solicitada
  index.html                Acceso alternativo
  css/styles.css            Interfaz HUD responsive
  css/animations.css        Animaciones y movimiento reducido
  js/app.js                 Integración, eventos y progresión
  js/game-state.js          Estado, recursos y persistencia
  js/missions.js            Objetivos y narrativa
  js/nasa-api.js            Fetch, proxy opcional y respaldo
  js/minigames.js           Clasificación y Drag and Drop
  js/ui.js                  Vistas, mapas y trayectorias
  js/audio.js               Web Audio
  assets/images/            Reservado para recursos futuros
  assets/icons/             Emblema SVG integrado en ui.js
  assets/audio/             Sonidos sintetizados por código
  data/nasa-sample.json      Tres registros documentales NASA
  data/scenario-cg01.json    Escenario ficticio
  server.mjs                Servidor local opcional, solo loopback
  verify.mjs                Verificación de lógica en Node
  README.md
```

## Fuentes y límites científicos

**DATOS DE RESPALDO NASA:** tres registros de *Sample Data Output* en [JPL CAD v1.5, marzo 2023](https://ssd-api.jpl.nasa.gov/doc/cad.html), cotejados el **14 de noviembre de 2026**. Se preservan los valores documentales de 153814 (2001 WN5), 99942 Apophis (2004 MN4) y 2001 AV43. Este último no tiene diámetro publicado en esa muestra. No es una descarga actual del catálogo ni una evaluación vigente de riesgo. Los valores solo se redondean para mostrarlos. Fechas TDB, distancia nominal en au al centro de la Tierra, velocidad km/s, diámetro km. El cotejo documental no implica validación independiente de órbitas.

Por defecto Fetch consulta el JSON local. `loadNASA(proxy)` admite un endpoint que entregue el mismo esquema normalizado (`source`, `url`, `verified`, `notice`, `records`). Si falla, carga el respaldo. Si falta o es inválido, muestra error y reintento sin inventar registros ni completar esa fase. No se consulta CAD directamente desde el navegador. Un proxy futuro debe respetar las [políticas JPL](https://ssd-api.jpl.nasa.gov/doc/), mapear por nombre de campo, verificar `signature.version`, unidades, fuente y fecha. El demo no incluye un backend proxy.

**CONTENIDO REGIONAL:** [Turismo del Chaco](https://turismo.chaco.gob.ar/destinations/campo-del-cielo/) y [Argentina.gob.ar](https://www.argentina.gob.ar/jefatura/turismo-y-ambiente/turismo/viaja-por-argentina/conocer-los-meteoritos-en-el-campo-del-cielo). Campo del Cielo/Gancedo se presenta como patrimonio científico y cultural; Quitilipi como referencia regional. Los mapas son esquemas sin coordenadas ni límites exactos. No atribuyen observatorios reales a localidades.

**CONCEPTOS:** [NASA Meteors & Meteorites Facts](https://science.nasa.gov/solar-system/meteors-meteorites/facts/) y [NASA What's That Space Rock?](https://science.nasa.gov/solar-system/10-things-whats-that-space-rock/). Meteoro es el fenómeno luminoso y meteorito el material que llega al suelo. La secuencia representa un fragmento que sobrevive: no todas las entradas producen meteoritos.

**SIMULACIÓN:** CG-01, tamaño, velocidad, horizonte, meteorología, estaciones, costos y calidad son ficticios. Calidad documental mide tareas educativas, nunca probabilidad física. Órbitas y Tierra son ilustraciones sin escala ni efemérides. CG-01 no se presenta como amenaza real.

## Progresión y guardado

Campaña: 1.000 créditos. Una investigación completada no se cobra otra vez. Operaciones fallidas consumen su costo y se registran. Nunca se admiten créditos negativos. Se puede reiniciar desde el menú confirmando el reemplazo de la partida.

`saveGame()`, `loadGame()` y `resetGame()` en `game-state.js`; clave `chaco-space-guard-v1`. Guarda fase, objetivos, acciones, créditos, decisiones, insignias, calidad, configuración, estado y desbloqueo. Datos inexistentes/corruptos vuelven a un estado seguro. Si el navegador bloquea escritura, se muestra aviso. Sin sincronización entre dispositivos ni protección contra edición manual.

Puntuación: conceptos 15, NASA 25, fuentes 20, observaciones 15, recursos 10 e informe 15. Excelente 80–100; misión cumplida 60–79; revisión requerida 0–59. El cierre exige objetivos obligatorios, decisión fundamentada B y al menos 60 puntos. Las actividades permiten corrección. Se conserva expediente y saldo para futuras misiones.

## Verificación

```powershell
node verify.mjs
```

Prueba de eventos con adaptador DOM mínimo: partida completa, arranque y orden incorrectos/correctos, bloqueo de fases, clasificación, secuencia, lectura NASA obligatoria, gastos idempotentes, rechazo de alerta, fuentes, observación incompatible y corrección, informe incorrecto/correcto, 100 puntos, gasto 130/saldo 870, guardado/restauración, saldo insuficiente y JSON corrupto. No sustituye un navegador. Sintaxis: `node --check js/app.js`, y lo mismo para los demás módulos.

Límite de verificación: la conexión del navegador automatizado al servidor local devolvió timeout; no se afirma validación visual, táctil ni de consola en navegador real. Antes de presentar, recorrer la ruta indicada, probar ancho móvil y revisar consola.

Gráficos y sonidos generados por código; no se descargan medios externos.

## Misión 2: Operación Huellas del Cosmos

La Misión 2 continúa en esta misma aplicación. Al completar las seis estaciones de Misión 1, el menú habilita **Iniciar/Continuar Misión 2**. Se conserva `chaco-space-guard-v1` y los datos de Misión 2 se agregan en `state.mission2`; los créditos actuales de la campaña son la cartera compartida. CG-01 hereda sus valores narrativos de `data/cg01-mission2.json`.

Si todavía no está desbloqueada, **DEMO DEBUG · MISIÓN 2** permite probar las seis fases con un caso de muestra y 1.000 créditos. Su guardado se aísla en `chaco-space-guard-mission2-demo-v1`, sin leer ni modificar la partida real. Se puede reiniciar desde la propia demo.

La experiencia jugable incluye selección y priorización de objetivos, clasificación de muestras, relación de técnicas, selección compatible de objetivo/instrumento/estación, evento meteorológico reproducible, costos idempotentes, datos SBDB de Eros con respaldo local, minijuego orbital Canvas, visor giratorio, clasificación de evidencia y generación de informe. La Misión 3 no se implementa todavía; su expediente preparado queda en `state.mission3` y `state.mission2.mission3`.

Fuentes NASA/JPL:

- [SBDB API de 433 Eros](https://ssd-api.jpl.nasa.gov/sbdb.api?sstr=Eros&phys-par=1)
- [Documentación Small-Body Database API](https://ssd-api.jpl.nasa.gov/doc/sbdb.html)

La consulta en vivo es opcional: se intenta mediante Fetch y, si el navegador no permite la conexión (por ejemplo, CORS), se carga `data/nasa-sbdb-sample.json`, un respaldo documental fechado. En pantalla se distinguen consulta en vivo y respaldo. Eros es real; CG-01, estaciones, clima, costos y resultados narrativos son ficticios y no representan riesgo ni una solución física.

Para validar Misión 1 y Misión 2:

```powershell
node verify.mjs
```

La prueba también verifica bloqueo/desbloqueo, aislamiento DEMO, instrumentos incompatibles sin cargo, no duplicación de gastos, estado restaurable, 100 puntos y transferencia de saldo/expediente a la futura Misión 3.

## Misión 3 — Proyecto Centinela (implementada)

La tercera misión se integra en `cientifico.html`. Su acceso de campaña requiere Misión 2 completada y el expediente desbloqueado; el botón **DEMO DEBUG · MISIÓN 3** permite probarla sin modificar el guardado real. La Misión 4 queda desbloqueada como dato de continuidad; todavía no está implementada.

Instrucciones, modelo, pruebas y fuentes: [README-mission3.md](README-mission3.md).
