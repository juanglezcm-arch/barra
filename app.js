"use strict";
const APP_VERSION="1.5.0";
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

function P(id,nombre,tipo="repes"){EX[id]={id,nombre,tipo,provisional:true,cues:[],errores:[],criterios:[],notas:null,fuentes:[]}}
// Nombres de versiones anteriores (para el historial)
const LEGACY={p_bulgara:"Sentadilla búlgara",p_shrimp_asistida:"Shrimp squat asistida",p_pistol_caja:"Pistol a caja",p_pistol:"Pistol squat",p_pistol_lastrado:"Pistol squat lastrado",p_fondos_lastrados:"Fondos lastrados",p_dominada_lastrada:"Dominada lastrada",p_remo_arquero:"Remo arquero",p_df_tuck:"Dragon flag tuck",p_toes_to_bar:"Toes to bar",p_dominada_arquera:"Dominada arquera",p_lsit_tuck:"Tuck L-sit",p_remo_australiano_elevado:"Remo australiano pies elevados",p_elev_piernas:"Elevación de piernas colgado",p_dominada_pecho:"Dominada pecho a la barra"};
const exName=id=>(EX[id]&&EX[id].nombre)||LEGACY[id]||id;

/* Plantillas. Primer ejercicio = lo que más cuesta. Secuencia A/B sin fechas.
   track: varios huecos comparten nivel (el pino se practica los tres días de empuje).
   rangos: series y rango propios de un peldaño concreto. */
const S=(id,ladder,start,series,min,max,o={})=>({id,ladder,start,_r:[series,min,max],...o});
const PINO={pino_paralelas_hombros:[6,20,40],pino_pared_caminando:[6,20,40],pino_pared_espaldas:[6,25,50],pino_libre:[6,10,25],pino_una_mano:[6,3,8]};
const PINO_F={rana:[5,10,20],enanito:[5,5,15],press_negativa:[5,3,5],press_enanito:[5,1,4],pino_fuerza:[5,1,5],press_pica_elevada:[5,2,5],press_straddle:[5,1,4]};

/* Los tres bloques de cada sesión, en este orden:
   técnica (fresco, sin fallo) → fuerza (carga alta, poca técnica) → volumen (acumular). */
