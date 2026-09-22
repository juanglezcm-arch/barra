"use strict";
const APP_VERSION="1.0.0";
fetch("catalogo.json",{cache:"no-cache"}).then(r=>r.json()).then(main).catch(e=>{
  console.error(e);
  document.getElementById("app").innerHTML='<p class="empty">No se ha podido cargar el catálogo. Abre la app una vez con conexión.</p>';
});

/* Service worker: funciona sin conexión y avisa cuando hay versión nueva */
if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").then(reg=>{
      const offer=w=>{window.__barraUpdate=()=>w.postMessage("skipWaiting"); document.dispatchEvent(new Event("barra-update"))};
      if(reg.waiting&&navigator.serviceWorker.controller)offer(reg.waiting);
      reg.addEventListener("updatefound",()=>{const w=reg.installing; w.addEventListener("statechange",()=>{if(w.state==="installed"&&navigator.serviceWorker.controller)offer(w)})});
      document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")reg.update().catch(()=>{})});
    }).catch(()=>{});
    let reloading=false; navigator.serviceWorker.addEventListener("controllerchange",()=>{if(!reloading){reloading=true;location.reload()}});
  });
}
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});

function main(CATALOGO){
/* ===== Datos: catálogo ingerido de los clippings ===== */
const SOURCES = {}; CATALOGO.fuentes.forEach(f=>SOURCES[f.id]=f);
const EX = {}; CATALOGO.ejercicios.forEach(e=>EX[e.id]=e);
const LADDERS = {}; CATALOGO.escaleras.forEach(s=>LADDERS[s.id]={nombre:s.nombre,peldanos:s.peldanos});

// Pierna: ninguna fuente la cubre todavía. Se sustituye cuando llegue un clipping de pierna.
function P(id,nombre,tipo="repes"){EX[id]={id,nombre,tipo,provisional:true,cues:[],errores:[],criterios:[],notas:null,fuentes:[]}}
P("p_bulgara","Sentadilla búlgara"); P("p_shrimp_asistida","Shrimp squat asistida"); P("p_pistol_caja","Pistol a caja"); P("p_pistol","Pistol squat"); P("p_pistol_lastrado","Pistol squat lastrado");
LADDERS.pierna={nombre:"Pierna: búlgara → pistol",peldanos:["p_bulgara","p_shrimp_asistida","p_pistol_caja","p_pistol","p_pistol_lastrado"]};
// Nombres de versiones anteriores (para el historial)
const LEGACY={p_fondos_lastrados:"Fondos lastrados",p_dominada_lastrada:"Dominada lastrada",p_remo_arquero:"Remo arquero",p_df_tuck:"Dragon flag tuck",p_toes_to_bar:"Toes to bar",p_dominada_arquera:"Dominada arquera",p_lsit_tuck:"Tuck L-sit",p_remo_australiano_elevado:"Remo australiano pies elevados",p_elev_piernas:"Elevación de piernas colgado",p_dominada_pecho:"Dominada pecho a la barra"};
const exName=id=>(EX[id]&&EX[id].nombre)||LEGACY[id]||id;

/* Plantillas. Primer ejercicio = lo que más cuesta. Secuencia A/B sin fechas.
   track: varios huecos comparten nivel (el pino se practica los tres días de empuje).
   rangos: series y rango propios de un peldaño concreto. */
const S=(id,ladder,start,series,min,max,o={})=>({id,ladder,start,_r:[series,min,max],...o});
const HOLD_PLANCHA={lean_planche:[4,8,15],tuck_planche:[4,8,15],adv_tuck_planche:[4,6,15],straddle_planche_goma:[4,5,7],straddle_planche:[4,4,10],half_lay_planche:[4,4,10],full_planche:[5,2,5]};
const PINO={pino_paralelas_hombros:[4,15,30],pino_pared_caminando:[4,15,30],pino_pared_espaldas:[4,20,45],pino_libre:[6,5,15],pino_una_mano:[6,2,5]};
const PLANTILLAS=[
 {id:"A1",patron:"Empuje",tipo:"Pesado",descanso:180,slots:[
   S("A1_pino","pino_equilibrio","pino_pared_caminando",4,15,30,{track:"pino",rangos:PINO}),
   S("A1_vert","empuje_vertical","hspu_pared_parcial",4,3,5),
   S("A1_hor","camino_una_mano","flex_arquera",3,3,5,{lado:true}),
   S("A1_fondos","fondos_lastre","fondos_lastrados",3,3,5,{lastre:true,kg0:5}),
   S("A1_pierna","pierna","p_pistol_caja",3,3,5,{lado:true})]},
 {id:"B1",patron:"Tirón",tipo:"Pesado",descanso:180,slots:[
   S("B1_dom","dominada_lastre","dominada_lastrada",4,3,5,{lastre:true,kg0:5}),
   S("B1_uni","tiron_una_mano","aguante_una_mano",3,3,5,{lado:true,rangos:{aguante_una_mano:[3,5,10]}}),
   S("B1_remo","remo","remo_arquero",3,4,6,{lado:true}),
   S("B1_core","core_colgado","toes_to_bar",3,5,8)]},
 {id:"A2",patron:"Empuje",tipo:"Técnica",descanso:120,slots:[
   S("A2_pino","pino_equilibrio","pino_pared_caminando",4,15,30,{track:"pino",rangos:PINO}),
   S("A2_fuerza","pino_fuerza","rana",4,5,10,{rangos:{rana:[4,5,10],enanito:[4,5,10],pino_fuerza:[4,1,5]}}),
   S("A2_hold","plancha_aguante","lean_planche",4,8,15,{rangos:HOLD_PLANCHA}),
   S("A2_plancha","plancha_flexiones","flex_lean_planche",3,4,6),
   S("A2_pierna","pierna","p_shrimp_asistida",3,4,6,{lado:true})]},
 {id:"B2",patron:"Tirón",tipo:"Técnica",descanso:120,slots:[
   S("B2_expl","tiron_explosivo","dominada_explosiva",4,3,4,{rangos:{muscle_up:[4,2,5]}}),
   S("B2_fl","front_lever","fl_tuck",4,5,15),
   S("B2_lsit","lsit","lsit_tuck",4,10,30,{track:"lsit"}),
   S("B2_suelo","core_suelo","elevacion_piernas_suelo",3,6,10,{rangos:{plancha_abdominal:[3,30,60]}})]},
 {id:"A3",patron:"Empuje",tipo:"Volumen",descanso:90,slots:[
   S("A3_pino","pino_equilibrio","pino_pared_caminando",4,15,30,{track:"pino",rangos:PINO}),
   S("A3_vert","empuje_vertical","flex_pica_pies_elevados",3,8,12),
   S("A3_hor","declinada_deficit","flex_deficit",3,8,12),
   S("A3_fondos","fondos","fondos",3,8,12),
   S("A3_pierna","pierna","p_bulgara",3,8,12,{lado:true})]},
 {id:"B3",patron:"Tirón",tipo:"Volumen",descanso:90,slots:[
   S("B3_dom","tiron_volumen","dominada",3,8,12),
   S("B3_remo","remo","remo_australiano_horizontal",3,8,12),
   S("B3_core","core_colgado","elevacion_piernas_colgado",3,8,12),
   S("B3_lsit","lsit","lsit_tuck",3,10,30,{track:"lsit"})]},
];
const SLOT={}, PL={};
PLANTILLAS.forEach(p=>{PL[p.id]=p; p.slots.forEach(s=>{
  s.plantilla=p.id; SLOT[s.id]=s;
  const r=()=>{const e=curEx(s.id); return (s.rangos&&e&&s.rangos[e.id])||s._r};
  Object.defineProperty(s,"series",{get:()=>r()[0]}); Object.defineProperty(s,"min",{get:()=>r()[1]}); Object.defineProperty(s,"max",{get:()=>r()[2]});
})});
const key=sid=>SLOT[sid].track||sid;

/* Preparación (Domein): se marca, no se registra */
const PREP=[
 "Movilidad articular suave, 2 min: hombros, codos, muñecas y columna",
 "Core: aguantes de hollow body y elevaciones de piernas",
 "Escápulas: retracciones colgado y protracciones en paralelas",
 "1–2 series de aproximación suaves del primer ejercicio fuerte",
];
const PREP_EXTRA={Empuje:"Días de pino: calienta bien las muñecas y la movilidad de hombro",Tirón:"Días de tirón: cuélgate unos segundos para calentar el agarre"};

/* ===== Estado =====
   El nivel de cada ejercicio NO se guarda directamente: se recalcula reproduciendo
   en orden los ajustes manuales y los entrenos. Así borrar un entreno deshace su efecto. */
const LS_STATE="barra_estado_v1", LS_SES="barra_sesiones_v1";
function baseSlots(){const o={};PLANTILLAS.forEach(p=>p.slots.forEach(s=>{const k=s.track||s.id; if(!o[k])o[k]={idx:Math.max(0,LADDERS[s.ladder].peldanos.indexOf(s.start)),kg:s.kg0||0,exito:0,fallo:0}}));return o}
const ST=sid=>D.slots[key(sid)];
function freshState(){return {v:3,actualizado:0,eventos:[],seqOv:null,borradas:[],ajustes:{inc:2.5,sonido:true},activa:null}}
function migrate(s){
  if(!s)return freshState();
  if(s.v===3){const f=freshState();return {...f,...s,ajustes:{...f.ajustes,...(s.ajustes||{})}}}
  if(s.v===2){const f=freshState();return {...f,...s,v:3,eventos:[],seqOv:null,ajustes:{...f.ajustes,...(s.ajustes||{})}}} // escaleras nuevas: niveles a sus valores iniciales
  const n=freshState(), t=s.actualizado||Date.now();
  n.seqOv={t,i:s.seq||0}; n.ajustes={...n.ajustes,...(s.ajustes||{})}; n.activa=s.activa||null; n.actualizado=t;
  if(n.activa)normReg(n.activa.registros);
  return n;
}
function normReg(regs){for(const k in regs){const r=regs[k];(r.sets||[]).forEach(x=>{if(x.ex==null)x.ex=r.ex;if(x.kg==null)x.kg=r.kg||0})}}
function lsGet(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
let state=migrate(lsGet(LS_STATE));
let sesiones=(lsGet(LS_SES)||[]); sesiones.forEach(s=>normReg(s.registros));
let D={slots:baseSlots(),seq:0,cambios:{}};

function replay(){
  const slots=baseSlots(), cambios={};
  const evs=[...state.eventos.map(e=>({t:e.t,m:e})),...sesiones.map(s=>({t:s.fin,s}))].sort((a,b)=>a.t-b.t);
  D.slots=slots;
  for(const ev of evs){
    if(ev.m){const e=ev.m; if(!SLOT[e.sid])continue; const st=slots[key(e.sid)]; if(e.idx!=null)st.idx=Math.min(Math.max(0,e.idx),lad(e.sid).length-1); if(e.kg!=null)st.kg=e.kg; st.exito=0; st.fallo=0}
    else{const p=PL[ev.s.plantilla]; if(!p)continue; cambios[ev.s.id]=p.slots.map(s=>evaluate(s.id,ev.s.registros[s.id]))}
  }
  D.cambios=cambios;
  const last=sesiones.length?sesiones.reduce((a,b)=>a.fin>b.fin?a:b):null;
  let seq=last&&PL[last.plantilla]?(PLANTILLAS.indexOf(PL[last.plantilla])+1)%PLANTILLAS.length:0;
  if(state.seqOv&&(!last||state.seqOv.t>last.fin))seq=state.seqOv.i;
  D.seq=seq;
}

const db=null; let syncMsg="Guardado en este móvil", syncTimer=null;
function save(){state.actualizado=Date.now(); lsSet(LS_STATE,state); lsSet(LS_SES,sesiones); replay(); if(db){clearTimeout(syncTimer); syncTimer=setTimeout(pushState,800)}}
async function pushState(){
  if(!db)return;
  try{await db.doc("tracker/estado").set(JSON.parse(JSON.stringify(state))); setSync("Sincronizado")}
  catch(e){ if(e&&e.code==="unavailable")setTimeout(pushState,1500+Math.random()*1000); setSync("Guardado en este móvil") }
}
async function pushSesion(s){if(db)try{await db.doc("sesiones/"+s.id).set(JSON.parse(JSON.stringify(s)))}catch(e){}}
async function dropSesion(id){if(db)try{await db.doc("sesiones/"+id).delete()}catch(e){}}
function setSync(m){syncMsg=m; const el=document.getElementById("sync"); if(el)el.textContent=m}


/* ===== Progresión (determinista) ===== */
const lad=sid=>LADDERS[SLOT[sid].ladder].peldanos;
const curEx=sid=>EX[lad(sid)[Math.min(ST(sid).idx,lad(sid).length-1)]];
const unit=sid=>curEx(sid).tipo==="segundos"?"s":"repes";
function evaluate(sid,reg){
  const s=SLOT[sid], st=ST(sid), L=lad(sid);
  const r={sid,antes:curEx(sid).nombre,cambio:null,texto:""};
  const sets=((reg&&reg.sets)||[]).filter(x=>x.ex===curEx(sid).id);
  if(!sets.length){r.texto=(reg&&reg.sets&&reg.sets.length)?"Hiciste otra variante: no cuenta":"Sin series: no cuenta";return r}
  const v=sets.map(x=>x.v);
  const hit=v.length>=s.series&&v.every(x=>x>=s.max);
  const miss=v.filter(x=>x<s.min).length>v.length/2;
  if(hit){st.exito++;st.fallo=0}else if(miss){st.fallo++;st.exito=0}else{st.exito=0;st.fallo=0}
  const kg0=st.kg;
  if(st.exito>=2){st.exito=0;
    if(s.lastre){st.kg=+(st.kg+state.ajustes.inc).toFixed(2);r.cambio="up";r.texto=`Sube el lastre: ${fmtKg(kg0)} → ${fmtKg(st.kg)}`}
    else if(st.idx<L.length-1){st.idx++;r.cambio="up";r.texto=`Siguiente variante: ${curEx(sid).nombre}. Vuelves a ${s.min} ${unit(sid)}.`}
    else r.texto="Tope de la escalera cumplido.";
  }else if(st.fallo>=2){st.fallo=0;
    if(s.lastre){if(st.kg>0){st.kg=Math.max(0,+(st.kg-state.ajustes.inc).toFixed(2));r.cambio="down";r.texto=`Baja el lastre: ${fmtKg(kg0)} → ${fmtKg(st.kg)}`}else r.texto="Dos sesiones por debajo del mínimo sin lastre."}
    else if(st.idx>0){st.idx--;r.cambio="down";r.texto=`Bajas un escalón: ${curEx(sid).nombre}`}
    else r.texto="Dos sesiones por debajo del mínimo en el primer escalón.";
  }else if(hit)r.texto="Tope del rango: 1 de 2 para subir";
  else if(miss)r.texto="Por debajo del mínimo: 1 de 2 para bajar";
  else r.texto="Dentro del rango: sigue igual";
  return r;
}
const fmtKg=k=>(k%1?k.toFixed(1).replace(".",","):k)+" kg";

/* Cambio manual de nivel (siempre deshacible) */
let lastUndo=null;
function setLevel(sid,{idx,kg},msg){
  const st=ST(sid), prev={idx:st.idx,kg:st.kg};
  const ev={t:Date.now(),sid,idx:idx??st.idx,kg:kg??st.kg};
  // varios toques seguidos sobre el mismo ejercicio = un solo ajuste
  const le=state.eventos[state.eventos.length-1];
  if(le&&le.sid===sid&&ev.t-le.t<60000&&!sesiones.some(s=>s.fin>le.t)){Object.assign(le,ev)}else state.eventos.push(ev);
  save(); render(); toast(msg||`Ahora: ${curEx(sid).nombre}`, ()=>{setLevelRaw(sid,prev)});
}
function setLevelRaw(sid,v){state.eventos.push({t:Date.now(),sid,idx:v.idx,kg:v.kg}); save(); render()}
function shift(sid,d){const i=ST(sid).idx+d; if(i<0||i>=lad(sid).length)return; setLevel(sid,{idx:i})}

/* ===== UI ===== */
let tab="hoy", openSlot=null, pending={}, editing=null; // editing={sid,i}
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const nextPl=()=>PLANTILLAS[D.seq%PLANTILLAS.length];
const setsCur=(sid)=>((state.activa&&state.activa.registros[sid]?.sets)||[]).filter(x=>x.ex===curEx(sid).id);

function lastValues(sid){
  const id=curEx(sid).id;
  for(let i=sesiones.length-1;i>=0;i--){const r=sesiones[i].registros[sid]; const v=r&&r.sets.filter(x=>x.ex===id).map(x=>x.v); if(v&&v.length)return v}
  return null;
}
function defaultValue(sid){
  const cur=setsCur(sid); if(cur.length)return cur[cur.length-1].v;
  const lv=lastValues(sid); if(lv)return lv[Math.min(cur.length,lv.length-1)];
  return SLOT[sid].max;
}
function streakDots(sid){const st=ST(sid);return `<span class="streak" aria-label="racha">${[0,1].map(i=>`<i class="${i<st.exito?"up":i<st.fallo?"dn":""}"></i>`).join("")}</span>`}
function targetText(sid){const s=SLOT[sid];return `${s.series} × ${s.min}–${s.max} ${unit(sid)}${s.lado?" por lado":""}`}
function rungText(sid){return `${ST(sid).idx+1}/${lad(sid).length}`}
function levelText(sid){return SLOT[sid].lastre?fmtKg(ST(sid).kg):`escalón ${rungText(sid)}`}
function shiftRow(sid){
  const i=ST(sid).idx, L=lad(sid), s=SLOT[sid];
  if(s.lastre)return `<div class="kg">Lastre <button data-kg="${sid}|-1" aria-label="Menos lastre">−</button><b>${fmtKg(ST(sid).kg)}</b><button data-kg="${sid}|1" aria-label="Más lastre">+</button></div>`;
  return `<div class="shift"><button data-shift="${sid}|-1" ${i===0?"disabled":""}>◀ Más fácil</button><button data-shift="${sid}|1" ${i===L.length-1?"disabled":""}>Más difícil ▶</button></div>`;
}
function hint(sid){
  const s=SLOT[sid], v=setsCur(sid).map(x=>x.v); if(!v.length)return "";
  const i=ST(sid).idx, L=lad(sid), extra=unit(sid)==="s"?10:3, last=v[v.length-1];
  if(v[0]<s.min&&(i>0||s.lastre))return `<div class="hint dn">Te has quedado por debajo de ${s.min}. Si no es un mal día, baja ya: <button data-shift="${sid}|-1">${s.lastre?"Quitar lastre":"Bajar un escalón"}</button></div>`;
  if(last>=s.max+extra&&(i<L.length-1||s.lastre))return `<div class="hint up">Te sobra margen para este rango. <button data-shift="${sid}|1">${s.lastre?"Añadir lastre":"Probar el siguiente"}</button></div>`;
  return "";
}
function srcLink(tag){
  const [src,t]=tag.split("@"); const so=SOURCES[src]; if(!so)return "";
  let href=so.url; if(t){const p=t.split(":").map(Number); const secs=p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]; href+=(href.includes("?")?"&":"?")+"t="+secs+"s"}
  return `<a href="${href}" target="_blank" rel="noopener">${esc(so.autor)}${t?" "+t:""}</a>`;
}
function techHTML(e){
  if(e.provisional)return `<details class="tech"><summary>Técnica</summary><p class="small muted">Sin fuente todavía. Se sustituirá cuando ingiera un clipping de pierna.</p></details>`;
  return `<details class="tech"><summary>Técnica</summary><ul>
   ${(e.cues||[]).map(c=>`<li class="ok">${esc(c)}</li>`).join("")}
   ${(e.errores||[]).map(c=>`<li class="ko">${esc(c)}</li>`).join("")}
   ${(e.criterios||[]).map(c=>`<li class="cr">${esc(c)}</li>`).join("")}
   ${e.notas?`<li class="nt">${esc(e.notas)}</li>`:""}</ul>
   ${(e.fuentes||[]).length?`<p class="small">Ver en vídeo: ${e.fuentes.map(srcLink).join(" · ")}</p>`:""}</details>`;
}
const provTag=e=>e.provisional?'<span class="tag prov">sin fuente</span>':"";

function renderHoy(){
  const p=state.activa?PL[state.activa.plantilla]:nextPl(), pos=PLANTILLAS.indexOf(p);
  let h=`<section class="next${state.activa?" live":""}"><div class="sub">${state.activa?"Entreno en curso":"Siguiente entreno"} · sesión ${sesiones.length+1}</div>
    <div class="kind">${p.patron} · ${p.tipo}</div>
    <div class="sub">Descanso ${p.descanso/60} min entre series</div>
    <div class="seq" aria-label="Posición en la semana">${PLANTILLAS.map((x,i)=>`<span class="${i===pos?"on":i<pos?"done":""}" title="${x.patron} ${x.tipo}"></span>`).join("")}</div></section>`;
  if(!state.activa){
    if(sesiones.length>=3&&Date.now()-(state.ultimaCopia||0)>14*864e5)h+=`<p class="small hint up" style="margin-top:0">Tus datos solo están en este móvil. Descarga una copia de seguridad desde Ajustes.</p>`;
    if(sesiones.length<6)h+=`<p class="small muted">Primeros entrenos: si no sabes en qué variante estás, ajústala aquí o en mitad del entreno. Los cambios manuales reinician la racha de ese ejercicio.</p>`;
    p.slots.forEach((s,i)=>{const e=curEx(s.id);
      h+=`<div class="card"><div class="card-h"><div class="pos"><b>${i+1}</b></div><div style="flex:1"><div class="name">${esc(e.nombre)}${provTag(e)}</div>
      <div class="meta">${targetText(s.id)} · ${levelText(s.id)}${streakDots(s.id)}</div></div></div><div class="body tight">${shiftRow(s.id)}</div></div>`});
    h+=`<button class="primary" id="start">Empezar entreno</button><button class="ghost" id="other">Hacer otro entreno</button>`;
    return h;
  }
  const a=state.activa;
  h+=`<details class="card prep" ${a.prepOk?"":"open"}><summary class="card-h"><div style="flex:1"><div class="name">Preparación</div><div class="meta">Antes del primer ejercicio · Domein</div></div></summary><div class="body">${[...PREP,PREP_EXTRA[p.patron]].map((x,i)=>`<label class="chk"><input type="checkbox" data-prep="${i}" ${(a.prep||[])[i]?"checked":""}> ${esc(x)}</label>`).join("")}</div></details>`;
  if(!openSlot||!p.slots.find(s=>s.id===openSlot))openSlot=(p.slots.find(s=>setsCur(s.id).length<s.series)||p.slots[0]).id;
  p.slots.forEach((s,i)=>{
    const e=curEx(s.id), all=(a.registros[s.id]?.sets)||[], cur=setsCur(s.id), done=cur.length>=s.series, open=openSlot===s.id;
    h+=`<div class="card ${done&&!open?"done":""}"><button class="card-h" data-open="${s.id}" aria-expanded="${open}"><div class="pos"><b>${i+1}</b></div><div style="flex:1"><div class="name">${esc(e.nombre)}${provTag(e)}</div>
      <div class="meta">${targetText(s.id)} · ${levelText(s.id)}${streakDots(s.id)}</div></div>
      <div class="pos"><b>${cur.length}</b><small>de ${s.series}</small></div></button>`;
    if(open){
      const ed=editing&&editing.sid===s.id?editing.i:null;
      if(pending[s.id]==null)pending[s.id]=defaultValue(s.id);
      const lv=lastValues(s.id), other=all.filter(x=>x.ex!==e.id);
      h+=`<div class="body">${shiftRow(s.id)}
        ${other.length?`<p class="small muted">Antes, con otra variante: ${other.map(x=>`${esc(exName(x.ex))} ${x.v}`).join(" · ")}</p>`:""}
        <div class="sets">${all.map((x,j)=>x.ex!==e.id?"":`<button class="chip ${x.v>=s.max?"hit":x.v<s.min?"miss":""} ${ed===j?"sel":""}" data-chip="${s.id}|${j}" aria-label="Editar serie">${x.v}</button>`).join("")}${Array.from({length:Math.max(0,s.series-cur.length)}).map(()=>`<span class="chip empty">·</span>`).join("")}</div>
        <div class="stepper"><button class="adj" data-step="-1" aria-label="Restar">−</button>
          <div class="big"><output id="val">${pending[s.id]}</output><small>${unit(s.id)}${s.lado?" por lado":""}${lv&&ed==null?` · última vez ${lv.join("·")}`:""}</small></div>
          <button class="adj" data-step="1" aria-label="Sumar">+</button></div>
        ${ed!=null?`<button class="log" data-save="${s.id}">Guardar cambio</button><div class="row"><button class="link" data-delset="${s.id}">Borrar esta serie</button><button class="link" data-canceled="1">Cancelar</button></div>`
          :`<button class="log" data-log="${s.id}">Apuntar serie</button><div class="row"><span class="small muted">${cur.length?"Toca una serie para corregirla":""}</span><button class="link" data-next="${s.id}">Siguiente ejercicio</button></div>`}
        ${hint(s.id)}${techHTML(e)}</div>`;
    }
    h+=`</div>`;
  });
  h+=`<label class="f" for="nota">Nota del entreno</label><textarea id="nota" placeholder="Qué falló, qué salió bien…">${esc(a.nota||"")}</textarea><button class="primary" id="finish">Terminar entreno</button><button class="ghost" id="cancel">Descartar entreno</button>`;
  return h;
}

function renderEsc(){
  let h=`<p class="muted small">Toca un escalón para ponerte ahí. Sube tras 2 sesiones seguidas en el tope del rango en todas las series; baja tras 2 sesiones con la mayoría de series por debajo del mínimo. Cada cambio manual reinicia la racha y se puede deshacer.</p>`;
  const seen=new Set();
  PLANTILLAS.forEach(p=>{
    h+=`<h2>${p.patron} · ${p.tipo}</h2>`;
    p.slots.forEach(s=>{if(seen.has(key(s.id))){h+=`<p class="small muted">${esc(LADDERS[s.ladder].nombre)}: mismo nivel que arriba.</p>`;return} seen.add(key(s.id)); const st=ST(s.id), L=LADDERS[s.ladder];
      h+=`<div class="card"><div class="card-h"><div style="flex:1"><div class="name">${esc(L.nombre)}</div><div class="meta">${targetText(s.id)}${streakDots(s.id)}</div></div></div>
      ${s.lastre?`<div class="body tight">${shiftRow(s.id)}</div>`:""}
      <ul class="ladder">${L.peldanos.map((id,i)=>`<li class="${i===st.idx?"cur":i<st.idx?"past":""}"><button data-set="${s.id}|${i}">${esc(EX[id].nombre)}${provTag(EX[id])}</button></li>`).join("")}</ul></div>`});
  });
  return h;
}

function renderHist(){
  if(!sesiones.length)return `<p class="empty">Aún no hay entrenos. Cuando termines el primero aparecerá aquí con las series y los cambios de nivel.</p>`;
  return `<p class="small muted">Borrar un entreno deshace también las subidas o bajadas que provocó.</p>`+sesiones.slice().reverse().map(se=>{const p=PL[se.plantilla];
    const d=new Date(se.fin).toLocaleDateString("es-ES",{weekday:"short",day:"numeric",month:"short"});
    const rows=[];
    for(const [sid,r] of Object.entries(se.registros)){const g={}; r.sets.forEach(x=>{const k=x.ex+"|"+(x.kg||0);(g[k]=g[k]||[]).push(x.v)}); for(const [k,v] of Object.entries(g)){const [ex,kg]=k.split("|"); rows.push(`<tr><td>${esc(exName(ex))}${+kg?` +${fmtKg(+kg)}`:""}</td><td>${v.join("·")}</td></tr>`)}}
    return `<div class="hist"><div class="hh"><h3>${p?p.patron+" · "+p.tipo:se.plantilla} <span class="muted small">${d}</span></h3><button class="link" data-del="${se.id}">Borrar</button></div><table>${rows.join("")||'<tr><td class="muted">Sin series</td><td></td></tr>'}</table>${se.nota?`<p class="small muted">${esc(se.nota)}</p>`:""}
      ${(D.cambios[se.id]||[]).filter(c=>c.cambio).map(c=>`<div class="chg"><span class="${c.cambio==="up"?"u":"d"}">${c.cambio==="up"?"Sube":"Baja"}</span> ${esc(c.texto)}</div>`).join("")}</div>`}).join("");
}

function renderAjustes(){
  return `<h2>Lastre</h2><label class="f" for="inc">Cuánto sube o baja el lastre cada vez</label>
  <select id="inc">${[0.5,1,1.5,2,2.5,5].map(v=>`<option value="${v}" ${state.ajustes.inc==v?"selected":""}>${fmtKg(v)}</option>`).join("")}</select>
  <h2>Descanso</h2><label class="f"><input type="checkbox" id="snd" ${state.ajustes.sonido?"checked":""}> Pitido y vibración al terminar</label>
  <h2>Copia de seguridad</h2><p class="small muted">Copia este texto y guárdalo, o pégalo aquí para restaurar.</p>
  <button class="ghost" id="bkFile">Descargar copia de seguridad</button><button class="ghost" id="bkOpen">Restaurar desde un archivo</button><input type="file" id="bkInput" accept="application/json,.json" hidden><p class="small muted">Para revisar tu progreso con Claude, copia el texto y pégaselo en el chat.</p><textarea id="bk"></textarea><button class="ghost" id="bkCopy">Copiar como texto</button><button class="ghost" id="bkLoad">Restaurar desde el texto</button>
  <h2>App</h2><p class="small muted">Versión ${APP_VERSION} · datos guardados solo en este dispositivo.</p>
  <h2>Método</h2><details class="tech"><summary>Principios de las fuentes (${CATALOGO.principios.length})</summary><ul>${CATALOGO.principios.map(p=>`<li class="nt"><b>${esc(p.tema)}.</b> ${esc(p.texto)} ${srcLink(p.fuente)}</li>`).join("")}</ul></details>
  <details class="tech"><summary>Conflictos entre fuentes (${CATALOGO.conflictos.length})</summary><ul>${CATALOGO.conflictos.map(c=>`<li class="nt"><b>${esc(c.tema)}.</b> ${esc(c.a)}. ${esc(c.b)}. Tracker: ${esc(c.decision_tracker)}.</li>`).join("")}</ul></details>
  <h2>Catálogo</h2><p class="small muted">${CATALOGO.ejercicios.length} ejercicios de ${CATALOGO.fuentes.length} fuentes.</p>
  <ul class="small muted" style="padding-left:18px">${CATALOGO.fuentes.filter(f=>f.tipo!=="fuera_de_alcance").map(f=>`<li>${esc(f.autor)} — ${esc(f.titulo)}</li>`).join("")}</ul>
  <button class="ghost" id="clearHist" style="color:var(--down)">Borrar todo el historial</button><button class="ghost" id="reset" style="color:var(--down)">Borrar todo y empezar de cero</button>`;
}

function render(){
  document.querySelectorAll("#tabs button").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false"));
  const body={hoy:renderHoy,esc:renderEsc,hist:renderHist,ajustes:renderAjustes}[tab]();
  $("#app").innerHTML=`<header class="top"><h1>Barra</h1><span class="sync" id="sync">${syncMsg}</span></header>${body}`;
  if(tab==="ajustes")$("#bk").value=JSON.stringify({state,sesiones});
}

/* ===== Aviso con deshacer ===== */
let toastT=null;
function toast(msg,undo){
  const t=$("#toast"); t.innerHTML=`<span>${esc(msg)}</span>${undo?'<button id="undo">Deshacer</button>':""}`; t.classList.add("on");
  if(undo)$("#undo").onclick=()=>{t.classList.remove("on");undo()};
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("on"),5000);
}

