# Misión 3 · Proyecto Centinela

Implementación integrada en `cientifico.html` y en la cartera de campaña existente. No reemplaza módulos de las Misiones 1 y 2. Sigue siendo HTML/CSS/ES6+ sin dependencias.

## Abrir y jugar

Desde `chaco-space-guard`: `node server.mjs`, luego http://127.0.0.1:8765/cientifico.html . También Live Server o `python -m http.server 8765 --bind 127.0.0.1`. No abrir mediante file://.

El acceso de campaña verifica `mission2.status === 'completada'`, su fase final completada y `mission3.unlocked`. El expediente se toma de la transferencia efectiva de Misión 2, no del saldo de referencia. Datos ausentes se muestran como desconocidos. Los objetivos mínimos de imágenes y espectros se mantienen para caracterizar la superficie, sin prometer resolver masa o estructura interna.

**DEMO DEBUG · MISIÓN 3** utiliza una partida aislada con 680 créditos configurables a 600/680/850. Tiene reinicio propio. Nunca escribe la clave de campaña. No interpreta un DEMO de Misión 2 como una campaña real completada.

Ruta de presentación:

1. Ingresar al taller. Relacionar imágenes→cámara, materiales→espectrómetro, transmitir→comunicaciones, maniobra→propulsión/control, mantener equipos→energía. Declarar base, cámara, espectrómetro, antena y propulsión esenciales; autonomía opcional. Paneles adicionales son una solución energética, no un requisito científico por sí solos.
2. Instalar plataforma, cámara, espectrómetro, antena, propulsión y paneles solares. Validar: 420 CR, 219 kg, 250 W nominales disponibles, 165 W consumidos, margen 85 W. Instalar/retirar es gratis.
3. Confirmar diagnóstico. La reserva de 250 CR para operaciones futuras es obligatoria para aprobar. El objetivo de costo 420 CR es recomendado, distinto de presupuesto/reserva obligatorios.
4. Elegir encuentro prolongado, perfil extendido de 240 kg, red de espacio profundo y tres contactos. Cada contacto simulado admite 40 MB; el ciclo requiere 100 MB. Un solo contacto falla y puede corregirse. Los perfiles de lanzamiento no tienen costo adicional de diseño ni fechas reales; sus operaciones futuras corresponden a la reserva, sin simular ejecución aún.
5. Ejecutar energía, comunicaciones, instrumentos y maniobra. Confirmar las cuatro pruebas. Un cambio técnico invalida los resultados y los objetivos técnicos posteriores: volver a validar taller y diagnóstico, plan y pruebas.
6. Revisar las cuatro afirmaciones y aprobar. Un único cargo de 420 deja 260 CR en el DEMO estándar; obtener 100 puntos y descargar el expediente. La aprobación cierra el diseño, evitando discrepancias con el cargo y la nave exportada.

Para otra arquitectura: sobrevuelo es viable con perfil de masa compatible, pero aporta menos tiempo científico y 5 puntos menos de planificación. Aproximación de alto riesgo requiere autonomía avanzada. No se afirma que estas opciones sean físicamente imposibles; son restricciones educativas explícitas.

## Modelo simplificado

Catálogo y parámetros en cinco JSON de `data/`. Todos los costos, masas, potencias, ventanas y rendimientos son ficticios.

Perfil simultáneo: sumar consumos. Por turnos: cámara, espectrómetro y antena alternan; se suma la mayor demanda de esos tres a propulsión/control y autonomía. Aumenta el tiempo de operación; no elimina datos ni inventa generación. Sin paneles y sin autonomía: 140−(55+30)=55 W, masa 197 kg, costo 365 CR. Con autonomía serían 35 W, insuficientes sin generación adicional. La capacidad nominal de la plataforma incluye servicios de energía simplificados; no se modelan baterías, eclipses, degradación o distancia solar.

Límites: 240 kg, margen 40 W, reserva 250 CR. Con todos los componentes: 231 kg, 455 CR, margen 65 W; con saldo 680 falla la reserva (225 CR). La masa máxima se valida aunque el catálogo actual no permite exceder 240 kg; la prueba unitaria utiliza un catálogo de ensayo más pesado para cubrir esa frontera.

Los W asignados a propulsión NO calculan empuje, delta-v ni combustible. Trayectorias Canvas didácticas, sin escala ni efemérides. GMAT y Mission Viz son referencias, no motores integrados. La nave es de reconocimiento; no adquiere capacidades de desvío de asteroides.

