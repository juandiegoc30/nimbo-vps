import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "docs", "media", "nimbo-vps-demo.gif");
const frames = await mkdtemp(path.join(tmpdir(), "nimbo-vps-demo-"));
const fileUrl = new URL("app.html", `file://${root}/`).href;

await mkdir(path.dirname(output), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1200, height: 750 },
  colorScheme: "light",
  reducedMotion: "no-preference",
  deviceScaleFactor: 1
});
const page = await context.newPage();
let frameNumber = 0;

async function settle(delay = 320) {
  await page.waitForTimeout(delay);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
  });
}

async function frame(delay = 800) {
  frameNumber += 1;
  const name = `${String(frameNumber).padStart(3, "0")}-${delay}.png`;
  await page.screenshot({ path: path.join(frames, name), fullPage: false });
}

async function showStep(index, delay = 800) {
  await page.evaluate((step) => window.showStep(step), index);
  await settle();
  await frame(delay);
}

async function choose(name, value) {
  await page.locator(`input[name="${name}"][value="${value}"]`).evaluate((input) => {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function enable(selector) {
  await page.locator(selector).evaluate((input) => {
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

try {
  await page.goto(fileUrl);
  await settle(500);
  await frame(900);

  await page.getByLabel(/Nombre de la aplicación/).fill("Portal de trámites ciudadanos");
  await page.getByLabel(/Nombre del proyecto/).fill("Servicios digitales 2026");
  await page.getByLabel(/Qué problema resuelve/).fill("Centralizar solicitudes y certificados en línea.");
  await frame(850);

  await showStep(1, 800);
  await choose("r-totalUsers", "600");
  await choose("r-sim", "50");
  await settle(220);
  await frame(700);

  await showStep(2, 700);
  await choose("r-int", "1.6");
  await settle(220);
  await frame(650);

  await showStep(3, 950);
  await enable("#featureNotifications");
  await enable("#featureApi");
  await settle(260);
  await frame(700);

  await choose("r-data", "15");
  await choose("r-files", "120");
  await showStep(4, 800);

  await choose("r-weight", "1.3");
  await choose("r-ret", "8");
  await showStep(5, 800);

  await choose("r-growth", "1.5");
  await choose("r-avail", "1.3");
  await showStep(6, 700);

  await choose("r-backup", "1.2");
  await choose("r-head", "1.2");
  await showStep(7, 700);

  await showStep(8, 1200);
  await showStep(9, 1000);
  await showStep(10, 700);

  await page.getByLabel("Destinatario").fill("María Fernanda Ruiz");
  await page.getByLabel("Quién solicita").fill("Juan Diego Castellanos — Líder del proyecto");
  await settle(200);
  await frame(750);

  await page.getByRole("button", { name: "Finalizar solicitud" }).click();
  await settle(200);
  await frame(700);
  await page.getByRole("button", { name: "Sí, finalizar" }).click();
  await page.getByRole("heading", { name: "Solicitud finalizada", level: 1 }).waitFor({ state: "visible" });
  await settle(450);
  await frame(1700);

  await run("/usr/bin/swift", [path.join(root, "scripts", "make_readme_gif.swift"), frames, output], {
    cwd: root,
    maxBuffer: 1024 * 1024
  });
  console.log(`Recorrido animado actualizado en ${path.relative(root, output)}.`);
} finally {
  await context.close();
  await browser.close();
  await rm(frames, { recursive: true, force: true });
}
