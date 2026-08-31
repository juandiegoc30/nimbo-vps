const $ = (id) => document.getElementById(id);

const infrastructureDefaults = {
  totalUsers: 300,
  simultaneousUsers: 15,
  usageIntensity: 1.25,
  dataVolume: 5,
  fileVolume: 50,
  fileWeight: 1,
  retentionYears: 5,
  growthLevel: 1.25,
  headroom: 1.2,
  availability: 1.15,
  backupFrequency: 1.1
};

const projectDefaults = {
  applicationName: "",
  projectName: "",
  projectPurpose: "",
  recipientName: "",
  recipientRole: "Área de Infraestructura Tecnológica",
  requesterName: ""
};

const featureDefaults = {
  featureAuth: true,
  featureCrud: true,
  featureReports: true,
  featureFiles: true,
  featurePdf: true,
  featureNotifications: false,
  featureApi: false,
  featureBackground: false
};

const presets = {
  small: {
    totalUsers: 80, simultaneousUsers: 5, usageIntensity: 1,
    dataVolume: 2, fileVolume: 20, fileWeight: 1, retentionYears: 3,
    growthLevel: 1.1, headroom: 1, availability: 1, backupFrequency: 1
  },
  institutional: infrastructureDefaults,
  demanding: {
    totalUsers: 2000, simultaneousUsers: 80, usageIntensity: 1.6,
    dataVolume: 40, fileVolume: 120, fileWeight: 1.3, retentionYears: 8,
    growthLevel: 1.5, headroom: 1.4, availability: 1.3, backupFrequency: 1.2
  }
};

const featureIds = Object.keys(featureDefaults);
const calculatorIds = [...Object.keys(infrastructureDefaults), ...featureIds];
const projectIds = Object.keys(projectDefaults);
let latestRecommendation = { cpu: 4, ram: 8, storage: 200 };

function numericValue(id) {
  const element = $(id);
  const value = Number(element.value);
  const minimum = Number(element.min || 0);
  return Number.isFinite(value) ? Math.max(minimum, value) : minimum;
}

function isChecked(id) {
  return $(id).checked;
}

function textValue(id) {
  return $(id).value.trim();
}

function roundTo(value, options) {
  for (const option of options) {
    if (value <= option) return option;
  }
  const last = options[options.length - 1];
  return Math.ceil(value / last) * last;
}

