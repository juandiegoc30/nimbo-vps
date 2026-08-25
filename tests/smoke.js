/*
 * Prueba de humo sin navegador.
 *
 * Levanta un doble minimo del DOM a partir de los id y de la estructura
 * reales de app.html, ejecuta assets/js/app.js dentro de un contexto vm y
 * verifica el calculo, la carta, los controles de eleccion y el asistente.
 *
 * Ejecutar:  node tests/smoke.js
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("app.html", "utf8");
const landingHtml = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("assets/css/styles.css", "utf8");
const iconCss = fs.readFileSync("assets/vendor/tabler-icons/tabler-icons.min.css", "utf8");
const js = fs.readFileSync("assets/js/app.js", "utf8");
const landingJs = fs.readFileSync("assets/js/landing.js", "utf8");
const license = fs.readFileSync("LICENSE", "utf8");

assert.match(html, /href="\.\/assets\/favicon-32\.png"[^>]*sizes="32x32"/,
  "la aplicación debe enlazar el favicon raster generado");
assert.match(html, /href="\.\/assets\/apple-touch-icon\.png"[^>]*sizes="180x180"/,
  "la aplicación debe enlazar el icono para Apple Touch");
assert.match(html, /class="brand-mark"[\s\S]*?nimbo-mark-128\.png/,
  "el header debe usar la nueva marca de ImageGen");
assert.doesNotMatch(html, /class="brand-mark"[\s\S]{0,120}<svg/,
  "la marca anterior dibujada como SVG no debe seguir activa");
assert.match(css, /\.brand-mark img \{[^}]*width:\s*30px;[^}]*height:\s*30px;/,
  "la marca debe conservar una caja estable de 30px en el header");
assert.match(landingHtml, /href="\.\/assets\/favicon-32\.png"[^>]*sizes="32x32"/,
  "la landing debe enlazar el mismo favicon raster");
assert.equal((landingHtml.match(/nimbo-mark-128\.png/g) || []).length, 2,
  "la landing debe usar la misma marca en header y footer");
assert.match(landingHtml, /© 2026 Juan Diego Castellanos/,
  "el footer debe identificar el copyright");
assert.match(landingHtml, /href="https:\/\/github\.com\/juandiegoc30"/,
  "el footer debe enlazar el perfil de GitHub");
assert.match(landingHtml, /href="https:\/\/github\.com\/juandiegoc30"[^>]*>[\s\S]*?ti-brand-github/,
  "el enlace de GitHub debe incluir su icono reconocible");
assert.doesNotMatch(landingHtml, /href="\.\/LICENSE"/,
  "la licencia MIT debe presentarse como texto, no como enlace");
assert.match(landingHtml, /Se publica bajo la licencia MIT\./,
  "el footer debe indicar la licencia con una frase explícita");
assert.match(landingHtml, /herramienta open source/i,
  "el footer debe indicar que el proyecto es open source");
assert.match(license, /Copyright \(c\) 2026 Juan Diego Castellanos/,
  "la licencia debe identificar al titular");
assert.match(css, /\.page-header \{[\s\S]*?position:\s*fixed;[\s\S]*?inset:\s*0 0 auto;/,
  "la cabecera de la landing debe permanecer fija al viewport");
assert.match(css, /body:not\(\.app\) \{[\s\S]*?padding-top:\s*calc\(68px \+ env\(safe-area-inset-top\)\)/,
  "la landing debe reservar el alto de la cabecera fija");
assert.match(landingJs, /scrollRestoration\s*=\s*"manual"/,
  "la landing debe impedir la restauración acumulativa del scroll");
assert.doesNotMatch(html, /Descargar datos|btnExport|btnCompleteExport/,
  "la entrega debe limitarse a copiar o imprimir la carta");
assert.doesNotMatch(js, /exportResult|application\/json|\.json/,
  "la aplicación no debe conservar la exportación JSON");

/* ---------------- Dobles del DOM ---------------- */

