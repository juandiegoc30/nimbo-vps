# Metodología de la calculadora

## Enfoque

La herramienta está diseñada para que una persona no técnica pueda describir las necesidades de una aplicación sin conocer conceptos de infraestructura.

Por ello, la entrada está expresada en términos funcionales y operativos.

La salida sí utiliza términos técnicos, ya que está pensada para ser remitida a un área de infraestructura o TI.

## Entradas funcionales

La herramienta pregunta por:

1. Nombre de la aplicación, proyecto y propósito.
2. Usuarios registrados.
3. Usuarios simultáneos.
4. Intensidad de uso.
5. Funciones de la aplicación.
6. Volumen aproximado de información.
7. Cantidad de archivos.
8. Peso aproximado de archivos.
9. Tiempo de conservación.
10. Crecimiento esperado.
11. Margen deseado.
12. Importancia de disponibilidad.
13. Frecuencia de respaldos.

## Traducción a infraestructura

Las respuestas generan factores internos para estimar cuatro recursos principales:

- CPU;
- memoria RAM;
- almacenamiento;
- transferencia.

### CPU

La estimación aumenta principalmente con:

- usuarios simultáneos;
- intensidad de uso;
- generación de reportes;
- generación de PDF;
- tareas automáticas;
- integraciones;
- margen de crecimiento.

### RAM

La memoria aumenta con:

- concurrencia;
- base de datos;
- reportes;
- generación de documentos;
- procesos automáticos;
- integraciones;
- margen operativo.

### Almacenamiento

El disco considera:

- sistema operativo;
- aplicación;
- logs;
- datos estructurados;
- archivos;
- retención;
- crecimiento;
- margen libre.

### Transferencia

La herramienta recomienda una transferencia mínima de referencia.

En instituciones con conectividad no medida o infraestructura propia, esta variable puede interpretarse simplemente como capacidad de red suficiente para el servicio.

## Perfiles

Se generan cuatro perfiles:

- Básico.
- Medio.
- Alto.
- Especial.

El perfil no sustituye la ficha técnica. Su objetivo es facilitar una interpretación rápida del resultado.

## Escenarios

La herramienta presenta:

- Mínimo funcional.
- Recomendado.
- Con crecimiento.

El escenario recomendado es el que debería utilizarse como base para solicitar el VPS.

## Requisitos adicionales

La ficha generada incluye:

- Ubuntu Server 22.04 LTS;
- PostgreSQL;
- almacenamiento NVMe o SSD;
- una IPv4 pública fija;
- acceso SSH;
- TLS/HTTPS;
- firewall;
- backups externos;
- monitoreo básico.

## Limitaciones

El cálculo es heurístico.

No reemplaza:

- pruebas de carga;
- profiling;
- benchmark;
- pruebas de base de datos;
- medición de IOPS;
- revisión de consultas SQL;
- monitoreo real.

## Validación recomendada

Una vez se disponga del VPS, se recomienda simular:

- 1 usuario;
- 5 usuarios;
- 10 usuarios;
- 15 usuarios;
- 25 usuarios;
- 50 usuarios.

Métricas:

- CPU;
- RAM;
- tiempo de respuesta;
- p95;
- p99;
- errores;
- conexiones de base de datos;
- uso de disco.

Esto permite comprobar si el dimensionamiento inicial es suficiente para producción.