const BLOQUES={
  tecnica:{n:"Bloque 1 · Técnica", d:"Lo más complejo, con el cuerpo fresco. Series cortas, sin llegar al fallo."},
  fuerza: {n:"Bloque 2 · Fuerza",  d:"Mucha carga, poca técnica. Pocas repeticiones y descansos largos."},
  volumen:{n:"Bloque 3 · Volumen", d:"Variantes más fáciles para acumular trabajo. Las superseries van seguidas, sin descanso entre ellas."},
  core:   {n:"Bloque 4 · Core",    d:"Todos los días. Suave en los de empuje, a tope en los de tirón."},
};
const PLANTILLAS=[
 {id:"A",patron:"Empuje",tipo:"Pino · tríceps · pecho · core suave",min:120,slots:[
   S("A_pino","pino_equilibrio","pino_pared_caminando",6,20,40,{track:"pino",rangos:PINO,bloque:"tecnica",descanso:60,t:14}),
   S("A_pinopar","pino_paralelas","pino_paralelas_aguante",5,15,30,{rangos:{pino_paralelas_aguante:[5,15,30],hspu_paralelas_parcial:[4,3,6],hspu_paralelas:[4,3,6],pino_una_mano:[6,3,8]},bloque:"tecnica",descanso:90,t:12}),
   S("A_press","pino_fuerza","enanito",5,5,15,{rangos:PINO_F,bloque:"tecnica",descanso:90,t:14}),
   S("A_vert","empuje_vertical","hspu_pared_parcial",5,3,6,{bloque:"fuerza",descanso:180,t:22}),
   S("A_plancha","plancha_flexiones","flex_lean_planche",4,4,8,{bloque:"fuerza",descanso:150,t:16}),
   S("A_dips","fondos_fuerza","fondos",4,8,12,{bloque:"volumen",descanso:90,sup:"Superserie: fondos + flexiones",t:14}),
   S("A_flex","declinada_deficit","flex_declinada",4,8,12,{bloque:"volumen",descanso:90,sup:"Superserie: fondos + flexiones",t:14}),
   S("A_core","core_suave","core_circuito",1,10,15,{bloque:"core",descanso:30,t:14})]},
 {id:"B",patron:"Tirón",tipo:"Front lever · dominadas · core a tope",min:124,slots:[
   S("B_fl","front_lever","fl_adv_tuck",6,5,15,{bloque:"tecnica",descanso:90,t:12}),
   S("B_mu","muscleup","muscle_up_balanceo",5,1,3,{bloque:"tecnica",descanso:120,t:12}),
   S("B_vsit","vsit","compresion_pike",4,10,25,{bloque:"tecnica",descanso:60,t:8}),
   S("B_flf","fl_fuerza","fl_neg_adv_tuck",5,3,6,{bloque:"fuerza",descanso:150,t:16}),
   S("B_una","tiron_una_mano","dominada_arquera",4,3,6,{lado:true,bloque:"fuerza",descanso:180,t:18}),
   S("B_remo","remo_fl","remo_fl_goma",4,5,8,{bloque:"fuerza",descanso:150,t:14}),
   S("B_dom","tiron_volumen","dominada",4,8,12,{bloque:"volumen",descanso:90,sup:"Superserie: dominadas + remo",t:12}),
   S("B_remoa","remo","remo_australiano_horizontal",4,8,12,{bloque:"volumen",descanso:90,sup:"Superserie: dominadas + remo",t:12}),
   S("B_core","core_duro","core_badin",1,18,22,{bloque:"core",descanso:30,t:20})]},
];
const SLOT={}, PL={};
PLANTILLAS.forEach(p=>{PL[p.id]=p; p.slots.forEach(s=>{
  s.plantilla=p.id; SLOT[s.id]=s;
  const r=()=>{const e=curEx(s.id); return (s.rangos&&e&&s.rangos[e.id])||s._r};
  Object.defineProperty(s,"series",{get:()=>r()[0]}); Object.defineProperty(s,"min",{get:()=>r()[1]}); Object.defineProperty(s,"max",{get:()=>r()[2]});
})});
const key=sid=>SLOT[sid].track||sid;
const restOf=sid=>SLOT[sid].descanso||90;
const minsBloque=(p,bl)=>p.slots.filter(s=>s.bloque===bl).reduce((a,s)=>a+(s.t||0),0);
const fmtMin=sec=>sec>=60?(sec%60?Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0"):(sec/60)+" min"):sec+" s";

/* Preparación (Domein): se marca, no se registra */
const PREP=[
 "Muñecas: círculos, apoyo con dedos adelante y atrás, 1–2 min (antes del pino y de la plancha)",
 "Hombro y escápulas: retracciones colgado, protracciones en paralelas, círculos con los brazos",
 "Core: un aguante de hollow body y elevaciones de piernas",
 "1–2 series de aproximación suaves del primer ejercicio del bloque de fuerza",
];
const PREP_EXTRA={Empuje:"La movilidad de hombro y muñeca va aquí, antes de empezar; los estiramientos largos, al terminar",Tirón:"Cuélgate 20–30 s para calentar el agarre antes del front lever"};

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
const unit=sid=>{const t=curEx(sid).tipo; return t==="segundos"?"s":t==="minutos"?"min":"repes"};
const paso=sid=>unit(sid)==="s"?5:1;
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
  if(!so.url)return `<span class="muted">${esc(so.autor)}</span>`;
  let href=so.url; if(/^\d+(:\d+)+$/.test(t||"")){const p=t.split(":").map(Number); const secs=p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1]; href+=(href.includes("?")?"&":"?")+"t="+secs+"s"}
  return `<a href="${href}" target="_blank" rel="noopener">${esc(so.autor)}${t?" "+esc(t):""}</a>`;
}
function techBody(e){
  if(e.provisional)return `<p class="small muted">Sin fuente todavía. Se sustituirá cuando ingiera un clipping de este patrón.</p>`;
  return `<ul>
   ${(e.cues||[]).map(c=>`<li class="ok">${esc(c)}</li>`).join("")}
   ${(e.errores||[]).map(c=>`<li class="ko">${esc(c)}</li>`).join("")}
   ${(e.criterios||[]).map(c=>`<li class="cr">${esc(c)}</li>`).join("")}
   ${e.notas?`<li class="nt">${esc(e.notas)}</li>`:""}</ul>
   ${(e.fuentes||[]).length?`<p class="small">Ver la fuente: ${e.fuentes.map(srcLink).join(" · ")}</p>`:""}`;
}
function techHTML(e){return `<details class="tech"><summary>Técnica</summary>${techBody(e)}</details>`}
const provTag=e=>e.provisional?' <span class="tag prov">sin fuente</span>':(e.propio?' <span class="tag prov">sin vídeo</span>':"");