class FakeClassList {
  constructor() { this.values = new Set(); }
  toggle(name, force) {
    const active = force === undefined ? !this.values.has(name) : force;
    if (active) this.values.add(name); else this.values.delete(name);
    return active;
  }
  add(...names) { names.forEach((name) => this.values.add(name)); }
  remove(...names) { names.forEach((name) => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
}

class FakeElement {
  constructor(tagName = "DIV") {
    this.tagName = tagName;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.min = "";
    this.max = "";
    this.textContent = "";
    this.className = "";
    this.type = "";
    this.dataset = {};
    this.style = { setProperty() {}, removeProperty() {} };
    this.children = [];
    this.attributes = {};
    this.classList = new FakeClassList();
  }
  addEventListener(type, handler) { (this.listeners ??= {})[type] = handler; }
  dispatch(type, event) { this.listeners?.[type]?.(event); }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(child) { this.children.push(child); return child; }
  replaceChildren() { this.children = []; }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  focus() { FakeElement.focused = this; }
  showModal() { this.open = true; this.setAttribute("open", ""); }
  close() { this.open = false; this.removeAttribute("open"); }
  remove() {}
}

/* ---------------- Elementos por id ---------------- */

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
const elements = Object.fromEntries(ids.map((id) => {
  const element = new FakeElement("INPUT");
  element.id = id;
  return [id, element];
}));
elements.completionScreen.hidden = true;

// Rangos declarados en el HTML, necesarios para los botones de mas y menos
for (const [, id, min, max] of html.matchAll(/id="(totalUsers|simultaneousUsers)"[^>]*min="(\d+)" max="(\d+)"/g)) {
  elements[id].min = min;
  elements[id].max = max;
}

Object.entries({
  totalUsers: 300, simultaneousUsers: 15, usageIntensity: 1.25,
  dataVolume: 5, fileVolume: 50, fileWeight: 1, retentionYears: 5,
  growthLevel: 1.25, headroom: 1.2, availability: 1.15, backupFrequency: 1.1,
  recipientRole: "Área de Infraestructura Tecnológica"
}).forEach(([id, value]) => { elements[id].value = String(value); });

["featureAuth", "featureCrud", "featureReports", "featureFiles", "featurePdf"]
  .forEach((id) => { elements[id].checked = true; });

/* ---------------- Pasos del asistente ---------------- */

// Pantallas reales de app.html, cada una con la etapa a la que pertenece
const screens = [...html.matchAll(/class="step[^"]*" data-section="(\d)" data-title="([^"]+)"/g)]
  .map(([, section, title]) => ({ section, title }));

const wizardSteps = screens.map(({ section, title }, index) => {
  const step = new FakeElement("FIELDSET");
  step.hidden = index !== 0;
  step.dataset = { title, section };
  step.heading = new FakeElement("H1");
  // Solo la primera pantalla declara campos obligatorios
  step.required = index === 0
    ? [elements.applicationName, elements.projectName, elements.projectPurpose]
    : [];
  step.querySelector = (selector) => (selector === ".step-head h1" ? step.heading : null);
  step.querySelectorAll = (selector) => (selector === "[required]" ? step.required : []);
  return step;
});

/* ---------------- Grupos de eleccion ---------------- */

const choiceGroups = [...html.matchAll(
  /class="(?:choices[^"]*|segmented)" data-choice="([^"]+)"[\s\S]*?\n *<\/div>/g
)].map((match) => {
  const group = new FakeElement("DIV");
  group.dataset = { choice: match[1] };
  group.radios = [...match[0].matchAll(
    /<input type="radio"[^>]*?value="([\d.]+)"(?:[^>]*?data-min="(\d+)")?(?:[^>]*?data-max="(\d+)")?[^>]*?data-label="([^"]+)"/g
  )].map(([, value, min, max, label]) => {
    const radio = new FakeElement("INPUT");
    radio.type = "radio";
    radio.value = value;
    radio.dataset = { label, ...(min ? { min, max } : {}) };
    return radio;
  });
  group.querySelectorAll = () => group.radios;
  group.querySelector = (selector) =>
    (selector === "input:checked" ? group.radios.find((radio) => radio.checked) ?? null : null);
  return group;
});

assert.ok(choiceGroups.length >= 9, `se esperaban al menos 9 grupos de eleccion, hay ${choiceGroups.length}`);
choiceGroups.forEach((group) => {
  assert.ok(group.radios.length >= 3, `el grupo ${group.dataset.choice} no tiene opciones parseadas`);
});
["dataVolume", "fileVolume", "fileWeight", "retentionYears"].forEach((id) => {
  assert.equal(choiceGroups.find((group) => group.dataset.choice === id).radios.length, 4,
    `${id} debe ofrecer cuatro opciones equilibradas`);
});

/* ---------------- Botones de mas y menos ---------------- */

const nudges = [...html.matchAll(/data-nudge="([^"]+)" data-by="(-?\d+)"/g)].map(([, target, by]) => {
  const button = new FakeElement("BUTTON");
  button.dataset = { nudge: target, by };
  return button;
});
assert.equal(nudges.length, 4);

