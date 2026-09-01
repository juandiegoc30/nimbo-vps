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

const landing = await context.newPage();
await landing.goto(fileUrl("index.html"));
await capture(landing, "landing.png");
await landing.close();

const app = await context.newPage();
await app.goto(fileUrl("app.html"));
await app.getByLabel(/Nombre de la aplicación/).fill("Portal de servicios estudiantiles");
await app.getByLabel(/Nombre del proyecto/).fill("Transformación digital 2026");
await app.getByLabel(/Qué problema resuelve/).fill("Centralizar solicitudes institucionales.");

await app.evaluate(() => showStep(3));
await capture(app, "funciones.png");

await app.evaluate(() => showStep(8));
await capture(app, "resultado.png");

await app.evaluate(() => showStep(10));
await app.getByRole("button", { name: "Finalizar solicitud" }).click();
await app.getByRole("button", { name: "Sí, finalizar" }).click();
await app.getByRole("heading", { name: "Solicitud finalizada", level: 1 }).waitFor({ state: "visible" });
await capture(app, "solicitud-finalizada.png");

await app.close();
await browser.close();

console.log("Capturas actualizadas en docs/screenshots/.");