/* ===== Descanso ===== */
let restEnd=0, restTick=null, restDone=false, actx=null;
function startRest(sec){restEnd=Date.now()+sec*1000; restDone=false; $("#rest").classList.add("on"); $("#rest").classList.remove("end"); tickRest(); clearInterval(restTick); restTick=setInterval(tickRest,250)}
function tickRest(){
  const left=Math.max(0,Math.round((restEnd-Date.now())/1000));
  $("#restT").textContent=Math.floor(left/60)+":"+String(left%60).padStart(2,"0");
  if(left===0&&!restDone){restDone=true; $("#rest").classList.add("end"); $("#restL").textContent="A por la siguiente serie"; alertEnd()}
  else if(left>0)$("#restL").textContent="Descanso";
}
function stopRest(){clearInterval(restTick); $("#rest").classList.remove("on","end")}
function alertEnd(){
  if(!state.ajustes.sonido)return;
  try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)(); [0,0.25].forEach(t=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;g.gain.value=.25;o.connect(g);g.connect(actx.destination);o.start(actx.currentTime+t);o.stop(actx.currentTime+t+.15)})}catch(e){}
}
$("#restPlus").onclick=()=>{restEnd=Math.max(restEnd,Date.now())+30000; restDone=false; $("#rest").classList.remove("end"); clearInterval(restTick); restTick=setInterval(tickRest,250); tickRest()};
$("#restSkip").onclick=stopRest;