/* ---------------- Documento ---------------- */

const documentStub = {
  body: new FakeElement("BODY"),
  title: "Calculadora - Nimbo VPS",
  getElementById: (id) => elements[id],
  querySelectorAll: (selector) => {
    if (selector === ".step") return wizardSteps;
    if (selector === "[data-choice]") return choiceGroups;
    if (selector === "[data-nudge]") return nudges;
    if (selector.startsWith("#canvasInner ")) {
      const start = html.indexOf('id="canvasInner"');
      const end = html.indexOf('id="completionScreen"');
      const innerMarkup = html.slice(start, end);
      return [...innerMarkup.matchAll(/<(?:input|textarea|select|button)[^>]*id="([^"]+)"/g)]
        .map((match) => elements[match[1]])
        .filter(Boolean);
    }
    return [];
  },
  querySelector: (selector) => (selector.startsWith("#") ? elements[selector.slice(1)] ?? null : null),
  createElement: (tag) => new FakeElement(tag.toUpperCase()),
  addEventListener: (event, callback) => { if (event === "DOMContentLoaded") callback(); },
  createRange: () => ({ selectNodeContents() {} })
};

const context = vm.createContext({
  document: documentStub,
  navigator: {},
  window: {
    setTimeout, clearTimeout, print() {}, scrollTo() {},
    location: { reloadCalled: 0, reload() { this.reloadCalled += 1; } },
    getSelection: () => ({ removeAllRanges() {}, addRange() {} })
  },
  Blob,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  console, setTimeout, clearTimeout
});

vm.runInContext(fs.readFileSync("assets/js/app.js", "utf8"), context);

assert.equal(vm.runInContext(
  "Object.values(choiceIconNames).every((names) => names.length === new Set(names).size)",
  context
), true, "cada respuesta de un mismo grupo debe tener un icono distinto");
const tablerNames = vm.runInContext("Object.values(choiceIconNames).flat()", context);
tablerNames.forEach((name) => assert.match(iconCss, new RegExp(`\\.ti-${name}:before`),
  `Tabler debe incluir el icono ${name}`));
assert.match(html, /assets\/vendor\/tabler-icons\/tabler-icons\.min\.css/,
  "la interfaz debe cargar Tabler Icons desde el proyecto");
assert.doesNotMatch(js, /choiceIconShapes/, "no deben quedar trazados SVG hechos a mano para las respuestas");

const groupFor = (id) => choiceGroups.find((group) => group.dataset.choice === id);
const pantallaVisible = () => wizardSteps.findIndex((step) => !step.hidden);
const checkedIn = (id) => groupFor(id).radios.find((radio) => radio.checked);

/* ================= Calculo ================= */

const initial = vm.runInContext("calculate()", context);
assert.equal(initial.inputs.totalUsers, 300);
assert.match(initial.specification, /\[nombre del proyecto\]/);
assert.ok(initial.recommendation.cpu >= 2);
assert.ok(initial.recommendation.ram >= 4);

// La lectura en vivo del dock refleja el mismo calculo que el panel
assert.equal(elements.liveCpu.textContent, initial.recommendation.cpu);
assert.equal(elements.liveRam.textContent, initial.recommendation.ram);
assert.equal(elements.liveDisk.textContent, initial.recommendation.storage);
assert.equal(elements.cpuResult.textContent, initial.recommendation.cpu);
assert.match(elements.nimboFinalRecommendation.textContent,
  new RegExp(`${initial.recommendation.cpu} vCPU.*${initial.recommendation.ram} GB RAM.*${initial.recommendation.storage} GB NVMe`),
  "la tarjeta final de Nimbo debe mostrar la recomendación calculada");

/* ================= Carta ================= */

elements.applicationName.value = "Portal Ciudadano";
elements.projectName.value = "Servicios 2026";
elements.projectPurpose.value = "centralizar trámites para la comunidad";
elements.recipientName.value = "Ing. Andrea Pérez";
elements.requesterName.value = "Equipo de Transformación Digital";