## Arquitectura y continuidad

- `mission3.js`: integración, eventos, seis fases, pruebas y revisión conceptual.
- `mission3-state.js`: adaptador versionado, transacción única y persistencia.
- `mission3-ui.js`, CSS propios: planos SVG modulares, HUD, cinemática y Canvas.
- `spacecraft-components.js`: Fetch y validación del catálogo.
- `spacecraft-builder.js`: instalar/retirar e invalidación.
- `spacecraft-validator.js`: masa, costo, perfil eléctrico, requisitos y reserva.
- `communication-simulator.js`, `trajectory-simulator.js`: validadores deterministas.
- `mission3-minigames.js`: asociaciones y Drag and Drop con alternativa por selección.

Se reutilizan `ui.js` (escape, botones, emblema), `audio.js`, `game-state.js` (cartera y saveGame), navegación general y transferencia M2. La clave real sigue siendo `chaco-space-guard-v1`; el subestado versionado está en `mission3.design`, preservando `mission3.expediente`, las misiones previas y sus decisiones. DEMO: `chaco-space-guard-mission3-demo-v1`. Los archivos faltantes bloquean el taller con reintento. Los subestados corruptos se descartan sin borrar M1/M2.

La aprobación usa un ID `mission3:<playId>:approval:v1`; repetirla no vuelve a cobrar. Si falla el guardado al aprobar, se revierte el cargo y no se desbloquea M4. La continuidad se publica en `mission4.spacecraft`: componentes reales, masa, costo, generación, consumo, margen, perfil, capacidades científicas, enlaces, ruta, pruebas, riesgos y expediente heredado. `mission4.unlocked` exige validez, pruebas vigentes, revisión y al menos 60 puntos.

Puntaje: requisitos 15, instrumentos 20, masa/energía 20, presupuesto 15, plan 15, pruebas 10, justificación 5. Exceder costo objetivo reduce presupuesto a 10; estrategia distinta de encuentro prolongado reduce planificación a 10. Ningún puntaje sustituye requisitos críticos. Excelente 80–100; cumplida 60–79; rediseño 0–59.

## Pruebas

```powershell
node js/mission3-tests.js
node verify.mjs
```

La prueba M3 recorre seis fases mediante los mismos handlers del juego y verifica bloqueo, herencia parcial, instalación, cálculos exactos, falta de instrumentos, exceso de masa, falta de energía/reserva, perfil incompatible, comunicaciones insuficientes/corregidas, invalidación, aprobación, cobro único, rollback de escritura fallida, guardado/restauración, DEMO aislada y archivos faltantes. `verify.mjs` conserva la regresión de Misiones 1 y 2.

Verificación adicional en navegador real: recorrido completo DEMO hasta 100 puntos/saldo 260, componentes visibles, recarga y restauración, consola sin errores. Se corrigió desborde móvil y se midió viewport 498 px / contenido 483 px en taller y consejo. El teclado usa botones nativos y Tab/Enter; no se realizó auditoría formal con lectores de pantalla ni prueba táctil en dispositivo físico.

## Referencias oficiales

Consultadas el 14/11/2026; fundamento educativo, no fuente de las magnitudes ficticias:

- [Design and Develop Science Missions](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf): objetivos, segmentos y proceso de diseño.
- [Mission Design Lab](https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/): entorno de ingeniería y maduración de conceptos.
- [GMAT](https://software.nasa.gov/software/GSC-19468-1): referencia conceptual de diseño y navegación; no integrado.
- [Mission Viz](https://nasa.github.io/mission-viz/): referencia de visualización de trayectorias, sin reutilizar su motor.
- [Build It Yourself](https://science.nasa.gov/mission/webb/game-build-it-yourself/): inspiración educativa para selección de instrumentos.
- [SBDB](https://ssd-api.jpl.nasa.gov/doc/sbdb.html): continuidad de fuentes astronómicas reales de M2; CG-01 no pertenece al catálogo.
- [CubeSat 101](https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf) y [Concept Maturity Levels](https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299): enlaces solicitados incluidos como lectura adicional. Su descarga no estuvo disponible en la herramienta de consulta; no se atribuyen cifras ni reglas de implementación a esos documentos. MDL sí describe madurez conceptual; no se asigna una certificación CML oficial al jugador.

La base, CG-01 y las estaciones son ficticios. Proyecto sin afiliación ni aval de NASA. La aprobación es conceptual dentro del juego, nunca certificación de vuelo espacial.