function safeSentence(value) {
  if (!value) return value;
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function getFeatures() {
  return {
    auth: isChecked("featureAuth"),
    crud: isChecked("featureCrud"),
    reports: isChecked("featureReports"),
    files: isChecked("featureFiles"),
    pdf: isChecked("featurePdf"),
    notifications: isChecked("featureNotifications"),
    api: isChecked("featureApi"),
    background: isChecked("featureBackground")
  };
}

function getProject() {
  return {
    applicationName: textValue("applicationName"),
    projectName: textValue("projectName"),
    purpose: textValue("projectPurpose"),
    recipientName: textValue("recipientName"),
    recipientRole: textValue("recipientRole"),
    requesterName: textValue("requesterName")
  };
}

function updateProjectState(project) {
  const required = [project.applicationName, project.projectName, project.purpose];
  const completeCount = required.filter(Boolean).length;
  const complete = completeCount === required.length;

  $("projectCount").textContent = `${completeCount} de 3 datos`;
  $("requestStatus").textContent = complete ? "Solicitud lista" : "Faltan datos del proyecto";
  $("requestStatus").className = `badge ${complete ? "badge-ok" : "badge-wait"}`;
  $("purposeCount").textContent = `${$("projectPurpose").value.length} / 360`;
}

function renderScenarios(scenarios) {
  const grid = $("scenarioTable");
  grid.replaceChildren();

  const descriptions = {
    "Mínimo funcional": "Menor costo, con poco margen para picos o crecimiento.",
    Recomendado: "Equilibra la carga actual, la continuidad y el margen previsto.",
    "Con crecimiento": "Reserva capacidad para incorporar usuarios o procesos pronto."
  };

  scenarios.forEach((scenario) => {
    const card = document.createElement("article");
    card.className = `scenario-card${scenario.name === "Recomendado" ? " is-recommended" : ""}`;
    card.setAttribute("role", "listitem");

    const head = document.createElement("div");
    head.className = "scenario-head";
    const title = document.createElement("h3");
    title.textContent = scenario.name;
    head.appendChild(title);
    if (scenario.name === "Recomendado") {
      const badge = document.createElement("span");
      badge.className = "scenario-badge";
      badge.textContent = "Elección de Nimbo";
      head.appendChild(badge);
    }

    const note = document.createElement("p");
    note.textContent = descriptions[scenario.name];

    const metrics = document.createElement("dl");
    metrics.className = "scenario-metrics";
    [
      ["CPU", `${Math.round(scenario.cpu)} vCPU`],
      ["RAM", `${Math.round(scenario.ram)} GB`],
      ["Disco", `${Math.round(scenario.storage)} GB`]
    ].forEach(([term, value]) => {
      const metric = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = term;
      dd.textContent = value;
      metric.append(dt, dd);
      metrics.appendChild(metric);
    });

    card.append(head, note, metrics);
    grid.appendChild(card);
  });
}

function buildSpecification({ project, cpu, ram, storage, bandwidth, backupText }) {
  const application = project.applicationName || "[nombre de la aplicación]";
  const projectName = project.projectName || "[nombre del proyecto]";
  const purpose = safeSentence(project.purpose) || "[propósito del proyecto].";
  const recipientBlock = [project.recipientName, project.recipientRole].filter(Boolean).join("\n");
  const signature = project.requesterName ? `\n${project.requesterName}` : "";

  return `Asunto: Solicitud de VPS para despliegue de ${application}

${recipientBlock ? `${recipientBlock}\n\n` : ""}Cordial saludo.

Por medio de la presente solicito la asignación de un servidor VPS para el alojamiento de la aplicación institucional “${application}”, correspondiente al proyecto “${projectName}”, cuya finalidad es ${purpose}

En razón de lo anterior, el servidor deberá contar con las siguientes especificaciones técnicas:

- ${cpu} vCPU.
- ${ram} GB de memoria RAM.
- ${storage} GB de almacenamiento NVMe o SSD de alto rendimiento.
- Mínimo ${bandwidth} TB de transferencia mensual o política institucional equivalente.
- Una dirección IPv4 pública estática.
- Ubuntu Server 22.04 LTS.
- Acceso administrativo mediante SSH.
- PostgreSQL y compatibilidad con Nginx.
- Certificado TLS/HTTPS y firewall.
- ${backupText}, almacenados fuera del mismo VPS.
- Monitoreo básico de CPU, RAM, almacenamiento y disponibilidad.

La configuración propuesta contempla la operación de la aplicación, la base de datos y los servicios relacionados en un único servidor, con un margen razonable para crecimiento y estabilidad.

Agradezco la atención prestada y quedo atento a la asignación del recurso.

Cordialmente,${signature}`;
}

function calculate() {
  const project = getProject();
  const totalUsers = numericValue("totalUsers");
  const simultaneousUsers = numericValue("simultaneousUsers");
  const usageIntensity = numericValue("usageIntensity");
  const dataVolume = numericValue("dataVolume");
  const fileVolume = numericValue("fileVolume");
  const fileWeight = numericValue("fileWeight");
  const retentionYears = numericValue("retentionYears");
  const growthLevel = numericValue("growthLevel");
  const headroom = numericValue("headroom");
  const availability = numericValue("availability");
  const backupFrequency = numericValue("backupFrequency");
  const features = getFeatures();

  let featureWeight = 1;
  if (features.auth) featureWeight += 0.05;
  if (features.crud) featureWeight += 0.10;
  if (features.reports) featureWeight += 0.20;
  if (features.files) featureWeight += 0.10;
  if (features.pdf) featureWeight += 0.15;
  if (features.notifications) featureWeight += 0.08;
  if (features.api) featureWeight += 0.12;
  if (features.background) featureWeight += 0.18;

  const concurrencyFactor = Math.max(1, simultaneousUsers / 10) * usageIntensity * featureWeight * headroom * availability;
  let rawCpu = 1.5 + concurrencyFactor;
  if (simultaneousUsers >= 25) rawCpu += 1;
  if (simultaneousUsers >= 50) rawCpu += 2;
  if (features.reports && features.pdf) rawCpu += 0.5;
  if (features.background) rawCpu += 0.5;
  const cpu = roundTo(rawCpu, [2, 4, 6, 8, 12, 16]);

  let rawRam = 2.5 + simultaneousUsers * 0.09 + featureWeight * 0.7 + Math.min(4, dataVolume * 0.08);
  if (features.reports) rawRam += 0.75;
  if (features.pdf) rawRam += 0.5;
  if (features.background) rawRam += 0.75;
  if (features.api) rawRam += 0.5;
  rawRam *= headroom;
  const ram = roundTo(rawRam, [4, 8, 12, 16, 24, 32, 48, 64]);

  const projectionPeriod = Math.max(1, retentionYears) / 2;
  const projectedFiles = fileVolume * fileWeight * Math.pow(growthLevel, projectionPeriod);
  const projectedData = dataVolume * Math.pow(growthLevel, projectionPeriod);
  let rawStorage = 40 + projectedFiles + projectedData;
  if (features.files) rawStorage *= 1.08;
  if (features.pdf) rawStorage *= 1.05;
  rawStorage *= 1.3 * headroom;
  const storage = roundTo(rawStorage, [60, 80, 100, 120, 160, 200, 250, 320, 500, 750, 1000, 1500, 2000]);

  let bandwidth = 1;
  if (totalUsers > 500 || fileVolume >= 120 || usageIntensity >= 1.6) bandwidth = 2;
  if (totalUsers > 1500 || fileVolume >= 300) bandwidth = 3;

  // Perfil de capacidad. El título ya comunica el nivel; no se repite
  // en una insignia decorativa.
  let profile = "Básico";
  let title = "Servidor pequeño";
  let recommendation = "Suficiente para un proyecto acotado, con poca gente a la vez y operaciones sencillas.";
  if (cpu >= 4 || ram >= 8) {
    profile = "Medio";
    title = "Servidor equilibrado";
    recommendation = "El punto medio habitual: base de datos, archivos y reportes en un solo servidor, con margen para crecer.";
  }
  if (cpu >= 8 || ram >= 16 || storage >= 500) {
    profile = "Alto";
    title = "Servidor de alta capacidad";
    recommendation = "La cantidad de gente conectada, las funciones y el almacenamiento piden un margen operativo superior.";
  }
  if (cpu >= 16 || ram >= 32) {
    profile = "Especial";
    title = "Servidor de capacidad especial";
    recommendation = "Este escenario conviene validarlo con el área técnica y pruebas de carga antes de ponerlo en producción.";
  }

  $("cpuResult").textContent = cpu;
  $("ramResult").textContent = ram;
  $("storageResult").textContent = storage;
  $("bandwidthResult").textContent = bandwidth;
  $("recommendedTitle").textContent = title;
  $("recommendationText").textContent = recommendation;
  $("shortRequest").textContent = `VPS con ${cpu} vCPU, ${ram} GB RAM y ${storage} GB NVMe.`;
  latestRecommendation = { cpu, ram, storage };

  // Lectura en vivo del dock: el resultado responde mientras se contesta
  $("liveCpu").textContent = cpu;
  $("liveRam").textContent = ram;
  $("liveDisk").textContent = storage;

  $("usersWarning").hidden = simultaneousUsers <= totalUsers;
  syncChoices();
  renderRecap();

  const scenarios = [
    { name: "Mínimo funcional", cpu: Math.max(2, cpu === 2 ? 2 : cpu / 2), ram: Math.max(4, ram === 4 ? 4 : ram / 2), storage: roundTo(Math.max(60, storage * 0.7), [60, 80, 100, 120, 160, 200, 250, 320, 500, 750, 1000]) },
    { name: "Recomendado", cpu, ram, storage },
    { name: "Con crecimiento", cpu: roundTo(cpu * 1.5, [2, 4, 6, 8, 12, 16, 24, 32]), ram: roundTo(ram * 1.5, [4, 8, 12, 16, 24, 32, 48, 64]), storage: roundTo(storage * growthLevel, [80, 100, 120, 160, 200, 250, 320, 500, 750, 1000, 1500, 2000]) }
  ];
  renderScenarios(scenarios);

  const backupText = backupFrequency >= 1.2
    ? "Respaldos externos varias veces al día"
    : backupFrequency >= 1.1
      ? "Respaldos externos diarios"
      : "Respaldos externos semanales";

  const specification = buildSpecification({ project, cpu, ram, storage, bandwidth, backupText });
  $("specification").textContent = specification;
  const application = project.applicationName || "[nombre de la aplicación]";
  const projectName = project.projectName || "[nombre del proyecto]";
  const purpose = safeSentence(project.purpose) || "[propósito del proyecto].";
  const recipientName = project.recipientName || project.recipientRole || "Área de Infraestructura Tecnológica";
  $("printDocumentSubject").textContent = `${application} — Proyecto ${projectName}`;
  $("printRecipientName").textContent = recipientName;
  $("printRecipientRole").textContent = project.recipientName ? project.recipientRole : "";
  $("printRequestText").textContent = `Solicito la asignación de un servidor VPS para alojar la aplicación institucional “${application}”, correspondiente al proyecto “${projectName}”, cuya finalidad es ${purpose}`;
  $("printRecommendationTitle").textContent = title;
  $("printCpu").textContent = cpu;
  $("printRam").textContent = ram;
  $("printStorage").textContent = storage;
  $("printBandwidth").textContent = bandwidth;
  $("printBackup").textContent = `${backupText}, almacenados fuera del mismo VPS.`;
  $("printRequester").textContent = project.requesterName || "Área solicitante";
  updateProjectState(project);

  return {
    project,
    inputs: { totalUsers, simultaneousUsers, usageIntensity, dataVolume, fileVolume, fileWeight, retentionYears, growthLevel, headroom, availability, backupFrequency, features },
    recommendation: { profile, cpu, ram, storage, bandwidth, operatingSystem: "Ubuntu Server 22.04 LTS", database: "PostgreSQL", publicIp: "1 IPv4 fija", backup: backupText },
    specification
  };
}

function setFeedback(message, target = "completionFeedback") {
  $(target).textContent = message;
  window.clearTimeout(setFeedback.timeout);
  setFeedback.timeout = window.setTimeout(() => { $(target).textContent = ""; }, 2600);
}

function applyPreset(name) {
  const preset = presets[name];
  if (!preset) return;
  Object.entries(preset).forEach(([id, value]) => { $(id).value = value; });
  calculate();
}

function resetCalculator() {
  if (wizardCompleted) return;
  Object.entries(infrastructureDefaults).forEach(([id, value]) => { $(id).value = value; });
  Object.entries(projectDefaults).forEach(([id, value]) => { $(id).value = value; });
  Object.entries(featureDefaults).forEach(([id, value]) => { $(id).checked = value; });
  furthestStep = 0;
  calculate();
  if (steps.length) showStep(0);
  $("applicationName").focus();
}

async function copySpecification(feedbackTarget = "completionFeedback") {
  const text = $("specification").textContent;
  try {
    await navigator.clipboard.writeText(text);
    setFeedback("Carta copiada al portapapeles.", feedbackTarget);
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents($("specification"));
    selection.removeAllRanges();
    selection.addRange(range);
    setFeedback("Texto seleccionado. Usa Ctrl/Cmd + C para copiar.", feedbackTarget);
  }
}

/* ==========================================================
   CONTROLES DE ELECCIÓN
   Cada grupo [data-choice="x"] escribe en el campo #x. Los
   radios llevan un valor representativo y, opcionalmente,
   la banda [data-min, data-max] que representan, para que
   escribir una cifra exacta siga marcando la tarjeta correcta.
   ========================================================== */

const choiceGroups = [...document.querySelectorAll("[data-choice]")];

// Una opción, un símbolo. Repetir el mismo pictograma en todas las
// respuestas no ayuda a reconocerlas; esta matriz mantiene una familia
// lineal coherente y asigna una metáfora concreta a cada alternativa.
const choiceIconNames = {
  totalUsers: ["user", "users", "building", "building-bank"],
  simultaneousUsers: ["user-check", "users-group", "users", "speakerphone"],
  usageIntensity: ["moon", "sun", "briefcase", "activity"],
  dataVolume: ["file-spreadsheet", "database", "layers-intersect", "server"],
  fileVolume: ["file-off", "paperclip", "files", "archive"],
  fileWeight: ["file-text", "photo", "scan", "video"],
  retentionYears: ["calendar", "calendar-time", "archive", "library"],
  growthLevel: ["minus", "trending-up", "git-branch", "arrows-maximize"],
  availability: ["coffee", "clock", "alarm"],
  backupFrequency: ["calendar-week", "calendar-check", "refresh"],
  headroom: ["battery-1", "battery-2", "battery-4"]
};

function decorateChoiceIcons() {
  if (typeof document.createElement !== "function") return;
  choiceGroups.forEach((group) => {
    const names = choiceIconNames[group.dataset.choice] || [];
    group.querySelectorAll("input[type=radio]").forEach((radio, index) => {
      const body = radio.nextElementSibling;
      const iconName = names[index];
      if (!body || !iconName || body.querySelector(".choice-icon")) return;
      const icon = document.createElement("span");
      icon.className = "choice-icon";
      icon.setAttribute("aria-hidden", "true");
      const glyph = document.createElement("i");
      glyph.className = `ti ti-${iconName}`;
      icon.appendChild(glyph);
      body.insertBefore(icon, body.firstChild);
    });
  });
}

function syncChoices() {
  choiceGroups.forEach((group) => {
    const current = Number($(group.dataset.choice).value);
    group.querySelectorAll("input[type=radio]").forEach((radio) => {
      const min = Number(radio.dataset.min ?? radio.value);
      const max = Number(radio.dataset.max ?? radio.value);
      radio.checked = current >= min && current <= max;
    });
  });
}

function choiceLabel(id) {
  const group = choiceGroups.find((item) => item.dataset.choice === id);
  const selected = group && group.querySelector("input:checked");
  return selected ? selected.dataset.label : "Sin definir";
}

function countFeatures() {
  return featureIds.filter((id) => $(id).checked).length;
}

/* ==========================================================
   REPASO DE RESPUESTAS
   Deja verificar sin releer los cinco pasos y volver a
   cualquiera de ellos con un clic.
   ========================================================== */

const recapRows = [
  {
    section: "2", term: "Personas",
    value: () => `${$("totalUsers").value} cuentas - ${$("simultaneousUsers").value} simultáneas - ${choiceLabel("usageIntensity")}`,
    impact: () => "La simultaneidad define CPU y memoria."
  },
  {
    section: "3", term: "Funciones activas",
    value: () => `${countFeatures()} de ${featureIds.length}`,
    impact: () => "Reportes, PDF y archivos suman recursos."
  },
  {
    section: "4", term: "Información",
    value: () => `${choiceLabel("dataVolume")} - ${choiceLabel("fileVolume")} - ${choiceLabel("fileWeight")} - ${choiceLabel("retentionYears")}`,
    impact: () => "Volumen y conservación definen el disco."
  },
  {
    section: "5", term: "Continuidad",
    value: () => `${choiceLabel("growthLevel")} - ${choiceLabel("availability")} - ${choiceLabel("backupFrequency")}`,
    impact: () => "Crecimiento y respaldo definen el margen."
  }
];

function renderRecap() {
  const list = $("recap");
  list.replaceChildren();

  recapRows.forEach((row) => {
    const wrapper = document.createElement("div");
    wrapper.className = "recap-row";

    const term = document.createElement("dt");
    term.textContent = row.term;

    const value = document.createElement("dd");
    value.textContent = row.value();

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "recap-edit";
    edit.textContent = "Cambiar";
    edit.setAttribute("aria-label", `Cambiar ${row.term.toLowerCase()}, ir a la etapa ${row.section}`);
    edit.addEventListener("click", () => showStep(steps.findIndex((step) => step.dataset.section === row.section)));

    const impact = document.createElement("p");
    impact.className = "recap-impact";
    impact.textContent = row.impact();

    wrapper.append(term, value, edit, impact);
    list.appendChild(wrapper);
  });
}

/* ==========================================================
   NAVEGACIÓN POR PASOS
   ========================================================== */

const steps = [...document.querySelectorAll(".step")];
const lastStep = steps.length - 1;
let currentStep = 0;
let furthestStep = 0;
let wizardCompleted = false;

/* Indicador de proceso. Hay mas pantallas que secciones: el
   cuestionario avanza de pantalla en pantalla, pero el indicador
   muestra las siete etapas para que el recorrido se lea como un
   proceso y no como una pila de formularios. */
const sections = [...new Set(steps.map((step) => step.dataset.section))];
const sectionOf = (index) => sections.indexOf(steps[index].dataset.section);
const trackNodes = [];
let nimboTipIndex = 0;
let nimboHighlightTarget = null;
let nimboSpeechTimer = null;
let nimboPoseTimer = null;
let nimboHighlightTimer = null;
let nimboAdviceTimer = null;
let nimboAmbientTimer = null;
let nimboSideTimer = null;
let nimboTravelTimer = null;
let nimboSequenceTimers = [];
let nimboLastTarget = null;
let nimboLastStep = -1;
let nimboAmbientIndex = 0;
let nimboMotionPaused = false;
let nimboIdleAdviceShown = false;
let nimboFramesReady = false;
let nimboPendingPose = "guide";
let nimboPoseAnimation = null;

const NIMBO_ADVICE_DELAY = 35000;
const NIMBO_AMBIENT_DELAY = 9000;
const NIMBO_SIDE_DELAY = 65000;

function buildTrack() {
  const track = $("stepper");
  if (!track) return;

  sections.forEach((id, index) => {
    const title = steps.find((step) => step.dataset.section === id).dataset.title;
    const node = document.createElement("button");
    node.type = "button";
    node.className = "track-node";
    node.setAttribute("aria-label", `Etapa ${index + 1} de ${sections.length}: ${title}`);

    const dot = document.createElement("span");
    dot.className = "track-dot";
    dot.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "track-label";
    label.textContent = title;

    const connector = document.createElement("span");
    connector.className = "track-connector";
    connector.setAttribute("aria-hidden", "true");

    node.append(dot, label, connector);
    // Volver a una etapa ya recorrida lleva a su primera pantalla
    node.addEventListener("click", () => {
      if (index > sectionOf(furthestStep)) return;
      showStep(steps.findIndex((step) => step.dataset.section === id));
    });

    trackNodes.push(node);
    track.appendChild(node);
  });
}

function syncTrack() {
  const active = sectionOf(currentStep);
  const reached = sectionOf(furthestStep);

  trackNodes.forEach((node, index) => {
    node.dataset.state = index === active ? "current" : index < active ? "done" : "pending";
    if (index === active) node.setAttribute("aria-current", "step");
    else node.removeAttribute("aria-current");
    if (index <= reached) node.removeAttribute("aria-disabled");
    else node.setAttribute("aria-disabled", "true");
  });

}

function openFinishDialog() {
  if (wizardCompleted) return;
  const dialog = $("finishDialog");
  calculate();
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeFinishDialog() {
  const dialog = $("finishDialog");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function completeWizard() {
  if (wizardCompleted) return;
  const result = calculate();
  wizardCompleted = true;

  closeFinishDialog();
  stopNimboAutomaticTimers();
  clearNimboSequence();
  dismissNimbo(true);

  document.querySelectorAll("#canvasInner input, #canvasInner textarea, #canvasInner select, #canvasInner button")
    .forEach((control) => { control.disabled = true; });
  $("canvasInner").setAttribute("inert", "");
  $("canvasInner").setAttribute("aria-hidden", "true");

  trackNodes.forEach((node) => {
    node.disabled = true;
    node.setAttribute("aria-disabled", "true");
  });
  $("stepper").hidden = true;
  $("wizardDock").hidden = true;
  $("nimboGuide").hidden = true;
  $("btnReset").hidden = true;
  $("progressFill").style.transform = "scaleX(1)";
  $("barProgress").hidden = true;

  $("completionProject").textContent = result.project.applicationName || result.project.projectName || "Proyecto sin nombre";
  $("completionConfig").textContent = `${result.recommendation.cpu} vCPU - ${result.recommendation.ram} GB RAM - ${result.recommendation.storage} GB NVMe`;
  $("completionScreen").hidden = false;
  document.body.classList.add("is-complete");
  document.title = "Solicitud finalizada - Nimbo VPS";
  $("canvas").scrollTop = 0;
  $("completionTitle").focus({ preventScroll: true });
}

function nimboTips() {
  return [
    [
      "Usa el nombre con el que otras áreas reconocen la aplicación.",
      "El proyecto puede ser más amplio que la aplicación que estás dimensionando.",
      "Describe el problema, no la solución técnica. Una o dos frases son suficientes."
    ],
    [
      "La cantidad conectada al mismo tiempo pesa más que el total de cuentas.",
      "Piensa en el momento más ocupado del día, no en el promedio.",
      "Si no conoces la cifra exacta, elige el rango más cercano."
    ],
    [
      "Elige el ritmo habitual, no un día excepcional.",
      "“Sin parar” conviene solo si la aplicación sostiene la operación principal.",
      "La frecuencia ajusta el margen de CPU y memoria."
    ],
    [
      "Activa solo las funciones que realmente tendrá la primera versión.",
      "Reportes, PDFs y procesos automáticos consumen más procesamiento.",
      "Las conexiones externas necesitan margen para intercambiar datos con otros sistemas."
    ],
    [
      "Una aproximación honesta es mejor que una cifra precisa inventada.",
      "Los registros suelen pesar poco; los adjuntos son los que hacen crecer el disco.",
      "Puedes volver y cambiar esta respuesta desde el resumen."
    ],
    [
      "Videos, planos y escaneos de alta resolución cambian mucho el almacenamiento.",
      "La conservación multiplica el espacio que necesitarás con el tiempo.",
      "Si existe una norma de archivo, úsala como referencia."
    ],
    [
      "El margen evita solicitar una ampliación apenas entre el sistema en operación.",
      "Elige crecimiento rápido solo si ya hay usuarios o procesos próximos a incorporarse.",
      "El cálculo proyecta archivos y registros durante el periodo de conservación."
    ],
    [
      "Más disponibilidad requiere más margen operativo.",
      "Un respaldo diario suele ser el punto de partida más equilibrado.",
      "Los respaldos deben quedar fuera del mismo VPS."
    ],
    [
      `Mi recomendación es ${latestRecommendation.cpu} vCPU, ${latestRecommendation.ram} GB RAM y ${latestRecommendation.storage} GB NVMe.`,
      "Cada bloque resume una respuesta y explica cómo influyó en el cálculo.",
      "Si algo no representa tu escenario, usa “Cambiar” antes de continuar."
    ],
    [
      "El mínimo reduce costo, pero deja menos margen ante picos.",
      "La opción recomendada equilibra carga actual, continuidad y crecimiento.",
      "El escenario con crecimiento evita ampliar recursos en el corto plazo."
    ],
    [
      "Completa solo los nombres necesarios; la configuración técnica ya está incluida.",
      "Puedes dejar el cargo institucional propuesto o reemplazarlo.",
      "Al finalizar, la carta quedará bloqueada y podrás copiarla o guardarla como PDF."
    ]
  ];
}

const nimboTargetSelectors = [
  ["#applicationName", "#projectName", "#projectPurpose"],
  ['[data-choice="simultaneousUsers"] .choice:nth-child(2)', "#simultaneousUsers", '[data-choice="totalUsers"] .choice:nth-child(2)'],
  ['[data-choice="usageIntensity"] .choice:nth-child(2)', '[data-choice="usageIntensity"] .choice:nth-child(4)', '[data-choice="usageIntensity"] .choice:nth-child(3)'],
  ["#featureAuth", "#featureReports", "#featureApi"],
  ['[data-choice="dataVolume"] .choice:nth-child(2)', '[data-choice="fileVolume"] .choice:nth-child(3)', '[data-choice="fileVolume"] .choice:nth-child(2)'],
  ['[data-choice="fileWeight"] .choice:nth-child(1)', '[data-choice="retentionYears"] .choice:nth-child(3)', '[data-choice="retentionYears"] .choice:nth-child(4)'],
  ['[data-choice="headroom"] .choice:nth-child(2)', '[data-choice="growthLevel"] .choice:nth-child(3)', '[data-choice="growthLevel"] .choice:nth-child(2)'],
  ['[data-choice="availability"] .choice:nth-child(2)', '[data-choice="backupFrequency"] .choice:nth-child(2)', '[data-choice="backupFrequency"] .choice:nth-child(3)'],
  [".spec-metrics div:first-child", ".recap-row:nth-child(1)", ".recap-row:nth-child(3)"],
  [".scenario-card:nth-child(1)", ".scenario-card.is-recommended", ".scenario-card:nth-child(3)"],
  ["#recipientName", "#recipientRole", "#requesterName"]
];

// Las poses comunican intención: señalar = acción, pensar = decisión,
// leer = revisión y celebrar = cierre. Así Nimbo responde al contexto
// en vez de limitarse a alternar dos imágenes sin significado.
const nimboPoseByStep = [
  ["pointing", "thinking", "guide"],
  ["pointing", "thinking", "casting"],
  ["pointing", "thinking", "casting"],
  ["pointing", "casting", "thinking"],
  ["pointing", "thinking", "guide"],
  ["pointing", "reading", "thinking"],
  ["thinking", "pointing", "casting"],
  ["thinking", "pointing", "reading"],
  ["reading", "thinking", "casting"],
  ["thinking", "reading", "casting"],
  ["pointing", "thinking", "reading"]
];

function nimboTarget(index = nimboTipIndex) {
  if (typeof document.querySelector !== "function") return null;
  const selector = nimboTargetSelectors[currentStep]?.[index];
  return selector ? document.querySelector(selector) : null;
}

function visualTarget(element) {
  if (!element) return null;
  if (typeof element.closest !== "function") return element.classList ? element : null;
  if (typeof element.matches === "function" && element.matches("input[type=radio], input[type=checkbox]")) {
    return element.closest(".choice, .switch") || null;
  }
  if (typeof element.matches === "function" && element.matches("input, textarea, select")) {
    return element;
  }
  return element.closest(".choice, .switch, .field, .stepper-input, .recap-row, .scenario-card, .spec-metrics div, .spec-item") ||
    (element.classList ? element : null);
}

function nimboIndexForTarget(element) {
  const selectors = nimboTargetSelectors[currentStep] || [];
  const target = visualTarget(element);
  if (typeof document.querySelector !== "function") {
    return Math.min(nimboTipIndex + 1, Math.max(0, nimboTips()[currentStep].length - 1));
  }
  const exactIndex = selectors.findIndex((selector) => {
    const candidate = document.querySelector(selector);
    if (!candidate || !target) return false;
    return candidate === element || candidate === target ||
      (typeof candidate.contains === "function" && candidate.contains(element)) ||
      (typeof target.contains === "function" && target.contains(candidate));
  });
  if (exactIndex >= 0) return exactIndex;
  return Math.min(nimboTipIndex + 1, Math.max(0, nimboTips()[currentStep].length - 1));
}

function setNimboPose(pose, force = false) {
  const guide = $("nimboGuide");
  if (!guide) return;
  const nextPose = pose || "guide";
  nimboPendingPose = nextPose;
  if (!nimboFramesReady && !force) return;
  if (guide.dataset.pose === nextPose) return;

  guide.dataset.pose = nextPose;
  guide.classList.toggle("is-casting", nextPose === "casting");

  // El personaje vive dentro de un único GIF continuo. Los estados solo
  // modifican su gesto corporal con transformaciones; nunca se sustituye
  // el recurso visual ni existe un fotograma vacío entre poses.
  const character = guide.querySelector?.(".nimbo-character");
  const inBetween = /^(guide|blink-half|blink-closed|talking)$/.test(nextPose);
  if (!inBetween && character?.animate && !reduceNimboMotion()) {
    nimboPoseAnimation?.cancel();
    nimboPoseAnimation = character.animate([
      { transform: "translateY(0) rotate(0) scale(1)" },
      { transform: "translateY(2px) rotate(-0.7deg) scale(1.018, 0.982)" },
      { transform: "translateY(-2px) rotate(0.5deg) scale(0.992, 1.008)" },
      { transform: "translateY(0) rotate(0) scale(1)" }
    ], { duration: 190, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
  }
}

function prepareNimboFrames() {
  const frames = [...document.querySelectorAll(".nimbo-animation, .nimbo-card-animation")];
  if (!frames.length) {
    nimboFramesReady = true;
    return;
  }

  const decoded = frames.map((frame) => {
    if (typeof frame.decode !== "function") return Promise.resolve();
    return frame.decode().catch(() => undefined);
  });
  Promise.all(decoded).then(() => {
    nimboFramesReady = true;
    $("nimboGuide").dataset.framesReady = "true";
    setNimboPose(nimboPendingPose, true);
  });
}

function scheduleNimbo(callback, delay) {
  const timer = window.setTimeout(callback, delay);
  if (timer && typeof timer.unref === "function") timer.unref();
  return timer;
}

function clearNimboSequence() {
  nimboSequenceTimers.forEach((timer) => window.clearTimeout(timer));
  nimboSequenceTimers = [];
}

function reduceNimboMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

function nimboCanAutoplay() {
  return !nimboMotionPaused && !reduceNimboMotion() && !document.hidden;
}

function stopNimboAutomaticTimers() {
  [nimboAdviceTimer, nimboAmbientTimer, nimboSideTimer, nimboTravelTimer].forEach((timer) => {
    if (timer) window.clearTimeout(timer);
  });
  nimboAdviceTimer = nimboAmbientTimer = nimboSideTimer = nimboTravelTimer = null;
}

const nimboAmbientSequences = [
  { frames: ["blink-half", "blink-closed", "blink-half", "guide"], delays: [90, 100, 90, 140] },
  { frames: ["wave-low", "wave-high", "wave-low", "guide"], delays: [260, 300, 240, 160] },
  { frames: ["curious", "guide"], delays: [1300, 160] },
  { frames: ["surprised", "guide"], delays: [900, 160] },
  { frames: ["proud", "guide"], delays: [1050, 160] },
  { frames: ["thinking", "guide"], delays: [1400, 160] }
];

function playNimboSequence(frames, delays, returnPose = "guide", resumeAmbient = true) {
  if (!nimboCanAutoplay() || !frames.length) return;
  clearNimboSequence();

  const advance = (index) => {
    if (!nimboCanAutoplay()) {
      setNimboPose(returnPose);
      return;
    }
    if (index >= frames.length) {
      setNimboPose(returnPose);
      if (resumeAmbient) scheduleNimboAmbient();
      return;
    }
    setNimboPose(frames[index]);
    nimboSequenceTimers.push(scheduleNimbo(() => advance(index + 1), delays[index] || 160));
  };

  advance(0);
}

function scheduleNimboAmbient(delay = NIMBO_AMBIENT_DELAY) {
  if (!nimboCanAutoplay()) return;
  if (nimboAmbientTimer) window.clearTimeout(nimboAmbientTimer);
  nimboAmbientTimer = scheduleNimbo(() => {
    nimboAmbientTimer = null;
    if ($("nimboGuide").classList.contains("is-speaking")) return;
    const sequence = nimboAmbientSequences[nimboAmbientIndex % nimboAmbientSequences.length];
    nimboAmbientIndex += 1;
    playNimboSequence(sequence.frames, sequence.delays);
  }, delay);
}

function acknowledgeNimbo(pose = "proud") {
  if (!nimboCanAutoplay()) return;
  playNimboSequence([pose, "proud", "guide"], [420, 520, 140]);
}

function toggleNimboSide(forceSide = null) {
  const guide = $("nimboGuide");
  if (!nimboCanAutoplay() || Number(window.innerWidth || 0) < 1280) return;
  dismissNimbo(false);
  const nextSide = forceSide || (guide.dataset.side === "left" ? "right" : "left");
  guide.classList.add("is-traveling");
  guide.dataset.side = nextSide;
  setNimboPose("wave-high");
  nimboTravelTimer = scheduleNimbo(() => {
    guide.classList.remove("is-traveling");
    setNimboPose("guide");
    scheduleNimboAmbient(5000);
  }, 980);
}

function scheduleNimboSide(delay = NIMBO_SIDE_DELAY) {
  if (!nimboCanAutoplay()) return;
  if (nimboSideTimer) window.clearTimeout(nimboSideTimer);
  nimboSideTimer = scheduleNimbo(() => toggleNimboSide(), delay);
}

function scheduleNimboAdvice(delay = NIMBO_ADVICE_DELAY) {
  if (!nimboCanAutoplay() || nimboIdleAdviceShown) return;
  if (nimboAdviceTimer) window.clearTimeout(nimboAdviceTimer);
  nimboAdviceTimer = scheduleNimbo(() => {
    nimboAdviceTimer = null;
    if (!nimboCanAutoplay() || $("nimboGuide").classList.contains("is-speaking")) return;
    nimboIdleAdviceShown = true;
    nimboSpeak(nimboTips()[currentStep][nimboTipIndex], nimboLastTarget || nimboTarget());
  }, delay);
}

function dismissNimbo(completed = false) {
  const guide = $("nimboGuide");
  if (!guide) return;
  [nimboSpeechTimer, nimboPoseTimer, nimboHighlightTimer].forEach((timer) => {
    if (timer) window.clearTimeout(timer);
  });
  nimboSpeechTimer = nimboPoseTimer = nimboHighlightTimer = null;
  clearNimboSequence();
  guide.classList.remove("is-casting", "is-talking", "is-speaking");
  guide.dataset.completed = completed ? "true" : "false";
  if (nimboHighlightTarget) nimboHighlightTarget.classList.remove("nimbo-highlight");
  nimboHighlightTarget = null;
  $("btnNimboTip").textContent = completed ? "Volver a empezar" : "Otro consejo";
  if (completed) setNimboPose("guide");
}

function nimboSpeak(text, target = null, pose = null) {
  const guide = $("nimboGuide");
  const message = $("nimboMessage");
  if (!guide || !message) return;

  stopNimboAutomaticTimers();
  dismissNimbo(false);
  message.textContent = text;
  const tipTotal = nimboTips()[currentStep].length;
  $("nimboTipCount").textContent = `Consejo ${nimboTipIndex + 1} de ${tipTotal}`;
  $("btnNimboTip").textContent = nimboTipIndex === tipTotal - 1 ? "Cerrar consejo" : "Otro consejo";
  void guide.offsetWidth;
  const contextPose = pose || nimboPoseByStep[currentStep]?.[nimboTipIndex] || "guide";
  setNimboPose("talking");
  guide.classList.add("is-talking", "is-speaking");
  nimboSequenceTimers.push(
    scheduleNimbo(() => setNimboPose(contextPose), 220),
    scheduleNimbo(() => setNimboPose("talking"), 460),
    scheduleNimbo(() => setNimboPose(contextPose), 710)
  );

  if (nimboHighlightTarget) nimboHighlightTarget.classList.remove("nimbo-highlight");
  nimboHighlightTarget = visualTarget(target);
  if (nimboHighlightTarget) {
    nimboHighlightTarget.classList.remove("nimbo-highlight");
    void nimboHighlightTarget.offsetWidth;
    nimboHighlightTarget.classList.add("nimbo-highlight");
    nimboHighlightTimer = scheduleNimbo(() => {
      if (nimboHighlightTarget) nimboHighlightTarget.classList.remove("nimbo-highlight");
      nimboHighlightTarget = null;
    }, 1100);
  }

  nimboPoseTimer = scheduleNimbo(() => guide.classList.remove("is-talking"), 920);
  nimboSpeechTimer = scheduleNimbo(() => {
    dismissNimbo(false);
    scheduleNimboAmbient(5200);
    scheduleNimboSide();
  }, 6400);
}

function contextualNimboSpeak(text, target, pose = "pointing") {
  nimboTipIndex = nimboIndexForTarget(target);
  nimboSpeak(text, target, pose);
}

function noteNimboActivity(target = null, feedbackPose = null) {
  stopNimboAutomaticTimers();
  dismissNimbo(false);
  nimboIdleAdviceShown = false;
  if (target) {
    nimboLastTarget = target;
    nimboTipIndex = nimboIndexForTarget(target);
  }
  if (feedbackPose) acknowledgeNimbo(feedbackPose);
  else scheduleNimboAmbient();
  scheduleNimboAdvice();
  scheduleNimboSide();
}

function updateNimbo(step) {
  nimboTipIndex = 0;
  nimboIdleAdviceShown = false;
  nimboLastTarget = nimboTarget();
  const guide = $("nimboGuide");
  guide.dataset.section = step.dataset.section;
  guide.dataset.screen = String(currentStep);
  guide.dataset.completed = "false";
  $("nimboTipCount").textContent = `${nimboTips()[currentStep].length} consejos disponibles`;
  dismissNimbo(false);
  setNimboPose(step.dataset.section === "7" ? "reading" : "guide");
  stopNimboAutomaticTimers();

  if (nimboLastStep >= 0 && nimboLastStep !== currentStep && currentStep % 2 === 0) {
    nimboTravelTimer = scheduleNimbo(() => toggleNimboSide(), 260);
  }
  nimboLastStep = currentStep;
  scheduleNimboAmbient(6200);
  scheduleNimboAdvice();
  scheduleNimboSide();
}

function nextNimboTip() {
  const tips = nimboTips()[currentStep];
  const guide = $("nimboGuide");
  stopNimboAutomaticTimers();
  nimboIdleAdviceShown = true;
  if (!guide.classList.contains("is-speaking")) {
    if (guide.dataset.completed === "true") nimboTipIndex = 0;
    nimboSpeak(tips[nimboTipIndex], nimboLastTarget || nimboTarget());
    return;
  }
  if (guide.dataset.completed === "true") {
    nimboTipIndex = 0;
    nimboSpeak(tips[nimboTipIndex], nimboTarget());
    return;
  }
  if (nimboTipIndex >= tips.length - 1) {
    dismissNimbo(true);
    return;
  }
  nimboTipIndex += 1;
  nimboSpeak(tips[nimboTipIndex], nimboTarget());
}

function showStep(index) {
  if (wizardCompleted) return;
  currentStep = Math.min(Math.max(index, 0), lastStep);
  furthestStep = Math.max(furthestStep, currentStep);

  steps.forEach((step, position) => {
    step.hidden = position !== currentStep;
    step.removeAttribute("data-enter");
  });

  const step = steps[currentStep];
  step.setAttribute("data-enter", "");

  $("stepCurrent").textContent = sectionOf(currentStep) + 1;
  $("stepTotal").textContent = sections.length;
  $("stepTitle").textContent = step.dataset.title;
  $("progressFill").style.transform = `scaleX(${(currentStep + 1) / steps.length})`;

  // El botón Atrás nunca desaparece: cambiar de sitio los controles
  // entre pasos obliga a volver a buscarlos.
  $("btnPrev").disabled = currentStep === 0;
  $("btnFinish").hidden = currentStep !== lastStep;
  $("btnNext").hidden = currentStep === lastStep;
  $("btnNextLabel").textContent = "Siguiente";
  const nextTitle = steps[currentStep + 1]?.querySelector(".step-head h1")?.textContent;
  if (nextTitle) $("btnNext").setAttribute("aria-label", `Siguiente: ${nextTitle}`);
  else $("btnNext").removeAttribute("aria-label");

  // La lectura en vivo aparece cuando ya hay algo que leer y se
  // retira en Resultado y La carta, donde el contenido la reemplaza.
  $("readout").hidden = currentStep === 0 || sectionOf(currentStep) >= 5;
  $("stepError").textContent = "";

  syncTrack();
  updateNimbo(step);
  $("canvas").scrollTop = 0;

  const heading = step.querySelector(".step-head h1");
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function validateStep() {
  const step = steps[currentStep];
  const required = [...step.querySelectorAll("[required]")];
  const missing = required.filter((element) => !element.value.trim());

  required.forEach((element) => element.removeAttribute("aria-invalid"));
  if (missing.length === 0) {
    $("stepError").textContent = "";
    return true;
  }

  missing.forEach((element) => element.setAttribute("aria-invalid", "true"));
  $("stepError").textContent = missing.length === 1
    ? "Falta un dato para continuar."
    : `Faltan ${missing.length} datos para continuar.`;
  missing[0].focus();
  return false;
}

function goNext() {
  if (wizardCompleted) return;
  if (currentStep < lastStep && validateStep()) showStep(currentStep + 1);
}

/* ==========================================================
   ARRANQUE
   ========================================================== */

function init() {
  [...calculatorIds, ...projectIds].forEach((id) => {
    $(id).addEventListener("input", (event) => {
      calculate();
      noteNimboActivity(event.target);
    });
    $(id).addEventListener("change", () => {
      calculate();
      noteNimboActivity($(id), featureIds.includes(id) ? "casting" : null);
    });
  });

  // Tarjetas y controles segmentados escriben en su campo destino.
  choiceGroups.forEach((group) => {
    group.addEventListener("change", (event) => {
      $(group.dataset.choice).value = event.target.value;
      calculate();
      noteNimboActivity(event.target, "proud");
    });
  });

  // Botones de más y menos junto a los campos numéricos.
  document.querySelectorAll("[data-nudge]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = $(button.dataset.nudge);
      const next = Number(field.value || 0) + Number(button.dataset.by);
      field.value = Math.min(Number(field.max), Math.max(Number(field.min), next));
      calculate();
      noteNimboActivity(field, "casting");
    });
  });

  $("btnNext").addEventListener("click", goNext);
  $("btnPrev").addEventListener("click", () => showStep(currentStep - 1));
  $("btnNimboTip").addEventListener("click", nextNimboTip);
  $("nimboActor").addEventListener("click", nextNimboTip);

  // Enter avanza, como en cualquier aplicativo. En el área de texto no,
  // porque ahí sirve para saltar de línea.
  $("canvas").addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dismissNimbo(false);
      noteNimboActivity(event.target);
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    const tag = event.target.tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "SUMMARY") return;
    event.preventDefault();
    goNext();
  });

  const fieldTips = {
    applicationName: "Usa el nombre con el que otras áreas reconocen la aplicación.",
    projectName: "El proyecto puede ser más amplio que la aplicación que estás dimensionando.",
    projectPurpose: "Cuenta qué problema resuelve; evita describir tecnologías aquí.",
    totalUsers: "Este es el total de cuentas, aunque no todas entren el mismo día.",
    simultaneousUsers: "La simultaneidad es el dato que más influye en CPU y memoria.",
    recipientName: "Puedes dejar el destinatario vacío si la carta no va dirigida a una persona concreta.",
    recipientRole: "Comprueba el nombre oficial del área que asigna infraestructura.",
    requesterName: "Este nombre aparecerá como firma de la solicitud."
  };
  $("canvas").addEventListener("focusin", (event) => {
    if (fieldTips[event.target.id]) noteNimboActivity(event.target);
  });

  // La animación ambiental se detiene mientras el usuario interactúa
  // directamente con el personaje y cuando la pestaña deja de ser visible.
  $("nimboGuide").addEventListener("pointerenter", stopNimboAutomaticTimers);
  $("nimboGuide").addEventListener("pointerleave", () => {
    if (!nimboMotionPaused) {
      scheduleNimboAmbient(3200);
      scheduleNimboAdvice();
      scheduleNimboSide();
    }
  });
  document.addEventListener("visibilitychange", () => {
    stopNimboAutomaticTimers();
    clearNimboSequence();
    if (!document.hidden && !nimboMotionPaused) {
      setNimboPose("guide");
      scheduleNimboAmbient(3200);
      scheduleNimboAdvice();
      scheduleNimboSide();
    }
  });

  $("btnReset").addEventListener("click", resetCalculator);
  $("btnFinish").addEventListener("click", openFinishDialog);
  $("btnCancelFinish").addEventListener("click", () => {
    closeFinishDialog();
    $("btnFinish").focus();
  });
  $("btnConfirmFinish").addEventListener("click", completeWizard);
  $("btnCompleteCopy").addEventListener("click", () => copySpecification("completionFeedback"));
  $("btnCompletePrint").addEventListener("click", () => window.print());
  $("btnReload").addEventListener("click", () => window.location.reload());

  decorateChoiceIcons();
  prepareNimboFrames();
  buildTrack();
  calculate();
  if (steps.length) showStep(0);
}

document.addEventListener("DOMContentLoaded", init);
