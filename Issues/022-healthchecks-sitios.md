# Estado real de los sitios (healthchecks) vía la API personal

- **Estado:** Hecho
- **REQ:** REQ-022
- **Tipo:** feat
- **Área:** `server/health.js`, `server/index.js`, `src/domain/siteHealth.ts`, `src/infrastructure/siteHealth.ts`, `src/hooks/useSiteHealth.ts`, `src/components/home/HomeView.tsx`, `.env.example`
- **GitHub:** [#22](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/22)
- **Actualizada:** 2026-11-11

## Problema

El estado `online`/`offline` de la tarjeta «Tus sitios» era un dato de ejemplo fijo en `src/data/dashboardData.ts`: mostraba «online» aunque el sitio estuviera caído.

## Decisión

La API personal comprueba los sitios y la PWA lo consulta. Sin `blackbox-exporter` ni n8n (menos piezas que mantener); `blackbox-exporter` queda como alternativa futura si se quiere histórico en Grafana.

```text
PWA --(poll 60 s, timeout 1.5 s)--> GET /api/sites/health --> caché 60 s --> HEAD (GET si 405/501) a cada sitio, 4 s
```

- **Contrato:** `{ "checkedAt": "ISO", "sites": [{ "url", "ok", "status", "ms" }] }`. `ok` es `true` con 2xx o 3xx; un sitio inalcanzable da `ok: false`, `status: null`, `ms: null`. Cada sitio falla por separado.
- **Seguridad:** la API comprueba solo las URLs de su configuración (`HEALTHCHECK_URLS`, lista separada por comas; por defecto los tres sitios actuales; máximo 10; solo `http`/`https`). Ignora cualquier URL que envíe el cliente, para que no sirva de proxy a destinos arbitrarios (probado con `?url=`).
- **Rendimiento:** caché de 60 s con una sola ronda de comprobaciones compartida entre peticiones, renovación en segundo plano al caducar (responde al instante con el resultado anterior) y precalentamiento al arrancar, porque la ronda puede tardar hasta 4 s y la PWA espera 1.5 s.
- **PWA:** `useSiteHealth` sondea cada 60 s con Inicio abierto y la pestaña visible, y al volver a ella. `ServicesCard` asocia cada servicio por URL normalizada (misma normalización en cliente y servidor, con prueba de paridad). Con API pinta `online`, `offline` o `unknown` («sin comprobar», punto gris) y nunca supone que un sitio está arriba sin dato; sin API configurada mantiene los datos de ejemplo.
- **Descartado:** que el cliente envíe las URLs a comprobar (riesgo de proxy abierto) y comprobar desde el navegador (CORS y sin dato de caída real).

## Criterios de aceptación

- [x] `GET /api/sites/health` devuelve el estado de los sitios configurados, con caché y CORS de la API.
- [x] 2xx y 3xx cuentan como arriba; 4xx, 5xx, timeout y error de red, como caído; un sitio no afecta a los demás.
- [x] La API ignora las URLs recibidas del cliente.
- [x] La tarjeta «Tus sitios» muestra el estado real (`online`, `offline`, `unknown`) y conserva los datos de ejemplo sin API.
- [x] Desplegado en la Raspberry y comprobado por Tailscale con el origen de Vercel.

## Verificación

| Check | Resultado |
|---|---|
| `npm test` | OK: 110 pruebas (`tests/health-server.test.ts`, `tests/siteHealth.test.ts` y el endpoint en `tests/api.test.ts` con sitios simulados: 200, 500 e inalcanzable) |
| `npm run lint` / `npm run build` / `tsc -b` / `node --check server/*.js` | OK |
| API local contra los tres sitios reales | OK: `200` en ~6 ms desde caché; los tres arriba (el más lento, `hipoglifo.es`, 1,9 s) |
| Chrome contra la API local | OK: tres sitios `online`; con una respuesta simulada, uno `offline` (punto rojo) y otro `unknown` (punto gris); sin errores de consola |
| Despliegue en la Pi (ejecutado por el desarrollador) | OK: `3bf31b3`, `ci-cd-alxns-persistence-1` `healthy` |
| `GET https://raspberrypi.tail6f4cba.ts.net/api/sites/health` con `Origin: https://alxns-hub.vercel.app` | OK: `200`, CORS correcto y los tres sitios arriba (`hipoglifo.es` 2,8 s, `el-negredo` 0,3 s, `alonsomoros.github.io` 0,2 s); la segunda llamada sale de caché (~30 ms) |
| `?url=http://169.254.169.254/` en la petición | OK: se ignora; devuelve solo los sitios configurados |
| `GET /api/quote`, `GET /api/pi/metrics` y `GET /api/state` tras el despliegue | OK; las preferencias incluyen `updatedAt` (del cliente) y `savedAt` (del servidor) |

## Impacto documental

Actualizados: `docs/arquitectura/{integrations-n8n-grafana,system-architecture}.md`, `docs/codebase/{INTEGRATIONS,CONCERNS}.md`, `docs/requisitos/{functional-requirements,backlog-features}.md`, `Issues/{004,010,011}`, `.agents/context/{system-status,environment-vars}.md`, `.env.example`.

## Pendientes

- [x] Desplegada y verificada en la Raspberry (2026-11-11), junto con la corrección de `preferences.updatedAt`/`savedAt` (`REQ-020`).
- [ ] `hipoglifo.es` tarda ~2,8 s desde la Pi, cerca del límite de 4 s: si empieza a marcarse caído sin estarlo, subir el timeout o investigar el sitio.
- [ ] La lista de sitios vive en dos sitios (datos de ejemplo del cliente y `HEALTHCHECK_URLS` del servidor): unificarla cuando los sitios dejen de ser datos de prototipo (`REQ-014`).
- [ ] Histórico de disponibilidad y alertas de caída → backlog (Alertmanager → n8n).
