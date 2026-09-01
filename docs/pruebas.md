# Pruebas y control de calidad

## Matriz

| Capa | Comando | Qué cubre |
| --- | --- | --- |
| Sintaxis | `npm run check:syntax` | JavaScript de producto, build y pruebas. |
| Lógica | `npm run test:smoke` | Cálculo, carta, presets, selección, iconos, consejos y cierre. |
| Navegador | `npm run test:layout` | Layout, responsive, scroll, teclado operativo, impresión, movimiento y estado terminal. |
| Empaquetado | `npm run build` | Allowlist de producción y referencias locales. |
| Completa | `npm run ci` | Todas las capas anteriores en el mismo orden que CI/CD. |

## Viewports cubiertos

La prueba de layout recorre:

- iPhone SE e iPhone 15 Pro;
- móvil apaisado;
- iPad vertical y apaisado;
- portátiles de 1366 × 768 y 1440 × 900;
- escritorios de 1600 × 900, 1920 × 1080 y 2560 × 1440.

En cada pantalla verifica que no exista scroll horizontal, que el dock permanezca al borde inferior y que el contenido desplazable no quede inaccesible.

## Casos de interacción

La suite en navegador comprueba además:

- cabecera fija y recargas sin desplazamiento acumulado;
- orden del footer en escritorio y móvil;
- progreso de siete etapas;
- consejos de Nimbo asociados al campo correcto;
- GIF continuo sin sustitución de fuente;
- alternativa estática con movimiento reducido;
- centrado de comparación y datos de solicitud;
- tarjetas finales de igual altura;
- confirmación y bloqueo irreversible al finalizar;
- impresión exclusiva de la carta.

## Ejecutar localmente

```bash
npm ci
npx playwright install chromium
npm run ci
```

En Linux limpio o CI instala también las dependencias del navegador:

```bash
npx playwright install --with-deps chromium
```

## Actualizar capturas

```bash
npm run screenshots
```

Revisa visualmente los seis PNG en `docs/screenshots/` antes de incluirlos en un commit. Las capturas se generan con movimiento reducido para que el resultado sea determinista.

En macOS también se puede regenerar el recorrido animado del README:

```bash
npm run demo:gif
```

Este comando captura el flujo con Playwright y codifica `docs/media/nimbo-vps-demo.gif` mediante ImageIO, sin depender de servicios externos.