function initPending(sid){
  const s=SLOT[sid], cur=setsCur(sid), lv=lastValues(sid);
  const base=cur.length?cur.map(x=>x.v):(lv&&lv.length?lv.slice(0,s.series):[]);
  while(base.length<s.series)base.push(base.length?base[base.length-1]:s.min);
  tocado[sid]=base.map(()=>cur.length>0);
  return base;
}
const tocado={};
function slotCard(s,i,p){
  const a=state.activa, e=curEx(s.id), all=(a&&a.registros[s.id]?.sets)||[], cur=a?setsCur(s.id):[];
  const hechas=cur.length, open=openSlot===s.id;
  let h=`<div class="card ${hechas&&!open?"done":""}">`;
  h+=`<button class="card-h" data-open="${s.id}" aria-expanded="${open}"><div class="pos"><b>${i}</b></div><div style="flex:1"><div class="name">${esc(e.nombre)}${provTag(e)}</div>
    <div class="meta">${targetText(s.id)} · ${levelText(s.id)}${streakDots(s.id)}</div></div>
    <div class="pos">${hechas?`<b>${cur.map(x=>x.v).join("·")}</b><small>hecho</small>`:`<b>·</b><small>sin apuntar</small>`}</div></button>`;
  if(open){
    if(!pending[s.id])pending[s.id]=initPending(s.id);
    const arr=pending[s.id], lv=lastValues(s.id), other=all.filter(x=>x.ex!==e.id), u=unit(s.id);
    h+=`<div class="body">${shiftRow(s.id)}
      ${other.length?`<p class="small muted">Antes, con otra variante: ${other.map(x=>`${esc(exName(x.ex))} ${x.v}`).join(" · ")}</p>`:""}
      <p class="small muted">Apunta las series al terminar el ejercicio. ${lv?`Última vez: ${lv.join(" · ")} ${u}.`:"Primera vez con esta variante."}</p>
      <div class="rows">${arr.map((v,j)=>`<div class="srow"><span class="sn">${j+1}</span>
        <button class="adj2" data-sv="${s.id}|${j}|-1" aria-label="Restar">−</button>
        <b class="sv ${v>=s.max?"hit":(v>0&&v<s.min?"miss":"")}">${v?v:"—"}</b>
        <button class="adj2" data-sv="${s.id}|${j}|1" aria-label="Sumar">+</button>
        <span class="su">${u}</span></div>`).join("")}</div>
      <div class="row"><button class="link" data-addrow="${s.id}">+ serie</button>${arr.length>1?`<button class="link" data-delrow="${s.id}">− serie</button>`:"<span></span>"}<button class="link" data-rest="${s.id}">Descanso ${fmtMin(restOf(s.id))}</button></div>
      <button class="log" data-savex="${s.id}">${hechas?"Actualizar ejercicio":"Guardar ejercicio"}</button>
      ${hint(s.id)}${techHTML(e)}</div>`;
  }
  return h+`</div>`;
}
function renderHoy(){
  const p=state.activa?PL[state.activa.plantilla]:nextPl(), pos=PLANTILLAS.indexOf(p);
  const a=state.activa;
  let h=`<section class="next${a?" live":""}"><div class="sub">${a?"Entreno en curso":"Siguiente entreno"} · sesión ${sesiones.length+1}</div>
    <div class="kind">${p.patron}</div>
    <div class="sub">${esc(p.tipo)} · ≈ ${p.min} min</div>
    <div class="seq" aria-label="Alternancia">${PLANTILLAS.map((x,i)=>`<span class="${i===pos?"on":""}" title="${x.patron}"></span>`).join("")}</div></section>`;
  if(!a){
    if(sesiones.length>=3&&Date.now()-(state.ultimaCopia||0)>14*864e5)h+=`<p class="small hint up" style="margin-top:0">Tus datos solo están en este móvil. Descarga una copia de seguridad desde Ajustes.</p>`;
    if(sesiones.length<6)h+=`<p class="small muted">Si no sabes en qué variante estás, ajústala aquí o durante el entreno. Los cambios manuales reinician la racha de ese ejercicio.</p>`;
    let bl=null, n=0, supPrev=null;
    p.slots.forEach(s=>{
      if(s.bloque!==bl){bl=s.bloque; h+=`<h2>${BLOQUES[bl].n} <span class="muted small">≈ ${minsBloque(p,bl)} min</span></h2><p class="small muted">${BLOQUES[bl].d}</p>`}
      const e=curEx(s.id); n++;
      if(s.sup&&s.sup!==supPrev)h+=`<div class="supbar">${esc(s.sup)}</div>`; supPrev=s.sup;
      h+=`<div class="card"><div class="card-h"><div class="pos"><b>${n}</b></div><div style="flex:1"><div class="name">${esc(e.nombre)}${provTag(e)}</div>
      <div class="meta">${targetText(s.id)} · ${levelText(s.id)}${s.t?` · ${s.t} min`:""}${streakDots(s.id)}</div></div></div><div class="body tight">${shiftRow(s.id)}</div></div>`});
    h+=`<button class="primary" id="start">Empezar entreno</button><button class="ghost" id="other">Hacer el otro entreno</button>`;
    return h;
  }
  h+=`<details class="card prep" ${a.prepOk?"":"open"}><summary class="card-h"><div style="flex:1"><div class="name">Preparación</div><div class="meta">Antes del bloque de técnica</div></div></summary><div class="body">${[...PREP,PREP_EXTRA[p.patron]].map((x,i)=>`<label class="chk"><input type="checkbox" data-prep="${i}" ${(a.prep||[])[i]?"checked":""}> ${esc(x)}</label>`).join("")}</div></details>`;
  if(!openSlot||!p.slots.find(s=>s.id===openSlot))openSlot=(p.slots.find(s=>!setsCur(s.id).length)||p.slots[0]).id;
  let bl=null, n=0, supPrev=null;
  p.slots.forEach(s=>{
    if(s.bloque!==bl){bl=s.bloque; h+=`<h2>${BLOQUES[bl].n} <span class="muted small">≈ ${minsBloque(p,bl)} min</span></h2>`}
    n++;
    if(s.sup&&s.sup!==supPrev)h+=`<div class="supbar">${esc(s.sup)}</div>`; supPrev=s.sup;
    h+=slotCard(s,n,p);
  });
  h+=`<label class="f" for="nota">Nota del entreno</label><textarea id="nota" placeholder="Qué falló, qué salió bien…">${esc(a.nota||"")}</textarea><button class="primary" id="finish">Terminar entreno</button><button class="ghost" id="cancel">Descartar entreno</button>`;
  return h;
}

