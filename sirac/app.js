
const MATERIAS = [
  { id: "ACF-0901", nombre: "Cálculo Diferencial", col: 1, row: 1, hc: "3-2-5", cr: 5, req: [] },
  { id: "ACF-0902", nombre: "Cálculo Integral", col: 2, row: 1, hc: "3-2-5", cr: 5, req: ["ACF-0901"] },
  { id: "ACA-0909", nombre: "Taller de Inv 1", col: 3, row: 1, hc: "0-4-4", CR: 5, req:[]},
  { id: "TIE-1018", nombre: "Matemáticas Aplicadas a Comunicaciones", col: 4, row: 1, hc: "3-1-4", cr: 4, req: ["ACF-0902"] },

  { id: "AEF-1032", nombre: "Fundamentos de Programación", col: 1, row: 2, hc: "3-2-5", cr: 5, req: [] },
  { id: "AEB-1054", nombre: "Programación Orientada a Objetos", col: 2, row: 2, hc: "1-4-5", cr: 5, req: ["AEF-1032"] },
  { id: "TID-1012", nombre: "Estructuras y Organización de Datos", col: 3, row: 2, hc: "2-3-5", cr: 5, req: ["AEB-1054"] },
  { id: "TIB-1024", nombre: "Programación II", col: 4, row: 2, hc: "1-4-5", cr: 5, req: ["TID-1012"] },

  { id: "TIF-1019", nombre: "Matemáticas Discretas I", col: 1, row: 3, hc: "3-2-5", cr: 5, req: [] },
  { id: "TIF-1020", nombre: "Matemáticas Discretas II", col: 2, row: 3, hc: "3-2-5", cr: 5, req: ["TIF-1019"] },
  { id: "TIF-1021", nombre: "Matemáticas para la Toma de Decisiones", col: 3, row: 3, hc: "3-2-5", cr: 5, req: ["TIF-1020"] },
  { id: "TIF-1013", nombre: "Fundamentos de Redes", col: 4, row: 3, hc: "3-2-5", cr: 5, req: ["TIF-1021"] },
];
const MAX_SEMESTRE = 4;
const MAX_CREDITOS = 36;

const M = Object.fromEntries(MATERIAS.map((m) => [m.id, m]));
const nombre = (id) => M[id].nombre;


let pantalla = "semestre"; 
let semestre = 1;
let historial = {};        
let escenarios = [];       
let pestana = "contexto";
let contador = 1;
MATERIAS.forEach((m) => (historial[m.id] = "none"));

// ---------- Reglas ----------
// Color de prioridad de una materia en el semestre T
function color(id, estado, T) {
  if (estado === "aprobada") return ["verde", "Aprobada"];
  if (estado === "cursando") return ["azul", "Cursando"];
  if (estado === "reprobada") return ["rojo", "Reprobada"];
  const col = M[id].col;
  if (col > T) return ["bloq", `Se abre en el semestre ${col}`];
  const atraso = T - col;
  if (atraso >= 2) return ["rojo", `${atraso} semestres de atraso`];
  if (atraso === 1) return ["amarillo", "1 semestre de atraso"];
  return ["", "Pendiente"];
}

// Materias seriadas que faltan por aprobar
const faltantes = (id, estados) => M[id].req.filter((r) => estados[r] !== "aprobada");

// ¿Se puede cargar la materia en el semestre T? Devuelve null o el motivo
function motivoBloqueo(id, estados, T) {
  if (estados[id] === "aprobada") return "Ya aprobada";
  if (M[id].col > T) return `Se abre en el semestre ${M[id].col}`;
  const f = faltantes(id, estados);
  if (f.length) return `Requiere ${f.map(nombre).join(", ")}`;
  return null;
}

// Validación del historial capturado
function erroresHistorial() {
  const errores = {};
  for (const m of MATERIAS) {
    if (historial[m.id] === "none") continue;
    const f = faltantes(m.id, historial);
    if (f.length) errores[m.id] = `No puede estar ${historial[m.id]}: requiere aprobar ${f.map(nombre).join(", ")}`;
  }
  return errores;
}

// Estados proyectados de un escenario al iniciar el siguiente semestre
function estadosEscenario(esc) {
  const est = {};
  for (const m of MATERIAS) {
    const h = historial[m.id];
    est[m.id] = h === "cursando" ? (esc.resultado[m.id] === "reprueba" ? "reprobada" : "aprobada") : h;
  }
  return est;
}

//Dibujo de la retícula 
function reticula(T, celdaFn) {
  let html = "";
  for (let c = 1; c <= 4; c++) html += `<div class="num">${c}</div>`;
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c <= 4; c++) {
      const m = MATERIAS.find((x) => x.col === c && x.row === r);
      html += m ? celdaFn(m) : `<div class="celda vacia"><div class="cuerpo"></div><div class="pie">&nbsp;</div></div>`;
    }
  }
  return `<div class="scroll"><div class="reticula">${html}</div></div>`;
}

