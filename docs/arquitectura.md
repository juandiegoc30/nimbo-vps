# Arquitectura técnica

## Resumen

Nimbo VPS es una aplicación web estática compuesta por dos documentos:

- `index.html`: presenta el producto y conduce a la calculadora.
- `app.html`: contiene el wizard, la recomendación y la carta.

Ambos comparten `assets/css/styles.css`, la marca y Tabler Icons. La landing carga `assets/js/landing.js`; la calculadora carga `assets/js/app.js`. No existe API, base de datos ni estado remoto.

## Flujo de datos

```text
respuestas del formulario
        ↓
lectura y normalización
        ↓
factores heurísticos de carga y continuidad
        ↓
CPU · RAM · disco · transferencia
        ↓
resumen explicado · escenarios · carta imprimible
```

`calculate()` es la función central. Lee el formulario, construye un objeto de resultado y actualiza las vistas derivadas. El cálculo es determinista: las mismas respuestas producen la misma recomendación.

## Estado del wizard

`app.js` mantiene tres estados principales:

- `currentStep`: pantalla visible dentro de las once pantallas.
- `furthestStep`: límite de navegación habilitado en la pista de siete etapas.
- `wizardCompleted`: estado terminal que impide editar o volver a pasos anteriores.

Las siete etapas agrupan pantallas relacionadas sin convertir el indicador en pestañas. En escritorio se muestra una pista conectada; en anchos menores se usa una barra compacta. El lienzo central es el único elemento desplazable y el dock de navegación permanece accesible.

## Cálculo

La recomendación combina:

- simultaneidad e intensidad de uso;
- funciones activas;
- volumen de registros y archivos;
- peso y retención de archivos;
- crecimiento, margen, disponibilidad y respaldos.

Los valores continuos se redondean a capacidades operativas discretas. Después se derivan un escenario mínimo y otro con crecimiento. La explicación se construye desde los factores de mayor impacto, no desde texto genérico.

Los supuestos detallados están en [metodologia.md](metodologia.md).

## Nimbo

La animación principal usa un único GIF continuo para evitar destellos producidos por cambiar imágenes. `app.js` modifica pose, posición, burbuja y estado semántico sin reemplazar la fuente visual. Los consejos aparecen al hacer clic o tras un periodo prolongado de inactividad.

Con `prefers-reduced-motion: reduce`, CSS oculta los GIF y muestra ilustraciones WebP estáticas. Los recorridos automáticos también se desactivan.

## Recursos locales

El navegador no consulta CDNs. Tabler Icons, la marca y las imágenes se sirven desde `assets/`. Los PNG grandes son fuentes de generación; el build copia únicamente GIF/WebP finales y la marca que realmente usa la interfaz.

## Build

`scripts/build-site.mjs` crea `dist/`, copia una lista explícita de archivos públicos, añade `.nojekyll` y verifica que los `href` y `src` locales de ambos HTML existan en el artefacto.

Esta allowlist evita publicar notas internas, scripts de creación, imágenes fuente, pruebas o metadatos del repositorio.

## Límites de confianza

- Entrada: contenido escrito y elecciones locales de la persona usuaria.
- Procesamiento: JavaScript en el navegador.
- Salida: portapapeles o sistema de impresión del navegador, incluida la opción de guardar como PDF.
- Red: ninguna petición de la aplicación en ejecución.

El contenido escrito se asigna mediante `textContent`; no se interpreta como HTML.
