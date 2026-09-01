/*
 * Verificación de layout en navegador real.
 *
 * Comprueba el contrato del app-shell en cada resolución:
 *   1. el dock queda pegado al fondo del viewport, pase lo que pase;
 *   2. el botón de avanzar es siempre alcanzable sin scroll;
 *   3. la rueda scrollea el lienzo, nunca la página;
 *   4. no hay scroll horizontal;
 *   5. la pista de pasos aparece exactamente en escritorio (>= 1024px).
 *
 * Reproduce el fallo original: con min-height en lugar de height, el dock
 * caía fuera de pantalla y no había forma de llegar a "Siguiente".
 *
 * Requiere Playwright, que NO es dependencia del proyecto:
 *   mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright && npx playwright install chromium
 *   node tests/layout.mjs
 */

import path from "node:path";
import { pathToFileURL } from "node:url";

const PW = process.env.PLAYWRIGHT_PATH || "playwright";
const { chromium } = await import(PW).then((m) => m.default ?? m);

const VIEWPORTS = [
  ["iPhone SE",          375,  667, "movil"],
  ["iPhone 15 Pro",      393,  852, "movil"],
  ["movil apaisado",     852,  393, "movil"],
  ["iPad vertical",      768, 1024, "tableta"],
  ["iPad apaisado",     1024,  768, "escritorio"],
  ["laptop 1366",       1366,  768, "escritorio"],
  ["laptop 1440",       1440,  900, "escritorio"],
  ["externa 1080p",     1920, 1080, "escritorio"],
  ["externa no maximizada", 1600, 900, "escritorio"],
  ["externa 1440p",     2560, 1440, "escritorio"],
];

const PANTALLAS = 11;
const siteRoot = path.resolve(process.env.SITE_ROOT || process.cwd());
const url = pathToFileURL(path.join(siteRoot, "app.html")).href;
const landingUrl = pathToFileURL(path.join(siteRoot, "index.html")).href;
const browser = await chromium.launch();
let failures = 0;

