import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs", "screenshots");
const fileUrl = (name) => new URL(name, `file://${root}/`).href;

await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "light",
  reducedMotion: "reduce",
  deviceScaleFactor: 1
});

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
  });
}

async function capture(page, name) {
  await settle(page);
  await page.screenshot({
    path: path.join(output, name),
    animations: "disabled",
    fullPage: false
  });
}

async function choose(page, name, value) {
  await page.locator(`input[name="${name}"][value="${value}"]`).evaluate((input) => {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function enable(page, selector) {
  await page.locator(selector).evaluate((input) => {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function prepareScenario(page) {
  await page.getByLabel(/Nombre de la aplicación/).fill("Portal de trámites ciudadanos");
  await page.getByLabel(/Nombre del proyecto/).fill("Servicios digitales 2026");
  await page.getByLabel(/Qué problema resuelve/).fill("Centralizar solicitudes, seguimiento y entrega de certificados en línea.");

  await choose(page, "r-totalUsers", "600");
  await choose(page, "r-sim", "50");
  await choose(page, "r-int", "1.6");
  await enable(page, "#featureNotifications");
  await enable(page, "#featureApi");
  await choose(page, "r-data", "15");
  await choose(page, "r-files", "120");
  await choose(page, "r-weight", "1.3");
  await choose(page, "r-ret", "8");
  await choose(page, "r-growth", "1.5");
  await choose(page, "r-avail", "1.3");
  await choose(page, "r-backup", "1.2");
  await choose(page, "r-head", "1.2");
}

const landing = await context.newPage();
await landing.goto(fileUrl("index.html"));
await capture(landing, "landing.png");
await landing.close();

const app = await context.newPage();
await app.goto(fileUrl("app.html"));
await prepareScenario(app);

await app.evaluate(() => showStep(3));
await capture(app, "funciones.png");

await app.evaluate(() => showStep(5));
await capture(app, "informacion.png");

await app.evaluate(() => showStep(8));
await capture(app, "resultado.png");

await app.evaluate(() => showStep(9));
await capture(app, "comparacion.png");

await app.evaluate(() => showStep(10));
await app.getByLabel("Destinatario").fill("María Fernanda Ruiz");
await app.getByLabel("Quién solicita").fill("Juan Diego Castellanos — Líder del proyecto");
await app.getByRole("button", { name: "Finalizar solicitud" }).click();
await app.getByRole("button", { name: "Sí, finalizar" }).click();
await app.getByRole("heading", { name: "Solicitud finalizada", level: 1 }).waitFor({ state: "visible" });
await capture(app, "solicitud-finalizada.png");

await app.close();
await browser.close();

console.log("Capturas actualizadas en docs/screenshots/.");