function celda(m, clase, extra) {
  return `<div class="celda ${clase}">
    <div class="cuerpo"><div class="nombre">${m.nombre}</div><div class="clave">${m.id}</div>${extra}</div>
    <div class="pie">${m.hc}</div>
  </div>`;
}

const leyenda = `<div class="leyenda">
  <span><i style="background:var(--rojo)"></i>Alta prioridad (reprobada o 2+ semestres de atraso)</span>
  <span><i style="background:var(--amarillo)"></i>Media (1 semestre de atraso)</span>
  <span><i style="background:var(--verde)"></i>Aprobada</span>
  <span><i style="background:var(--azul)"></i>Cursando</span>
  <span><i style="background:var(--bloq)"></i>Aún no disponible</span>
</div>`;

// Pantallas
function pantallaSemestre() {
  const opciones = Array.from({ length: MAX_SEMESTRE }, (_, i) =>
    `<option value="${i + 1}" ${semestre === i + 1 ? "selected" : ""}>${i + 1}° semestre</option>`).join("");
  return `<h1>SIRAC (prototipo)</h1><p class="sub">Simulador de escenarios de la retícula (profa pasenos)</p>
    <form class="form" id="formSemestre">
      <label for="selSemestre">¿Qué semestre cursas actualmente?</label>
      <select id="selSemestre">${opciones}</select>
      <button type="submit" class="principal">Continuar</button>
    </form>`;
}

function pantallaHistorial() {
  const errores = erroresHistorial();
  const grid = reticula(semestre, (m) => {
    if (m.col > semestre) return celda(m, "c-bloq", `<div class="estado">Se abre en el semestre ${m.col}</div>`);
    const h = historial[m.id];
    const sel = `<select data-hist="${m.id}" id="h-${m.id}" aria-label="Estado de ${m.nombre}">
      ${["none", "aprobada", "reprobada", "cursando"].map((v) =>
        `<option value="${v}" ${h === v ? "selected" : ""}>${{ none: "No cursada", aprobada: "Aprobada", reprobada: "Reprobada", cursando: "Cursando" }[v]}</option>`).join("")}
    </select>`;
    const clase = { none: "", aprobada: "c-verde", reprobada: "c-rojo", cursando: "c-azul" }[h] + (errores[m.id] ? " c-error" : "");
    return celda(m, clase, sel);
  });
  const lista = Object.values(errores).map((e) => `<li class="error">${e}</li>`).join("");
  return `<h1>SIRAC (prototipo)</h1><p class="sub">Semestre actual: ${semestre}. Indica las materias que ya cursaste y las que estás cursando.</p>
    ${grid}
    ${lista ? `<ul class="mensajes">${lista}</ul>` : ""}
    <div class="acciones">
      <button data-accion="regresar">Cambiar semestre</button>
      <button class="principal" data-accion="generar" ${lista ? "disabled" : ""}>Generar contexto</button>
    </div>`;
}

function pantallaPrincipal() {
  const tabs = [`<button class="${pestana === "contexto" ? "on" : ""}" data-tab="contexto">Contexto (semestre ${semestre})</button>`]
    .concat(escenarios.map((e) => `<button class="${pestana === e.id ? "on" : ""}" data-tab="${e.id}">${e.nombre}</button>`))
    .concat(`<button data-accion="nuevo">+ Nuevo escenario</button>`).join("");
  const esc = escenarios.find((e) => e.id === pestana);
  return `<h1>SIRAC (prototipo)</h1><p class="sub">Semestre actual: ${semestre}</p>
    <div class="tabs">${tabs}</div>
    ${esc ? vistaEscenario(esc) : vistaContexto()}
    <div class="acciones"><button data-accion="editar">Editar materias</button><button data-accion="reiniciar">Reiniciar</button></div>`;
}

function vistaContexto() {
  const mensajes = [];
  const grid = reticula(semestre, (m) => {
    const [c, txt] = color(m.id, historial[m.id], semestre);
    if (c === "rojo") mensajes.push(`<li class="error">${m.nombre}: ${txt.toLowerCase()}.</li>`);
    if (c === "amarillo") mensajes.push(`<li class="aviso">${m.nombre}: ${txt.toLowerCase()}.</li>`);
    return celda(m, c ? "c-" + c : "", `<div class="estado">${txt}</div>`);
  });
  return `${leyenda}${grid}${mensajes.length ? `<ul class="mensajes">${mensajes.join("")}</ul>` : `<ul class="mensajes"><li class="ok">Vas al corriente.</li></ul>`}`;
}