const customized = vm.runInContext("calculate()", context);
assert.match(customized.specification, /Portal Ciudadano/);
assert.match(customized.specification, /Servicios 2026/);
assert.match(customized.specification, /centralizar trámites para la comunidad\./);
assert.match(customized.specification, /Ing\. Andrea Pérez/);
assert.equal(elements.requestStatus.textContent, "Solicitud lista");
assert.equal(elements.requestStatus.className, "badge badge-ok");
assert.equal(elements.projectCount.textContent, "3 de 3 datos");

// Guiones, nunca los separadores decorativos
assert.match(customized.specification, /^- \d+ vCPU\./m);
assert.doesNotMatch(customized.specification, /[·•—]/);

/* ================= Controles de eleccion ================= */

// El valor por defecto marca la tarjeta cuya banda lo contiene
assert.equal(checkedIn("totalUsers").dataset.label, "Entre 50 y 300 personas");
assert.equal(checkedIn("simultaneousUsers").dataset.label, "Entre 10 y 30 a la vez");
// Los grupos de valor exacto marcan por coincidencia directa, decimales incluidos
assert.equal(checkedIn("usageIntensity").value, "1.25");
assert.equal(checkedIn("headroom").value, "1.2");
assert.equal(checkedIn("retentionYears").value, "5");

// Elegir una tarjeta escribe en el campo destino y recalcula
groupFor("simultaneousUsers").dispatch("change", { target: { value: "150" } });
assert.equal(elements.simultaneousUsers.value, "150");
assert.equal(checkedIn("simultaneousUsers").dataset.label, "Más de 80 a la vez");
assert.ok(Number(elements.liveCpu.textContent) > Number(initial.recommendation.cpu),
  "mas gente conectada debe subir la CPU estimada");

// Escribir una cifra exacta vuelve a marcar la tarjeta correspondiente
elements.simultaneousUsers.value = "12";
vm.runInContext("calculate()", context);
assert.equal(checkedIn("simultaneousUsers").dataset.label, "Entre 10 y 30 a la vez");

/* ================= Botones de mas y menos ================= */

nudges.find((n) => n.dataset.nudge === "simultaneousUsers" && Number(n.dataset.by) > 0).dispatch("click");
assert.equal(elements.simultaneousUsers.value, 17);

// No se puede bajar del minimo declarado en el HTML
elements.simultaneousUsers.value = "2";
nudges.find((n) => n.dataset.nudge === "simultaneousUsers" && Number(n.dataset.by) < 0).dispatch("click");
assert.equal(elements.simultaneousUsers.value, 1, "el boton de restar debe respetar min");

/* ================= Aviso de concurrencia ================= */

elements.simultaneousUsers.value = "5000";
vm.runInContext("calculate()", context);
assert.equal(elements.usersWarning.hidden, false);
elements.simultaneousUsers.value = "15";
vm.runInContext("calculate()", context);
assert.equal(elements.usersWarning.hidden, true);

/* ================= Repaso de respuestas ================= */

assert.equal(elements.recap.children.length, 4, "el repaso debe agrupar las respuestas por etapa");
const recapText = elements.recap.children.map((row) => row.children.map((c) => c.textContent).join(" "));
assert.ok(recapText.some((line) => line.includes("Funciones activas") && line.includes("5 de 8")));
assert.ok(recapText.some((line) => line.includes("Información") && line.includes("Hasta 5 MB")));
assert.ok(recapText.every((line) => !line.includes("Sin definir")), "ninguna respuesta debe quedar sin definir");
assert.ok(recapText.every((line) => !line.includes("·")), "el repaso debe separar valores con guiones");
assert.ok(recapText.some((line) => line.includes(" - ")), "el repaso debe mostrar separadores con guion");
assert.ok(elements.recap.children.every((row) => row.children[3]?.className === "recap-impact"),
  "cada respuesta debe explicar su impacto sin repetir una segunda sección");
assert.doesNotMatch(html, /id="reasons"/, "Resultado debe tener un solo resumen, no una lista repetida de razones");

// Cambiar usa la etapa real, no el índice de pantalla: Información empieza en la pantalla 5.
elements.recap.children[2].children[2].dispatch("click");
assert.equal(pantallaVisible(), 4, "Cambiar información debe abrir la primera pantalla de esa etapa");
vm.runInContext("showStep(0)", context);

/* ================= Asistente ================= */

