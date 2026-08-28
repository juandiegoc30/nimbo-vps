# Accesibilidad y privacidad

## Accesibilidad

La interfaz busca cumplir los principios operativos de WCAG 2.2 AA:

- estructura semántica con encabezados, `fieldset` y `legend`;
- nombres accesibles para entradas y botones;
- navegación completa por teclado;
- foco visible y enlace para saltar al contenido;
- áreas táctiles amplias;
- estado seleccionado comunicado por borde, icono y control nativo;
- mensajes de validación cercanos al origen del error;
- contraste alto entre navy, superficies claras y accent;
- alternativa estática mediante `prefers-reduced-motion`;
- confirmación explícita antes de bloquear el formulario.

Las pruebas automatizadas cubren comportamiento y layout, pero no sustituyen una revisión manual con VoiceOver, NVDA o TalkBack.

## Privacidad

Nimbo VPS no usa:

- cuentas;
- cookies;
- analítica;
- almacenamiento local;
- peticiones a un backend;
- fuentes o scripts de terceros en tiempo de ejecución.

Las respuestas viven en memoria durante la sesión. Al recargar se pierden. La carta solo llega al portapapeles o al sistema de impresión cuando la persona pulsa la acción correspondiente. Desde el diálogo de impresión puede guardarse como PDF.

## Contenido sensible

Aunque la aplicación no transmite datos, evita escribir secretos, contraseñas, datos personales innecesarios o detalles de seguridad de infraestructura en los campos del proyecto. La carta está diseñada para describir una necesidad, no para almacenar credenciales.
