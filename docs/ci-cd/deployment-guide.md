# Guía de despliegue

1. Construye la PWA con `npm ci` y `npm run build`; sirve `dist/` detrás de HTTPS con fallback de SPA a `index.html`.
2. Construye y levanta la API de persistencia con `docker compose -f docs/ci-cd/docker-compose.yml up -d --build`.
3. Conserva el volumen `alxns-persistence-data` y respáldalo según la política definida en `docs/arquitectura/deploy-persistencia-raspberry.md`.
4. Define `ALLOWED_ORIGINS` con el origen real de la PWA; las URLs de n8n y Grafana se mantienen separadas como configuración de integración.
5. Verifica `/health`, manifest, service worker y navegación offline desde Lighthouse.

El contenedor de producción debe servir los estáticos con un servidor HTTP ligero y no exponer secretos al cliente.