/* Confirmaciones propias: el visor de artefactos bloquea await ask() y toast() */
function ask(msg,ok="Confirmar",danger=true){return new Promise(res=>{
  const dl=$("#dlg"); $("#dlgBody").onclick=null;
  $("#dlgBody").innerHTML=`<p style="font-size:17px;margin:0 0 6px">${esc(msg)}</p><button class="primary" id="askOk" style="${danger?"background:var(--down);color:#fff":""}">${esc(ok)}</button><button class="ghost" id="askNo">Cancelar</button>`;
  dl.showModal(); $("#askOk").onclick=()=>{dl.close();res(true)}; $("#askNo").onclick=()=>{dl.close();res(false)};
})}
/* ===== Eventos ===== */
$("#tabs").onclick=e=>{const b=e.target.closest("button");if(!b)return;tab=b.dataset.tab;editing=null;render();window.scrollTo(0,0)};
$("#app").addEventListener("click",async e=>{
  const t=e.target.closest("button"); if(!t||t.disabled)return; const d=t.dataset;
  if(t.id==="start"){const p=nextPl(); state.activa={plantilla:p.id,inicio:Date.now(),registros:{}}; openSlot=p.slots[0].id; pending={}; editing=null; try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(_){ } save(); render(); return}
  if(t.id==="other"){openPicker(); return}
  if(d.open){openSlot=openSlot===d.open?null:d.open; editing=null; render(); return}
  if(d.step){const sid=openSlot; pending[sid]=Math.max(0,(pending[sid]||0)+(+d.step)*(unit(sid)==="s"?5:1)); $("#val").textContent=pending[sid]; return}
  if(d.kg){const [sid,dir]=d.kg.split("|"); const st=ST(sid); setLevel(sid,{kg:Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2))},`Lastre: ${fmtKg(Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2)))}`); return}
  if(d.shift){const [sid,dir]=d.shift.split("|"); if(SLOT[sid].lastre){const st=ST(sid); setLevel(sid,{kg:Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2))})} else {pending[sid]=null; shift(sid,+dir)} return}
  if(d.log){const sid=d.log, s=SLOT[sid], a=state.activa;
    a.registros[sid]=a.registros[sid]||{sets:[]};
    a.registros[sid].sets.push({v:pending[sid],ex:curEx(sid).id,kg:s.lastre?ST(sid).kg:0});
    save();
    const p=PL[a.plantilla], allDone=p.slots.every(x=>setsCur(x.id).length>=x.series);
    if(setsCur(sid).length>=s.series&&!hint(sid)){const nx=p.slots.find(x=>setsCur(x.id).length<x.series); if(nx)openSlot=nx.id}
    if(!allDone)startRest(p.descanso); else stopRest();
    render(); return}
  if(d.chip){const [sid,j]=d.chip.split("|"); editing={sid,i:+j}; pending[sid]=state.activa.registros[sid].sets[+j].v; render(); return}
  if(d.save){state.activa.registros[d.save].sets[editing.i].v=pending[d.save]; editing=null; pending[d.save]=null; save(); render(); return}
  if(d.delset){state.activa.registros[d.delset].sets.splice(editing.i,1); editing=null; pending[d.delset]=null; save(); render(); return}
  if(d.canceled){pending[editing.sid]=null; editing=null; render(); return}
  if(d.next){const p=PL[state.activa.plantilla]; const i=p.slots.findIndex(x=>x.id===d.next); openSlot=p.slots[(i+1)%p.slots.length].id; editing=null; render(); window.scrollTo({top:0}); return}
  if(t.id==="finish"){finish(); return}
  if(t.id==="cancel"){if(await ask("¿Descartar este entreno? No se guardará ni contará para la progresión.")){state.activa=null; stopRest(); save(); render()} return}
  if(d.set){const [sid,i]=d.set.split("|"); if(+i!==ST(sid).idx)setLevel(sid,{idx:+i}); return}
  if(d.del){const se=sesiones.find(s=>s.id===d.del); if(!se)return; if(!await ask("¿Borrar este entreno? Se deshará cualquier subida o bajada que provocó."))return;
    sesiones=sesiones.filter(s=>s.id!==d.del); state.borradas.push(d.del); dropSesion(d.del); save(); render();
    toast("Entreno borrado",()=>{sesiones.push(se); sesiones.sort((a,b)=>a.fin-b.fin); state.borradas=state.borradas.filter(x=>x!==se.id); pushSesion(se); save(); render()}); return}
  if(t.id==="bkFile"){const blob=new Blob([JSON.stringify({app:"barra",exportado:new Date().toISOString(),state,sesiones},null,1)],{type:"application/json"}); const u=URL.createObjectURL(blob); const l=document.createElement("a"); l.href=u; l.download=`barra-copia-${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(u),2000); state.ultimaCopia=Date.now(); lsSet(LS_STATE,state); toast("Copia descargada"); return}
  if(t.id==="bkOpen"){$("#bkInput").click(); return}
  if(t.id==="bkCopy"){state.ultimaCopia=Date.now(); lsSet(LS_STATE,state);const ta=$("#bk"); ta.select(); try{navigator.clipboard.writeText(ta.value).then(()=>t.textContent="Copiada",()=>{document.execCommand("copy");t.textContent="Copiada"})}catch(_){document.execCommand("copy");t.textContent="Copiada"} return}
  if(t.id==="bkLoad"){try{const o=JSON.parse($("#bk").value); if(!o.state||!o.sesiones)throw 0; if(await ask("¿Sustituir todos los datos por los del texto?")){state=migrate(o.state); sesiones=o.sesiones; sesiones.forEach(s=>normReg(s.registros)); save(); sesiones.forEach(pushSesion); render()}}catch(_){toast("El texto no es una copia de seguridad válida de este tracker.")} return}
  if(t.id==="clearHist"){if(!sesiones.length){toast("No hay entrenos en el historial");return} if(await ask(`Se borrarán los ${sesiones.length} entrenos del historial y lo que subieron o bajaron. Los ajustes manuales de nivel se mantienen.`,"Borrar historial")){state.borradas=[...state.borradas,...sesiones.map(s=>s.id)]; sesiones.forEach(s=>dropSesion(s.id)); sesiones=[]; save(); render(); toast("Historial borrado")} return}
  if(t.id==="reset"){if(await ask("Se borrarán el historial y los niveles. ¿Seguro?")){state.borradas=[...state.borradas,...sesiones.map(s=>s.id)]; sesiones.forEach(s=>dropSesion(s.id)); const b=state.borradas; state=freshState(); state.borradas=b; sesiones=[]; save(); render()} return}
});
$("#app").addEventListener("change",async e=>{
  if(e.target.id!=="bkInput"||!e.target.files[0])return;
  try{const o=JSON.parse(await e.target.files[0].text()); if(!o.state||!o.sesiones)throw 0;
    if(await ask("¿Sustituir todos los datos por los de la copia?","Sustituir")){state=migrate(o.state); sesiones=o.sesiones; sesiones.forEach(s=>normReg(s.registros)); save(); render(); toast("Copia restaurada")}}
  catch(_){toast("Ese archivo no es una copia de seguridad de Barra")} e.target.value="";
});
$("#app").addEventListener("input",e=>{if(e.target.id==="nota"&&state.activa){state.activa.nota=e.target.value; lsSet(LS_STATE,state); clearTimeout(syncTimer); if(db)syncTimer=setTimeout(pushState,1500)}});
$("#app").addEventListener("change",e=>{
  if(e.target.dataset.prep!=null&&state.activa){const a=state.activa; a.prep=a.prep||[]; a.prep[+e.target.dataset.prep]=e.target.checked; a.prepOk=a.prep.filter(Boolean).length>=PREP.length; save(); return}
  if(e.target.id==="inc"){state.ajustes.inc=+e.target.value; save()}
  if(e.target.id==="snd"){state.ajustes.sonido=e.target.checked; save()}
});

function openPicker(){
  $("#dlgBody").innerHTML=`<h2>¿Qué entreno haces?</h2><p class="small muted">La secuencia seguirá desde el que elijas.</p>${PLANTILLAS.map((p,i)=>`<button class="ghost" data-pick="${i}">${p.patron} · ${p.tipo}${i===D.seq?" (el que tocaba)":""}</button>`).join("")}<button class="link" id="dlgX">Cancelar</button>`;
  const dl=$("#dlg"); dl.showModal();
  $("#dlgBody").onclick=e=>{const b=e.target.closest("button"); if(!b)return; if(b.dataset.pick!=null){state.seqOv={t:Date.now(),i:+b.dataset.pick}; save(); render()} dl.close()};
}

async function finish(){
  const a=state.activa, p=PL[a.plantilla];
  if(p.slots.every(s=>!(a.registros[s.id]?.sets.length))&&!await ask("No has apuntado ninguna serie. ¿Terminar igualmente? No contará para la progresión."))return;
  const ses={id:"s"+a.inicio,plantilla:a.plantilla,inicio:a.inicio,fin:Date.now(),registros:a.registros,nota:a.nota||""};
  sesiones.push(ses); pushSesion(ses);
  state.activa=null; pending={}; openSlot=null; editing=null; stopRest(); save();
  const cambios=D.cambios[ses.id]||[];
  $("#dlgBody").onclick=null;
  $("#dlgBody").innerHTML=`<h2>${p.patron} · ${p.tipo} hecho</h2><ul class="res">${cambios.map(c=>`<li><b>${esc(c.antes)}</b><span class="${c.cambio==="up"?"u":c.cambio==="down"?"d":"muted"}">${esc(c.texto)}</span></li>`).join("")}</ul>
    <p class="small muted">Siguiente: ${nextPl().patron} · ${nextPl().tipo}</p><button class="primary" id="dlgOk">Cerrar</button>`;
  const dl=$("#dlg"); dl.showModal(); $("#dlgOk").onclick=()=>dl.close(); render();
}

replay(); render();

document.addEventListener("barra-update",()=>{const t=$("#toast"); t.innerHTML='<span>Hay una versión nueva</span><button id="upd">Actualizar</button>'; t.classList.add("on"); clearTimeout(toastT); $("#upd").onclick=()=>{t.classList.remove("on"); window.__barraUpdate&&window.__barraUpdate()}});
if(window.__barraUpdate)document.dispatchEvent(new Event("barra-update"));
}