function vistaEscenario(esc) {
  const T = semestre + 1;
  const est = estadosEscenario(esc);
  // si un resultado cambió y una materia cargada ya no es válida, se quita de la carga
  const quitadas = [];
  for (const id of Object.keys(esc.carga)) {
    if (motivoBloqueo(id, est, T)) { delete esc.carga[id]; quitadas.push(id); }
  }
  const creditos = Object.keys(esc.carga).reduce((s, id) => s + M[id].cr, 0);

  const grid = reticula(T, (m) => {
    let extra = "";
    if (historial[m.id] === "cursando") {
      const r = esc.resultado[m.id] || "aprueba";
      extra += `<select data-resultado="${m.id}" id="r-${esc.id}-${m.id}" aria-label="Resultado de ${m.nombre}">
        <option value="aprueba" ${r === "aprueba" ? "selected" : ""}>Si la apruebo</option>
        <option value="reprueba" ${r === "reprueba" ? "selected" : ""}>Si la repruebo</option></select>`;
    }
    const motivo = motivoBloqueo(m.id, est, T);
    if (!motivo) {
      extra += `<label><input type="checkbox" data-carga="${m.id}" id="c-${esc.id}-${m.id}" ${esc.carga[m.id] ? "checked" : ""}> Cargar en semestre ${T}</label>`;
    } else if (est[m.id] !== "aprobada" && M[m.id].col <= T) {
      extra += `<div class="motivo">${motivo}</div>`;
    }
    const [c, txt] = esc.carga[m.id] ? ["azul", `Cursando en semestre ${T}`] : color(m.id, est[m.id], T);
    return celda(m, c ? "c-" + c : "", `<div class="estado">${txt}</div>${extra}`);
  });

  const msgs = [];
  quitadas.forEach((id) => msgs.push(`<li class="error">${nombre(id)} se quitó de la carga: ${motivoBloqueo(id, est, T)}.</li>`));
  if (creditos > MAX_CREDITOS) msgs.push(`<li class="error">La carga excede el máximo de ${MAX_CREDITOS} créditos.</li>`);
  for (const m of MATERIAS) {
    if (esc.carga[m.id] || motivoBloqueo(m.id, est, T)) continue;
    if (est[m.id] === "reprobada") msgs.push(`<li class="error">${m.nombre} está reprobada y debe recursarse en el semestre ${T}.</li>`);
    else if (T - m.col >= 1) msgs.push(`<li class="aviso">${m.nombre} va atrasada y no está en la carga.</li>`);
  }
  for (const m of MATERIAS) {
    if (est[m.id] === "reprobada" || M[m.id].col > T) continue;
    const f = faltantes(m.id, est);
    if (f.length && est[m.id] !== "aprobada") msgs.push(`<li class="aviso">${m.nombre} queda bloqueada por seriación (${f.map(nombre).join(", ")}).</li>`);
  }
  if (!msgs.length) msgs.push(`<li class="ok">La carga cumple con la seriación y el límite de créditos.</li>`);

  return `<p class="sub">Escenario para el semestre ${T}: elige qué pasa con las materias que cursas y qué materias cargarías.</p>
    ${leyenda}${grid}
    <div class="creditos">Créditos cargados: <b>${creditos}</b> / ${MAX_CREDITOS}</div>
    <ul class="mensajes">${msgs.join("")}</ul>
    <div class="acciones"><button data-accion="eliminar">Eliminar este escenario</button></div>`;
}

// Eventos
const app = document.getElementById("app");
function render() {
  app.innerHTML = pantalla === "semestre" ? pantallaSemestre() : pantalla === "historial" ? pantallaHistorial() : pantallaPrincipal();
}

app.addEventListener("submit", (e) => {
  e.preventDefault();
  semestre = +document.getElementById("selSemestre").value;
  MATERIAS.forEach((m) => { if (m.col > semestre) historial[m.id] = "none"; });
  pantalla = "historial";
  render();
});

app.addEventListener("change", (e) => {
  const t = e.target;
  const esc = escenarios.find((x) => x.id === pestana);
  if (t.dataset.hist) historial[t.dataset.hist] = t.value;
  else if (t.dataset.resultado) esc.resultado[t.dataset.resultado] = t.value;
  else if (t.dataset.carga) {
    const id = t.dataset.carga;
    if (t.checked) {
      const total = Object.keys(esc.carga).reduce((s, k) => s + M[k].cr, 0) + M[id].cr;
      if (total > MAX_CREDITOS) { t.checked = false; alertar(`No se puede: excede ${MAX_CREDITOS} créditos.`); return; }
      esc.carga[id] = true;
    } else delete esc.carga[id];
  } else return;
  render();
});

app.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b || b.closest("form")) return;
  if (b.dataset.tab) pestana = b.dataset.tab;
  const a = b.dataset.accion;
  if (a === "regresar") pantalla = "semestre";
  if (a === "generar") { pantalla = "principal"; pestana = "contexto"; }
  if (a === "editar") pantalla = "historial";
  if (a === "nuevo") {
    const esc = { id: "e" + contador, nombre: `Escenario ${contador}`, resultado: {}, carga: {} };
    contador++;
    escenarios.push(esc);
    pestana = esc.id;
  }
  if (a === "eliminar") { escenarios = escenarios.filter((x) => x.id !== pestana); pestana = "contexto"; }
  if (a === "reiniciar") {
    pantalla = "semestre"; semestre = 1; escenarios = []; pestana = "contexto";
    MATERIAS.forEach((m) => (historial[m.id] = "none"));
  }
  render();
});

function alertar(msg) {
  const li = document.createElement("li");
  li.className = "error"; li.textContent = msg;
  const ul = app.querySelector(".mensajes");
  if (ul) ul.prepend(li);
}

render();