for (const [name, width, height, modo] of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll(".track-node").length > 0);

  await page.fill("#applicationName", "Portal de servicios estudiantiles");
  await page.fill("#projectName", "Transformación digital 2026");
  await page.fill("#projectPurpose", "Centralizar las solicitudes de certificados.");

  const bad = [];
  const notes = [];

  for (let step = 1; step <= PANTALLAS; step++) {
    await page.evaluate((n) => showStep(n - 1), step);
    await page.waitForTimeout(60);

    // Rueda sobre el centro del lienzo, como haría una persona
    const before = await page.evaluate(() => ({
      canvas: document.getElementById("canvas").scrollTop,
      pageY: window.scrollY,
      dockBottom: Math.round(document.querySelector(".dock").getBoundingClientRect().bottom),
    }));
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(120);

    const after = await page.evaluate(() => {
      const canvas = document.getElementById("canvas");
      const next = document.getElementById("btnNext");
      const rect = next.getBoundingClientRect();
      return {
        canvas: canvas.scrollTop,
        overflow: canvas.scrollHeight - canvas.clientHeight,
        pageY: window.scrollY,
        dockBottom: Math.round(document.querySelector(".dock").getBoundingClientRect().bottom),
        barTop: Math.round(document.querySelector(".app-bar").getBoundingClientRect().top),
        nextReachable: rect.width > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight + 1,
        nextHidden: next.hidden,
        // hidden solo cuenta si de verdad lo oculta: .btn es inline-flex
        // y el atributo por si solo no le gana.
        nextDisplayed: getComputedStyle(next).display !== "none",
        readoutDisplayed: getComputedStyle(document.getElementById("readout")).display !== "none",
        hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    });

    if (after.dockBottom !== height) bad.push(`paso ${step}: el dock no toca el fondo (${after.dockBottom} de ${height})`);
    if (after.barTop !== 0) bad.push(`paso ${step}: la barra no queda arriba (${after.barTop})`);
    if (after.pageY !== before.pageY) bad.push(`paso ${step}: la rueda movió la página en vez del lienzo`);
    if (after.hScroll) bad.push(`paso ${step}: hay scroll horizontal`);
    if (!after.nextHidden && !after.nextReachable) bad.push(`paso ${step}: el botón de avanzar no es alcanzable`);
    if (step === PANTALLAS && after.nextDisplayed) bad.push("última pantalla: 'Siguiente' sigue visible");
    if (step === PANTALLAS && after.readoutDisplayed) bad.push("última pantalla: la lectura en vivo duplica al panel");
    if (step === 1 && after.readoutDisplayed) bad.push("paso 1: la lectura en vivo aparece antes de haber respondido nada");
    if (step > 1 && step < 9 && !after.readoutDisplayed) bad.push(`paso ${step}: falta la lectura en vivo`);
    if (step >= 9 && after.readoutDisplayed) bad.push(`paso ${step}: la lectura en vivo duplica Resultado o La carta`);
    if (after.overflow > 0 && after.canvas === before.canvas) bad.push(`paso ${step}: hay ${after.overflow}px que no se pueden scrollear`);
    if (after.overflow > 0) notes.push(`${step}:+${after.overflow}px`);
  }

  const shell = await page.evaluate(() => {
    const rail = document.getElementById("stepper");
    const prog = document.querySelector(".bar-progress");
    return {
      track: getComputedStyle(rail).display !== "none",
      trackH: Math.round(rail.getBoundingClientRect().height),
      progreso: getComputedStyle(prog).display !== "none",
      cols: (getComputedStyle(document.querySelector(".step:not([hidden])")).gridTemplateColumns.match(/repeat\((\d)/) || [, "1"])[1],
      // La pista no es solo progreso: cada celda lleva la respuesta vigente
      celdas: [...document.querySelectorAll(".track-node")].map((c) => ({
        estado: c.dataset.state,
        nombre: c.textContent.trim(),
      })),
      trackAlto: Math.round(document.getElementById("stepper").getBoundingClientRect().height),
    };
  });

  // Escritorio manda pista horizontal; movil y tableta mandan barra de progreso
  const esperaPista = modo === "escritorio";
  if (shell.track !== esperaPista) bad.push(`la pista deberia estar ${esperaPista ? "visible" : "oculta"} en ${modo}`);
  if (shell.progreso === esperaPista) bad.push(`la barra de progreso deberia estar ${esperaPista ? "oculta" : "visible"} en ${modo}`);

  if (esperaPista) {
    if (shell.celdas.length !== 7) bad.push(`el indicador tiene ${shell.celdas.length} nodos, deberia tener 7`);
    const sinNombre = shell.celdas.filter((c) => !c.nombre);
    if (sinNombre.length) bad.push(`${sinNombre.length} celdas sin titulo`);
    // Es una guia, no un panel: no puede comerse el alto del cuestionario
    if (shell.trackAlto > 72) bad.push(`la pista mide ${shell.trackAlto}px, deberia quedarse en 72 o menos`);
    const actuales = shell.celdas.filter((c) => c.estado === "current").length;
    if (actuales !== 1) bad.push(`hay ${actuales} celdas marcadas como actual, deberia haber 1`);
    // Tras recorrer las siete etapas, la última es la actual y las seis previas quedan hechas
    const hechas = shell.celdas.filter((c) => c.estado === "done").length;
    if (hechas !== 6) bad.push(`hay ${hechas} nodos marcados como hechos, deberia haber 6`);
  }

  failures += bad.length;
  console.log(
    `${bad.length ? "FALLA" : "ok   "} ${name.padEnd(22)} ${String(width).padStart(4)}x${String(height).padStart(4)} ` +
    `${modo.padEnd(11)} pista=${shell.track ? shell.trackH + "px" : "no"} cols=${shell.cols} ` +
    `scroll: ${notes.join(" ") || "no hace falta"}` +
    ""
  );
  bad.forEach((b) => console.log(`         -> ${b}`));
  await page.close();
}

/* ---------- Landing: header anclado y recargas sin scroll acumulado ---------- */
for (const [name, width, height] of [["móvil", 375, 667], ["escritorio", 1440, 900]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(landingUrl);
  await page.locator(".page-header").waitFor({ state: "visible" });

  const bad = [];
  const initial = await page.evaluate(() => ({
    scrollY: window.scrollY,
    position: getComputedStyle(document.querySelector(".page-header")).position,
    top: Math.round(document.querySelector(".page-header").getBoundingClientRect().top),
    legal: [...document.querySelectorAll(".footer-legal a")].map((link) => link.textContent.trim()),
    githubIcon: (() => {
      const icon = document.querySelector(".footer-legal .ti-brand-github");
      if (!icon) return false;
      const content = getComputedStyle(icon, "::before").content;
      return content && !["none", "normal", '""'].includes(content);
    })(),
    footerText: document.querySelector(".page-footer").textContent,
    footerLayout: (() => {
      const brand = document.querySelector(".page-footer .brand").getBoundingClientRect();
      const description = document.querySelector(".footer-description").getBoundingClientRect();
      const wrap = document.querySelector(".page-footer .wrap").getBoundingClientRect();
      if (window.innerWidth > 720) {
        return description.right < brand.left &&
          Math.abs(description.left - wrap.left) <= 1 &&
          Math.abs(brand.right - wrap.right) <= 1;
      }
      return Math.abs(description.left - wrap.left) <= 1 && Math.abs(brand.right - wrap.right) <= 1;
    })(),
  }));
  if (initial.scrollY !== 0) bad.push(`abre con scrollY=${initial.scrollY}`);
  if (initial.position !== "fixed" || initial.top !== 0) bad.push(`header ${initial.position} en top=${initial.top}`);
  if (!initial.legal.includes("GitHub") || initial.legal.length !== 1) bad.push("el único enlace legal debe ser GitHub");
  if (!initial.githubIcon) bad.push("el enlace de GitHub no muestra su icono");
  if (!initial.footerText.includes("Juan Diego Castellanos") ||
      !initial.footerText.includes("Se publica bajo la licencia MIT") ||
      !initial.footerText.includes("open source")) bad.push("el texto legal del footer está incompleto");
  if (!initial.footerLayout) bad.push("el footer no distribuye marca y descripción correctamente");

  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForFunction(() => window.scrollY > 0);
  const headerAfterScroll = await page.locator(".page-header").evaluate((header) => Math.round(header.getBoundingClientRect().top));
  if (headerAfterScroll !== 0) bad.push(`el header se desplazó a ${headerAfterScroll}px al hacer scroll`);

  for (let reload = 1; reload <= 5; reload += 1) {
    await page.reload();
    await page.locator(".page-header").waitFor({ state: "visible" });
    await page.waitForFunction(() => window.scrollY === 0);
    const position = await page.evaluate(() => ({
      y: window.scrollY,
      top: Math.round(document.querySelector(".page-header").getBoundingClientRect().top),
    }));
    if (position.y !== 0 || position.top !== 0) bad.push(`recarga ${reload}: y=${position.y}, header=${position.top}`);
  }

  const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (hScroll) bad.push("hay scroll horizontal");

  failures += bad.length;
  console.log(`${bad.length ? "FALLA" : "ok   "} landing ${name.padEnd(12)} header fijo y 5 recargas estables`);
  bad.forEach((item) => console.log(`         -> ${item}`));
  await page.close();
}

/* ---------- Estado terminal: confirmar, bloquear y cerrar el recorrido ---------- */
for (const [name, width, height] of [["móvil", 375, 667], ["escritorio", 1366, 768]]) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll(".track-node").length === 7);
  await page.getByLabel(/Nombre de la aplicación/).fill("Portal institucional");
  await page.getByLabel(/Nombre del proyecto/).fill("Servicios 2026");
  await page.getByLabel(/Qué problema resuelve/).fill("Centralizar solicitudes.");
  await page.evaluate(() => showStep(10));

  const bad = [];
  const dockState = await page.evaluate(() => {
    const back = document.getElementById("btnPrev").getBoundingClientRect();
    const finish = document.getElementById("btnFinish").getBoundingClientRect();
    const next = document.getElementById("btnNext");
    return {
      finishVisible: finish.width > 0 && finish.height > 0,
      nextVisible: getComputedStyle(next).display !== "none",
      sameRow: Math.abs(back.top - finish.top) <= 2,
      adjacent: finish.left >= back.right,
      insideViewport: finish.right <= window.innerWidth + 1,
      inDock: document.getElementById("wizardDock").contains(document.getElementById("btnFinish")),
    };
  });
  if (!dockState.finishVisible || dockState.nextVisible || !dockState.inDock) bad.push("la acción final no sustituye a Siguiente en el dock");
  if (!dockState.sameRow || !dockState.adjacent || !dockState.insideViewport) bad.push("Finalizar no queda junto a Atrás dentro del viewport");
  await page.getByRole("button", { name: "Finalizar solicitud" }).click();
  await page.getByRole("dialog", { name: "¿Finalizar la solicitud?" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Seguir revisando" }).click();
  if (await page.getByRole("dialog").isVisible()) bad.push("Cancelar no cerró la confirmación");

  await page.getByRole("button", { name: "Finalizar solicitud" }).click();
  await page.getByRole("button", { name: "Sí, finalizar" }).click();
  await page.getByRole("heading", { name: "Solicitud finalizada", level: 1 }).waitFor({ state: "visible" });

  const terminal = await page.evaluate(() => {
    const screen = document.getElementById("completionScreen");
    const rect = screen.getBoundingClientRect();
    const visible = (selector) => {
      const element = document.querySelector(selector);
      return element && getComputedStyle(element).display !== "none" && element.getBoundingClientRect().height > 0;
    };
    const lockedControls = [...document.querySelectorAll("#canvasInner input, #canvasInner textarea, #canvasInner select, #canvasInner button")];
    showStep(0);
    resetCalculator();
    return {
      complete: document.body.classList.contains("is-complete"),
      inert: document.getElementById("canvasInner").hasAttribute("inert"),
      allDisabled: lockedControls.every((control) => control.disabled),
      trackVisible: visible(".track"),
      dockVisible: visible(".dock"),
      resetVisible: visible("#btnReset"),
      finalVisible: visible("#completionScreen"),
      finalFocused: document.activeElement === document.getElementById("completionTitle"),
      previousStepVisible: visible('.step[data-section="1"]'),
      withinViewport: rect.left >= 0 && rect.right <= window.innerWidth + 1,
      hScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });

  if (!terminal.complete || !terminal.inert || !terminal.allDisabled) bad.push("el formulario no quedó bloqueado");
  if (terminal.trackVisible || terminal.dockVisible || terminal.resetVisible) bad.push("quedó una ruta visible hacia pasos anteriores");
  if (!terminal.finalVisible || terminal.previousStepVisible) bad.push("el estado final no reemplazó el wizard");
  if (!terminal.finalFocused) bad.push("el foco no llegó al mensaje de finalización");
  if (!terminal.withinViewport || terminal.hScroll) bad.push("el cierre desborda horizontalmente");

  const navigation = page.waitForNavigation();
  await page.getByRole("button", { name: "Recargar y empezar de nuevo" }).click();
  await navigation;
  await page.getByRole("heading", { name: "Empecemos por el proyecto", level: 1 }).waitFor({ state: "visible" });
  const restarted = await page.evaluate(() => ({
    complete: document.body.classList.contains("is-complete"),
    appName: document.getElementById("applicationName").value,
  }));
  if (restarted.complete || restarted.appName) bad.push("recargar no inició un cálculo limpio");

  failures += bad.length;
  console.log(`${bad.length ? "FALLA" : "ok   "} cierre ${name.padEnd(13)} confirmación, bloqueo y recarga`);
  bad.forEach((item) => console.log(`         -> ${item}`));
  await page.close();
}

/* ---------- Iconos, consejos diferidos, movimiento y layouts centrados ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll(".track-node").length === 7);
  await page.evaluate(async () => {
    await document.fonts.load('16px "tabler-icons"');
    await document.fonts.ready;
  });

  await page.evaluate(() => showStep(0));
  await page.waitForFunction(() => document.getElementById("nimboGuide").dataset.framesReady === "true");
  await page.focus("#projectName");
  await page.click("#nimboActor");
  const segundoConsejo = await page.textContent("#nimboTipCount");
  await page.focus("#projectPurpose");
  await page.click("#nimboActor");
  const tercerConsejo = await page.textContent("#nimboTipCount");

  await page.evaluate(() => showStep(8));
  await page.waitForTimeout(80);
  const result = await page.evaluate(() => {
    const side = document.querySelector(".result-side");
    const lastRow = document.querySelector(".recap-row:last-child");
    const dock = document.querySelector(".dock");
    const icons = [...document.querySelectorAll(".switch-icon .ti, .choice-icon .ti")];
    return {
      firstAdvice: document.getElementById("nimboTipCount").textContent,
      pose: document.getElementById("nimboGuide").dataset.pose,
      speaking: document.getElementById("nimboGuide").classList.contains("is-speaking"),
      animationCount: document.querySelectorAll(".nimbo-character .nimbo-animation").length,
      poseLayerCount: document.querySelectorAll(".nimbo-pose").length,
      animationSrc: document.querySelector(".nimbo-animation").currentSrc,
      animationReady: document.querySelector(".nimbo-animation").complete && document.querySelector(".nimbo-animation").naturalWidth === 720,
      summaryOverflow: Math.max(0, side.scrollHeight - side.clientHeight),
      summaryOverflowY: getComputedStyle(side).overflowY,
      recapAboveDock: lastRow.getBoundingClientRect().bottom <= dock.getBoundingClientRect().top + 1,
      iconCount: icons.length,
      missingIcons: icons.filter((icon) => {
        const content = getComputedStyle(icon, "::before").content;
        return !content || content === "none" || content === "normal" || content === '""';
      }).length,
      fontReady: document.fonts.check('16px "tabler-icons"'),
    };
  });

  const bad = [];
  if (segundoConsejo !== "Consejo 2 de 3") bad.push(`el segundo campo muestra “${segundoConsejo}”`);
  if (tercerConsejo !== "Consejo 3 de 3") bad.push(`el tercer campo muestra “${tercerConsejo}”`);
  if (result.firstAdvice !== "3 consejos disponibles") bad.push(`Resultado interrumpe al iniciar con “${result.firstAdvice}”`);
  if (result.speaking) bad.push("Nimbo abre una burbuja sin espera ni solicitud del usuario");
  if (result.pose !== "guide") bad.push(`Resultado inicia con la pose “${result.pose}” en vez de reposo`);
  if (result.animationCount !== 1) bad.push(`Nimbo usa ${result.animationCount} animaciones principales en vez de una sola`);
  if (result.poseLayerCount) bad.push(`Nimbo conserva ${result.poseLayerCount} capas intercambiables`);
  if (!result.animationSrc.endsWith("nimbo-alive.gif")) bad.push(`Nimbo no usa el GIF continuo: ${result.animationSrc}`);
  if (!result.animationReady) bad.push("el GIF de Nimbo no terminó de decodificar a 720px");
  if (result.summaryOverflow > 1) bad.push(`el resumen desborda ${result.summaryOverflow}px`);
  if (["auto", "scroll"].includes(result.summaryOverflowY)) bad.push(`el resumen conserva overflow-y:${result.summaryOverflowY}`);
  if (!result.recapAboveDock) bad.push("la última respuesta queda bajo el dock");
  if (result.iconCount < 40) bad.push(`solo se renderizaron ${result.iconCount} iconos`);
  if (result.missingIcons) bad.push(`${result.missingIcons} iconos no tienen glifo`);
  if (!result.fontReady) bad.push("la fuente local de Tabler no terminó de cargar");

  const motion = await page.evaluate(async () => {
    showStep(0);
    stopNimboAutomaticTimers();
    const image = document.querySelector(".nimbo-animation");
    const sourceBefore = image.currentSrc;
    playNimboSequence(["blink-half", "blink-closed", "blink-half", "guide"], [70, 70, 70, 70], "guide", false);
    const first = document.getElementById("nimboGuide").dataset.pose;
    await new Promise((resolve) => setTimeout(resolve, 90));
    const second = document.getElementById("nimboGuide").dataset.pose;
    await new Promise((resolve) => setTimeout(resolve, 170));
    return {
      first,
      second,
      last: document.getElementById("nimboGuide").dataset.pose,
      sameSource: sourceBefore === image.currentSrc,
      visible: getComputedStyle(image).display !== "none" && image.getBoundingClientRect().width > 0,
    };
  });
  if (motion.first !== "blink-half" || motion.second !== "blink-closed" || motion.last !== "guide") {
    bad.push(`la secuencia de parpadeo no progresa por fotogramas (${motion.first} → ${motion.second} → ${motion.last})`);
  }
  if (!motion.sameSource || !motion.visible) bad.push("una actualización de estado sustituye u oculta la animación de Nimbo");

  const centered = await page.evaluate(() => {
    const centerOffset = (selector) => {
      const item = document.querySelector(selector).getBoundingClientRect();
      const common = document.getElementById("canvasInner").getBoundingClientRect();
      return Math.abs((item.left + item.right) / 2 - (common.left + common.right) / 2);
    };
    showStep(9);
    const comparison = centerOffset(".step-result-detail .comparison-panel");
    showStep(10);
    const requestData = centerOffset(".step-letter-form .letter-tools");
    return { comparison, requestData };
  });
  if (centered.comparison > 2) bad.push(`Comparación queda ${centered.comparison.toFixed(1)}px fuera del centro`);
  if (centered.requestData > 2) bad.push(`Datos de solicitud quedan ${centered.requestData.toFixed(1)}px fuera del centro`);

  failures += bad.length;
  console.log(`${bad.length ? "FALLA" : "ok   "} interacción dirigida      consejos diferidos, GIF continuo y centrado`);
  bad.forEach((item) => console.log(`         -> ${item}`));
  await page.close();
}

/* ---------- Movimiento reducido: alternativa estatica y sin recorridos ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url);
  await page.waitForFunction(() => document.getElementById("nimboGuide").dataset.framesReady === "true");

  const reduced = await page.evaluate(async () => {
    showStep(0);
    const guide = document.getElementById("nimboGuide");
    const beforeSide = guide.dataset.side;
    toggleNimboSide(beforeSide === "left" ? "right" : "left");
    await new Promise((resolve) => setTimeout(resolve, 80));
    return {
      gifHidden: getComputedStyle(document.querySelector(".nimbo-animation")).display === "none",
      staticVisible: getComputedStyle(document.querySelector(".nimbo-static")).display !== "none",
      sideUnchanged: guide.dataset.side === beforeSide,
    };
  });

  const bad = [];
  if (!reduced.gifHidden) bad.push("el GIF sigue activo con movimiento reducido");
  if (!reduced.staticVisible) bad.push("no aparece la alternativa inmóvil de Nimbo");
  if (!reduced.sideUnchanged) bad.push("Nimbo recorre la pantalla con movimiento reducido");

  failures += bad.length;
  console.log(`${bad.length ? "FALLA" : "ok   "} movimiento reducido       Nimbo estático y sin recorridos`);
  bad.forEach((item) => console.log(`         -> ${item}`));
  await page.close();
}

/* ---------- Impresion: solo la carta ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(url);
  await page.waitForFunction(() => document.querySelectorAll(".track-node").length > 0);
  await page.fill("#applicationName", "Portal");
  await page.fill("#projectName", "Servicios 2026");
  await page.fill("#projectPurpose", "Centralizar tramites.");
  await page.evaluate((n) => showStep(n - 1), PANTALLAS);
  await page.getByRole("button", { name: "Finalizar solicitud" }).click();
  await page.getByRole("button", { name: "Sí, finalizar" }).click();
  await page.getByRole("heading", { name: "Solicitud finalizada", level: 1 }).waitFor({ state: "visible" });
  await page.emulateMedia({ media: "print" });

  const impresion = await page.evaluate(() => {
    // Alto real, no display propio: un ancestro oculto no cambia el
    // display computado del hijo pero si lo saca de la pagina.
    const visible = (s) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect().height > 0 : false;
    };
    return {
      carta: visible(".print-letter"),
      textoCarta: document.querySelector(".print-letter").textContent.trim().length,
      borde: parseFloat(getComputedStyle(document.querySelector(".print-letter")).borderTopWidth),
      padding: parseFloat(getComputedStyle(document.querySelector(".print-letter")).paddingTop),
      pie: visible(".print-letter-footer"),
      metricas: document.querySelectorAll(".print-letter-metrics > div").length,
      detalles: document.querySelectorAll(".print-letter-details > div").length,
      colorExacto: [
        getComputedStyle(document.documentElement).printColorAdjust,
        getComputedStyle(document.documentElement).webkitPrintColorAdjust,
      ].includes("exact"),
      chrome: [".canvas-inner", ".completion-screen", ".dock", ".app-bar", ".track", ".panel"].filter(visible),
    };
  });
  const pdf = await page.pdf({ format: "Letter", printBackground: true });
  const paginas = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;

  const bad = [];
  if (!impresion.carta) bad.push("la carta no se imprime");
  if (impresion.textoCarta < 400) bad.push(`la carta impresa solo tiene ${impresion.textoCarta} caracteres`);
  if (impresion.borde < 10 || impresion.padding < 20 || !impresion.pie || !impresion.colorExacto ||
      impresion.metricas !== 4 || impresion.detalles !== 4) {
    bad.push("la impresión perdió el formato visual de la carta");
  }
  if (pdf.subarray(0, 4).toString("ascii") !== "%PDF" || pdf.length < 10_000) bad.push("el navegador no generó un PDF válido");
  if (paginas !== 1) bad.push(`la carta ocupa ${paginas} páginas en vez de una`);
  if (impresion.chrome.length) bad.push(`se imprime chrome que no deberia: ${impresion.chrome.join(", ")}`);

  failures += bad.length;
  console.log(`${bad.length ? "FALLA" : "ok   "} impresion               carta maquetada en ${paginas} página, ${impresion.textoCarta} caracteres`);
  bad.forEach((b) => console.log(`         -> ${b}`));
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} fallos de layout` : "\nLayout OK.");
process.exit(failures ? 1 : 0);
