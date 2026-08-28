# Cómo contribuir

Gracias por mejorar Nimbo VPS. El objetivo del proyecto es traducir necesidades funcionales a infraestructura sin exigir conocimientos técnicos; cualquier cambio debe preservar esa claridad.

## Preparar el entorno

1. Instala Node.js 22 o posterior.
2. Ejecuta `npm ci`.
3. Instala Chromium con `npx playwright install chromium`.
4. Ejecuta `npm run ci` antes de modificar código para confirmar que tu entorno está sano.

Puedes servir el repositorio con `python3 -m http.server 8080`. El producto también funciona al abrir los HTML directamente mediante `file://`.

## Flujo de trabajo

1. Crea una rama corta desde `main`, por ejemplo `feat/mejorar-comparacion`.
2. Realiza un cambio enfocado y añade o ajusta pruebas.
3. Verifica escritorio, móvil, teclado y movimiento reducido.
4. Ejecuta `npm run ci`.
5. Abre un pull request explicando la necesidad, la solución y la evidencia.

## Commits

Se usa Conventional Commits, escrito en español:

```text
feat: agrega comparación de escenarios
fix: evita que el dock cubra la última respuesta
docs: documenta el despliegue en GitHub Pages
test: valida el cierre irreversible del wizard
chore: actualiza herramientas de integración continua
```

Usa presente, minúscula después de los dos puntos y una descripción concreta. Separa en commits distintos los cambios de producto, pruebas, documentación e infraestructura cuando puedan revisarse de forma independiente.

## Criterios de interfaz

- Escribe para personas no técnicas y explica toda abreviatura necesaria.
- Mantén la acción principal en una ubicación predecible.
- Evita contenido importante debajo del dock fijo.
- Conserva áreas táctiles de al menos 44 × 44 px.
- Todo control debe funcionar con teclado y mostrar foco visible.
- No comuniques estado únicamente con color.
- Las animaciones deben aportar orientación y tener alternativa para `prefers-reduced-motion`.
- No sustituyas imágenes animadas de Nimbo durante una secuencia: el cambio de fuente produce parpadeos.

## Pruebas requeridas

- Cambios en cálculo o carta: `npm run test:smoke`.
- Cambios visuales, responsive o de interacción: `npm run test:layout` y capturas antes/después.
- Cambios de recursos publicados: `npm run build` y revisión de `dist/`.
- Todo pull request: `npm run ci`.

## Dependencias y recursos

La aplicación evita dependencias de ejecución. Antes de añadir una:

1. comprueba que la plataforma web no cubra la necesidad;
2. documenta el motivo y el impacto de peso;
3. incluye su licencia;
4. sirve el recurso localmente para que la calculadora no dependa de una CDN.

No incluyas capturas temporales, notas de agentes ni documentos de handoff. Esos archivos están excluidos por `.gitignore`.