// Mas pantallas que etapas: el cuestionario avanza de pantalla en
// pantalla pero el indicador muestra las siete etapas.
assert.equal(wizardSteps.length, 12, "deberia haber 12 pantallas");
assert.equal(new Set(screens.map((s) => s.section)).size, 7, "deberia haber 7 etapas");
assert.equal(elements.stepper.children.length, 7, "el indicador muestra etapas, no pantallas");
assert.ok(elements.stepper.children.every((node) =>
  node.children.some((child) => child.className === "track-connector")),
"cada etapa debe declarar su conexión direccional");
assert.doesNotMatch(html, /<details\b/, "Resultado no debe depender de desplegables");
assert.match(css, /grid-auto-rows:\s*1fr/, "las funciones deben conservar el mismo alto");
assert.match(css, /\.canvas-inner, \.dock-inner \{ width: min\(var\(--content-w\), 100% - var\(--s12\)\); \}/,
  "todas las pantallas deben compartir el mismo límite de contenido");
assert.doesNotMatch(css, /canvas-inner:has\(\.step\[data-section=\"3\"/,
  "Funciones no debe declarar un límite de ancho diferente");
assert.match(css, /not\(\[data-section=\"3\"\]\)/,
  "Funciones no debe heredar el límite de las pantallas de una sola pregunta");
assert.doesNotMatch(css, /\.track-node::before/, "el progreso nuevo no debe reconstruir un riel");
assert.match(css, /\.track-connector::after/, "el progreso debe indicar dirección con flechas");
assert.equal((html.match(/class="switch-icon"/g) || []).length, 8,
  "cada opción de Funciones debe incluir un icono");
assert.match(js, /const choiceIconNames = \{/,
  "las demás respuestas deben declarar iconos semánticos por opción");
assert.match(css, /input:checked \+ \.choice-body \.choice-icon[\s\S]*?background:\s*var\(--navy\)/,
  "el icono seleccionado debe usar el estado oscuro de Funciones");
assert.match(css, /\.step-head \{[^}]*width:\s*100%;[^}]*max-width:\s*none;/,
  "todos los encabezados deben usar el límite común del contenido");
assert.match(css, /\.track \{[\s\S]*?width:\s*min\(var\(--content-w\), 100% - var\(--s12\)\);/,
  "la pista debe respetar el mismo límite horizontal que las pantallas");
assert.match(html, /id="nimboGuide"/, "el wizard debe incluir al asistente Nimbo");
assert.match(css, /@keyframes route-spark/, "la ruta del progreso debe tener movimiento direccional");
assert.match(css, /@keyframes nimbo-cast/, "Nimbo debe tener una animación de magia");
assert.match(css, /\.step\[data-section="3"\] \.step-head p \{[^}]*white-space:\s*nowrap;/,
  "la explicación de Funciones debe conservar una línea en escritorio");
assert.equal((html.match(/class="spec-item"/g) || []).length, 4,
  "la ficha técnica debe mostrar cada título con su valor debajo");
assert.match(html, /class="panel letter-action-card/, "La carta debe separar las acciones en una tarjeta");
assert.match(html, /class="letter-preview-card"/, "La carta debe tener una tarjeta de vista previa reducida");
assert.match(html, /id="btnNimboTip"/, "Nimbo debe permitir recorrer consejos");
assert.match(css, /@keyframes nimbo-talk/, "Nimbo debe mover la boca al hablar");
assert.match(css, /@keyframes nimbo-point/, "Nimbo debe señalar el control activo");
assert.match(css, /@keyframes nimbo-think/, "Nimbo debe tener una expresión pensativa");
assert.match(css, /@keyframes nimbo-read/, "Nimbo debe revisar el resultado y la carta");
assert.match(css, /@keyframes nimbo-celebrate/, "Nimbo debe celebrar el resultado final");
assert.match(html, /src="\.\/assets\/images\/nimbo-alive\.gif"/,
  "Nimbo debe usar una animación continua en vez de intercambiar capas");
assert.equal((html.match(/class="nimbo-pose /g) || []).length, 0,
  "Nimbo no debe sustituir imágenes de pose en el DOM");
assert.ok(fs.statSync("assets/images/nimbo-alive.gif").size > 500_000,
  "la animación principal debe conservar resolución suficiente");
assert.ok(fs.statSync("assets/images/nimbo-celebrating.gif").size > 250_000,
  "la celebración final debe ser una animación real");
assert.match(js, /const NIMBO_ADVICE_DELAY = 35000;/,
  "los consejos automáticos deben esperar una inactividad prolongada");
assert.equal(elements.scenarioTable.children.length, 3, "la comparación debe presentar tres escenarios compactos");
assert.ok(elements.scenarioTable.children.some((card) => card.className.includes("is-recommended")),
  "la comparación debe destacar la recomendación");

// Arranque: paso 1, sin Atras, sin lectura en vivo
assert.equal(elements.stepCurrent.textContent, 1);
assert.equal(elements.btnPrev.disabled, true);
assert.equal(elements.readout.hidden, true);

// Nimbo no interrumpe al entrar ni al enfocar: solo habla tras espera o clic.
assert.equal(elements.nimboGuide.classList.contains("is-speaking"), false);
assert.equal(elements.nimboTipCount.textContent, "3 consejos disponibles");

// El orden contextual correcto es aplicación (1), proyecto (2), problema (3).
elements.canvas.dispatch("focusin", { target: elements.projectName });
assert.equal(elements.nimboGuide.classList.contains("is-speaking"), false,
  "enfocar un campo no debe abrir el consejo automáticamente");
elements.nimboActor.dispatch("click");
assert.equal(elements.nimboTipCount.textContent, "Consejo 2 de 3");
elements.canvas.dispatch("focusin", { target: elements.projectPurpose });
elements.nimboActor.dispatch("click");
assert.equal(elements.nimboTipCount.textContent, "Consejo 3 de 3");
vm.runInContext("showStep(1)", context);
assert.equal(elements.nimboTipCount.textContent, "3 consejos disponibles",
  "cada pantalla debe preparar su secuencia sin interrumpir al usuario");
vm.runInContext("showStep(0)", context);

// Un obligatorio vacio bloquea el avance y marca el campo
elements.projectName.value = "";
elements.btnNext.dispatch("click");
assert.equal(elements.stepCurrent.textContent, 1, "no debe avanzar con datos faltantes");
assert.equal(elements.projectName.getAttribute("aria-invalid"), "true");
assert.match(elements.stepError.textContent, /Falta/);

// Con los datos completos avanza, aparece la lectura en vivo y se habilita Atras
elements.projectName.value = "Servicios 2026";
elements.btnNext.dispatch("click");
assert.equal(pantallaVisible(), 1);
assert.equal(elements.stepCurrent.textContent, 2);
assert.equal(elements.stepTitle.textContent, "Personas");
assert.equal(elements.btnPrev.disabled, false);
assert.equal(elements.readout.hidden, false);
assert.equal(elements.projectName.getAttribute("aria-invalid"), null);

// Enter avanza de pantalla, pero no desde un area de texto
const enEtapaPersonas = elements.stepper.children.map((c) => c.dataset.state);
elements.canvas.dispatch("keydown", { key: "Enter", target: { tagName: "INPUT" }, preventDefault() {} });
assert.equal(pantallaVisible(), 2);
elements.canvas.dispatch("keydown", { key: "Enter", target: { tagName: "TEXTAREA" }, preventDefault() {} });
assert.equal(pantallaVisible(), 2, "Enter en un area de texto no debe avanzar");

// Las pantallas 1 y 2 son la misma etapa: el indicador no se mueve
assert.deepEqual(elements.stepper.children.map((c) => c.dataset.state), enEtapaPersonas,
  "avanzar dentro de la misma etapa no debe mover el indicador");
assert.equal(elements.stepCurrent.textContent, 2, "la barra cuenta etapas, no pantallas");

// Cambiar de etapa si lo mueve
vm.runInContext("showStep(3)", context);
assert.equal(elements.stepper.children[1].dataset.state, "done");
assert.equal(elements.stepper.children[2].dataset.state, "current");
assert.equal(elements.stepCurrent.textContent, 3);
assert.equal(elements.stepTitle.textContent, "Funciones");
const primerConsejo = elements.nimboMessage.textContent;
elements.nimboActor.dispatch("click");
assert.notEqual(elements.nimboMessage.textContent, primerConsejo,
  "Nimbo debe cambiar de consejo cuando el usuario interactúa con él");
elements.nimboActor.dispatch("click");
elements.nimboActor.dispatch("click");
assert.equal(elements.btnNimboTip.textContent, "Cerrar consejo",
  "el último consejo debe anunciar una salida clara");
elements.nimboActor.dispatch("click");
assert.equal(elements.nimboGuide.dataset.completed, "true",
  "el recorrido de consejos debe terminar, no volver al primero en bucle");
assert.equal(elements.nimboGuide.classList.contains("is-speaking"), false,
  "el diálogo de Nimbo debe poder cerrarse");
assert.equal(wizardSteps[3].classList.contains("nimbo-highlight"), false,
  "Nimbo nunca debe seleccionar el contenedor completo de una pantalla");

// Volver a una etapa recorrida lleva a su PRIMERA pantalla, no a la ultima
vm.runInContext("showStep(2)", context);
elements.stepper.children[1].dispatch("click");
assert.equal(pantallaVisible(), 1, "el nodo de una etapa lleva a su primera pantalla");

// La acción mantiene el mismo nombre y posición durante todo el recorrido.
vm.runInContext("showStep(7)", context);
assert.equal(elements.btnNextLabel.textContent, "Siguiente");
vm.runInContext("showStep(8)", context);
assert.equal(elements.btnNextLabel.textContent, "Siguiente", "Resultado conserva la navegación predecible");
assert.equal(elements.readout.hidden, true, "Resultado reemplaza la lectura del dock");
vm.runInContext("showStep(9)", context);
assert.equal(elements.btnNextLabel.textContent, "Siguiente", "la comparación conserva la misma acción");
vm.runInContext("showStep(10)", context);
assert.equal(elements.btnNextLabel.textContent, "Siguiente", "La carta conserva la misma acción");
vm.runInContext("showStep(11)", context);
// En la ultima pantalla se oculta Siguiente y la lectura en vivo cede al panel
assert.equal(elements.btnNext.hidden, true);
assert.equal(elements.readout.hidden, true);
assert.equal(elements.nimboGuide.dataset.screen, "11",
  "el asistente flotante cede el cierre al personaje integrado en la tarjeta final");
assert.match(elements.nimboFinalRecommendation.textContent, /Recomiendo.*vCPU.*GB RAM.*GB NVMe/i,
  "Nimbo debe cerrar el recorrido recomendando las especificaciones en la tarjeta final");

// showStep no se sale del rango
vm.runInContext("showStep(99)", context);
assert.equal(elements.stepCurrent.textContent, 7);
vm.runInContext("showStep(-5)", context);
assert.equal(elements.stepCurrent.textContent, 1);

/* ================= Perfiles de capacidad ================= */

// El título comunica por sí solo el nivel; no se duplica en una insignia.
assert.doesNotMatch(html, /id="specTag"|class="spec-tag"/,
  "el resultado no debe repetir el nivel en una insignia redundante");
for (const preset of ["small", "institutional", "demanding"]) {
  vm.runInContext(`applyPreset(${JSON.stringify(preset)})`, context);
  assert.match(elements.recommendedTitle.textContent,
    /^Servidor (pequeño|equilibrado|de alta capacidad|de capacidad especial)$/,
    `título inválido para el preset ${preset}: ${elements.recommendedTitle.textContent}`);
}

// Comportamiento fijado a proposito: el perfil "Básico" es hoy INALCANZABLE.
// rawCpu = 1.5 + concurrencyFactor, y concurrencyFactor nunca baja de 1
// (empieza con Math.max(1, ...) y todos los demas factores son >= 1), asi que
// rawCpu >= 2.5 y el redondeo sobre [2, 4, 6, ...] devuelve siempre cpu >= 4.
// La rama cpu >= 4 se cumple siempre. Si algun dia se baja ese piso, esta
// asercion falla y toca actualizarla: es intencional.
vm.runInContext('applyPreset("small")', context);
assert.equal(elements.recommendedTitle.textContent, "Servidor equilibrado",
  "si el perfil Básico ya es alcanzable, actualizar el contrato del perfil mínimo");

vm.runInContext('applyPreset("demanding")', context);
assert.match(elements.recommendedTitle.textContent, /^Servidor (de alta capacidad|de capacidad especial)$/);

/* ================= Presets y reinicio ================= */

vm.runInContext('applyPreset("small")', context);
const small = vm.runInContext("calculate()", context);
assert.equal(small.inputs.totalUsers, 80);
assert.equal(small.inputs.simultaneousUsers, 5);
assert.equal(checkedIn("simultaneousUsers").dataset.label, "Hasta 10 a la vez");

// La navegación segmentada se construye una sola vez.
assert.equal(elements.stepper.children.length, 7, "el indicador debe tener 7 nodos");
// Los estados representan el recorrido actual, no pestañas libres.
assert.deepEqual(
  elements.stepper.children.map((c) => c.dataset.state),
  ["current", "pending", "pending", "pending", "pending", "pending", "pending"]
);
// Pero seguir siendo accesibles: lo ya visitado no se bloquea
assert.equal(elements.stepper.children[5].getAttribute("aria-disabled"), null,
  "una etapa ya visitada debe seguir siendo navegable");

vm.runInContext("resetCalculator()", context);
assert.equal(elements.totalUsers.value, 300);
assert.equal(elements.applicationName.value, "");
assert.equal(elements.stepCurrent.textContent, 1, "reiniciar debe volver al primer paso");
assert.equal(elements.stepper.children.length, 7, "reiniciar no debe duplicar los nodos");
assert.deepEqual(
  elements.stepper.children.map((c) => c.dataset.state),
  ["current", "pending", "pending", "pending", "pending", "pending", "pending"],
  "reiniciar debe volver a bloquear las etapas no visitadas"
);

/* ================= Cierre irreversible ================= */

assert.match(html, /id="btnFinish"[\s\S]*?Finalizar solicitud/,
  "la última pantalla debe ofrecer una acción explícita de cierre");
assert.match(html, /<footer id="wizardDock"[\s\S]*?id="btnPrev"[\s\S]*?id="btnFinish"/,
  "Finalizar solicitud debe permanecer en el dock, junto a Atrás");
assert.match(html, /id="finishDialog"[\s\S]*?no podrás volver a los pasos anteriores/,
  "el cierre irreversible debe explicar su consecuencia antes de ejecutarse");
assert.match(html, /id="completionScreen"[\s\S]*?Solicitud finalizada/,
  "el wizard debe tener un estado terminal inequívoco");

assert.equal(elements.btnFinish.hidden, true, "Finalizar no debe aparecer antes de la última pantalla");
vm.runInContext("showStep(11)", context);
assert.equal(elements.btnFinish.hidden, false, "Finalizar debe sustituir a Siguiente en la última pantalla");
assert.equal(elements.btnNext.hidden, true, "Siguiente no debe competir con la acción final");
elements.btnFinish.dispatch("click");
assert.equal(elements.finishDialog.open, true, "Finalizar debe pedir confirmación");
assert.equal(vm.runInContext("wizardCompleted", context), false,
  "abrir la confirmación todavía no debe cerrar el formulario");
elements.btnCancelFinish.dispatch("click");
assert.equal(elements.finishDialog.open, false, "Seguir revisando debe cerrar la confirmación");

elements.btnFinish.dispatch("click");
elements.btnConfirmFinish.dispatch("click");
assert.equal(vm.runInContext("wizardCompleted", context), true);
assert.equal(elements.completionScreen.hidden, false, "el cierre debe mostrar el estado final");
assert.equal(elements.canvasInner.getAttribute("inert"), "",
  "el formulario terminado debe quedar fuera de interacción");
assert.equal(elements.canvasInner.getAttribute("aria-hidden"), "true");
assert.equal(elements.wizardDock.hidden, true, "el cierre debe retirar la navegación Atrás/Siguiente");
assert.equal(elements.stepper.hidden, true, "el cierre debe retirar los destinos anteriores");
assert.equal(elements.btnReset.hidden, true, "Reiniciar no debe modificar un cálculo ya cerrado");
assert.equal(elements.completionConfig.textContent.includes("vCPU"), true,
  "el estado final debe conservar la recomendación visible");
assert.equal(documentStub.body.classList.contains("is-complete"), true);

const finalStepBefore = pantallaVisible();
vm.runInContext("showStep(0)", context);
vm.runInContext("resetCalculator()", context);
assert.equal(pantallaVisible(), finalStepBefore,
  "un cálculo finalizado no debe volver a habilitar pasos ni respuestas");
elements.btnReload.dispatch("click");
assert.equal(context.window.location.reloadCalled, 1,
  "la única forma de comenzar otro cálculo debe ser recargar la aplicación");

console.log("Smoke test passed: calculo, carta, controles de eleccion, contadores, repaso y asistente.");
