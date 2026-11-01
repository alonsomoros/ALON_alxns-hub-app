# Parámetros y preferencias

## Problema

Hay decisiones de presentación que deben ser configurables, pero una pantalla de ajustes temprana añadiría ruido a la experiencia inicial.

## Solución propuesta

Mantener una configuración tipada separada de los datos: tema, modo, fuente de citas, orden de servicios y presentación de métricas. Preparar los componentes para aceptar estas opciones y persistirlas mediante el adaptador definido en `REQ-018`, con caché local y sincronización remota posterior a la configuración del transporte.

## Decisión

Se mantiene `DashboardConfig` con `theme: soft`, `mode: light`, `quote: random`, `orderServices` y `raspberryPiStatsShowcase: pbar`. La pantalla pública de preferencias queda pospuesta. La persistencia multidispositivo se propone en `Issues/018-persistencia-personal-multidispositivo.md`; hasta aprobar el transporte, la app conserva el fallback local y no se añaden secretos ni configuración real.