function renderEsc(){
  let h=`<p class="muted small">Toca un escalón para ver su técnica y el vídeo, y ponerte ahí si quieres. Sube tras 2 sesiones seguidas en el tope del rango en todas las series; baja tras 2 sesiones con la mayoría de series por debajo del mínimo. Cada cambio manual reinicia la racha y se puede deshacer.</p>`;
  const seen=new Set();
  PLANTILLAS.forEach(p=>{
    h+=`<h2>${p.patron} · ${p.tipo}</h2>`;
    p.slots.forEach(s=>{if(seen.has(key(s.id))){h+=`<p class="small muted">${esc(LADDERS[s.ladder].nombre)}: mismo nivel que arriba.</p>`;return} seen.add(key(s.id)); const st=ST(s.id), L=LADDERS[s.ladder];
      h+=`<div class="card"><div class="card-h"><div style="flex:1"><div class="name">${esc(L.nombre)}</div><div class="meta">${targetText(s.id)}${streakDots(s.id)}</div></div></div>
      ${s.lastre?`<div class="body tight">${shiftRow(s.id)}</div>`:""}
      <ul class="ladder">${L.peldanos.map((id,i)=>{const e=EX[id]; return `<li class="${i===st.idx?"cur":i<st.idx?"past":""}"><details class="rung"><summary><span class="rname">${esc(e.nombre)}${provTag(e)}</span><span class="rmark">${i===st.idx?"aquí":""}</span></summary><div class="rbody">${techBody(e)}${i===st.idx?`<p class="small muted">Es tu escalón actual: ${targetText(s.id)}.</p>`:`<button class="ghost small-btn" data-set="${s.id}|${i}">Ponerme en este escalón</button>`}</div></details></li>`}).join("")}</ul></div>`});
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
  if(d.sv){const [sid,js,dir]=d.sv.split("|"), j=+js, p=paso(sid);
    const arr=pending[sid], v=Math.max(0,(arr[j]||0)+(+dir)*p);
    arr[j]=v; tocado[sid]=tocado[sid]||arr.map(()=>false); tocado[sid][j]=true;
    // las series que aún no has tocado siguen a la primera: menos toques cuando todas son iguales
    for(let k=j+1;k<arr.length;k++)if(!tocado[sid][k])arr[k]=v;
    render(); return}
  if(d.addrow){pending[d.addrow]=pending[d.addrow]||initPending(d.addrow); const arr=pending[d.addrow]; arr.push(arr[arr.length-1]||0); (tocado[d.addrow]=tocado[d.addrow]||[]).push(false); render(); return}
  if(d.delrow){const arr=pending[d.delrow]; if(arr&&arr.length>1)arr.pop(); render(); return}
  if(d.rest){startRest(restOf(d.rest)); return}
  if(d.kg){const [sid,dir]=d.kg.split("|"); const st=ST(sid); setLevel(sid,{kg:Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2))},`Lastre: ${fmtKg(Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2)))}`); return}
  if(d.shift){const [sid,dir]=d.shift.split("|"); if(SLOT[sid].lastre){const st=ST(sid); setLevel(sid,{kg:Math.max(0,+(st.kg+(+dir)*state.ajustes.inc).toFixed(2))})} else {pending[sid]=null; shift(sid,+dir)} return}
  if(d.savex){const sid=d.savex, s=SLOT[sid], a=state.activa, arr=(pending[sid]||[]).filter(v=>v>0);
    if(!arr.length){toast("Pon al menos una serie con un número"); return}
    const ex=curEx(sid).id, kg=s.lastre?ST(sid).kg:0;
    a.registros[sid]=a.registros[sid]||{sets:[]};
    a.registros[sid].sets=a.registros[sid].sets.filter(x=>x.ex!==ex).concat(arr.map(v=>({v,ex,kg})));
    save();
    const p=PL[a.plantilla], falta=p.slots.find(x=>!setsCur(x.id).length);
    if(!hint(sid))openSlot=falta?falta.id:null;
    render(); toast(`${esc(curEx(sid).nombre)}: ${arr.join(" · ")}`); return}
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
