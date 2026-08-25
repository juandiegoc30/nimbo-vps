import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

const files = [
  "index.html",
  "app.html",
  "LICENSE",
  "docs/metodologia.md",
  "assets/favicon-32.png",
  "assets/apple-touch-icon.png",
  "assets/brand/nimbo-mark-128.png",
  "assets/css/styles.css",
  "assets/js/app.js",
  "assets/js/landing.js",
  "assets/images/nimbo-alive.gif",
  "assets/images/nimbo-guide.webp",
  "assets/images/nimbo-celebrating.gif",
  "assets/images/nimbo-celebrating.webp",
  "assets/images/nimbo-proud.webp",
  "assets/vendor/tabler-icons/LICENSE",
  "assets/vendor/tabler-icons/fonts/tabler-icons.woff2",
  "assets/vendor/tabler-icons/tabler-icons.min.css"
];

async function copy(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);
  await stat(source);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function verifyDocument(relativePath) {
  const source = await readFile(path.join(root, relativePath), "utf8");
  const references = [...source.matchAll(/(?:href|src)="(\.\/[^"?#]+)"/g)]
    .map((match) => match[1].slice(2));

  for (const reference of references) {
    await stat(path.join(output, reference));
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await Promise.all(files.map(copy));
await writeFile(path.join(output, ".nojekyll"), "", "utf8");
await verifyDocument("index.html");
await verifyDocument("app.html");

console.log(`Sitio preparado en ${path.relative(root, output)}/ (${files.length + 1} archivos de producción).`);
