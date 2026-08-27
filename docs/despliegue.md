# Despliegue y operación

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` se ejecuta en cada `push` a `main` y también admite ejecución manual.

El proceso:

1. instala dependencias con `npm ci`;
2. instala Chromium;
3. ejecuta sintaxis, pruebas de humo y pruebas de layout;
4. construye la allowlist de `dist/`;
5. sube el artefacto de Pages;
6. despliega al entorno protegido `github-pages`.

Si una verificación falla, el despliegue no comienza.

## Configuración inicial del repositorio

1. Publica el repositorio como `juandiegoc30/vps-calculator`.
2. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** como fuente.
3. En **Settings → Actions → General**, conserva los permisos predeterminados de lectura. El job de despliegue solicita de forma explícita `pages: write` e `id-token: write`.
4. Envía `main`. La URL esperada es `https://juandiegoc30.github.io/vps-calculator/`.

No se requieren secretos ni variables de entorno.

## Integración continua

`.github/workflows/ci.yml` valida pull requests dirigidos a `main`, pushes a ramas de trabajo y ejecuciones manuales. Usa la misma orden `npm run ci` que el despliegue.

## Build local

```bash
npm ci
npx playwright install chromium
npm run ci
```

Sirve el artefacto exacto que recibirá Pages:

```bash
python3 -m http.server 8080 --directory dist
```

## Rollback

Cada despliegue corresponde a un commit de `main`. Para volver a una versión estable:

1. crea un commit que revierta el cambio problemático con `git revert <sha>`;
2. abre y valida el pull request;
3. integra el revert en `main`.

El workflow publicará el artefacto restaurado. Evita reescribir `main` después de que el proyecto esté compartido.

## Diagnóstico

- **Pages no inicia:** confirma que la fuente sea GitHub Actions.
- **El build falla:** ejecuta `npm run ci` localmente con Node 22.
- **Falta un recurso:** añádelo a la allowlist de `scripts/build-site.mjs` y conserva una ruta relativa.
- **La ruta principal muestra 404:** verifica que el nombre del repositorio coincida con la URL configurada en `package.json`.
