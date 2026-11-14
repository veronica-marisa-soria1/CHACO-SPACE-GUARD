// Ediciones de borrador gratuitas; cualquier cambio invalida las pruebas previas.
import {invalidate} from './mission3-state.js';
export function editComponent(m3,catalog,id,install){if(m3.approved||!catalog.some(c=>c.id===id))return false;const has=m3.components.includes(id);if(has===install)return false;m3.components=install?[...m3.components,id]:m3.components.filter(x=>x!==id);invalidate(m3);return true}
