# selfbank real como servicio systemd

- **Estado:** En curso (instalada y activa en la Pi; falta comprobar el arranque tras un reinicio)
- **REQ:** REQ-026
- **Tipo:** chore
- **Área:** `docs/ci-cd/selfbank-real.service`, `docs/arquitectura/deploy-persistencia-raspberry.md`
- **GitHub:** [#26](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/26)
- **Actualizada:** 2026-11-16

## Problema

El servicio real de `selfbank` (`REQ-024`) se lanza con `~/run-selfbank-real.sh`: guarda el PID en `/tmp` (se borra al reiniciar) y no vuelve a arrancar solo tras un reinicio de la Pi ni si el proceso cae. Mientras tanto la pestaña «Consultas» muestra error de red. NO se cambia el código de `selfbank` ni el contrato.

## Decisión

Unidad de `systemd` del sistema (`/etc/systemd/system/selfbank-real.service`), usuario `alonso`, `Restart=on-failure`, mismos argumentos que el script (token desde `~/.selfbank/api-token`, `--cors-origin` de Vercel y localhost), escritura permitida solo en `~/.selfbank`. Alternativas descartadas: unidad de usuario (exige `loginctl enable-linger`); contenedor Docker (el servicio depende de Ollama en el host y de la base en `~/.selfbank`).

## Criterios de aceptación

- [x] La unidad existe en el repositorio y `systemd-analyze verify` no da avisos (exposición de seguridad 4.6 «OK»).
- [x] La documentación explica qué es, cómo se instala, cómo se comprueba y la marcha atrás, y documenta el token (dónde está, uso, rotación).
- [x] Instalada en la Pi: `systemctl is-active selfbank-real` da `active` y `curl http://127.0.0.1:8789/api/health` da `{"ok": true}`.
- [ ] Tras un reinicio de la Pi el servicio vuelve solo y la pestaña «Consultas» responde.

## Verificación

| Check | Resultado |
|---|---|
| `systemd-analyze verify` sobre una copia temporal en la Pi (borrada después) | Sin avisos; `systemd-analyze security --offline`: 4.6 OK |
| Instalación en la Pi (2026-11-16, la ejecutó el desarrollador con `sudo`) | `is-active` → `active`, `is-enabled` → `enabled`, 0 reinicios, un solo proceso `selfbank.api.serve` (el del script ya no está), escucha solo en `127.0.0.1:8789`, `/api/health` → `{"ok": true}`, el diario muestra el arranque |
| Reinicio de la Pi | Pendiente: no se ha reiniciado (afecta a todos los servicios de la Pi); `enabled` indica que arrancará solo |

Tests de caja negra: `Omitido: no cubierto por el runner` (es configuración de despliegue); la comprobación es manual, tras instalar.

## Impacto documental

Actualizados: `docs/arquitectura/deploy-persistencia-raspberry.md` (sección `systemd` y token), `.agents/context/system-status.md`, `docs/requisitos/backlog-features.md`, `Issues/README.md`. Sin cambio: `docs/diagramas/` (no cambia el flujo), `.agents/skills/` (no cambian endpoints ni widgets).

## Pendientes

- [ ] Comprobar el arranque tras el próximo reinicio de la Pi (`systemctl is-active selfbank-real`); entonces la nota pasa a `Hecho` y se cierra #26.
- [ ] Sincronización periódica de los datos bancarios: implementada en el repositorio `selfbank` el 2026-11-16 (`selfbank/sync.py`, `deploy/selfbank-sync.{service,timer}`, `docs/despliegue-sync.md`; 237 pruebas) y pendiente de desplegar en la Pi. No es parte de `REQ-026`; seguimiento en ese repositorio.
