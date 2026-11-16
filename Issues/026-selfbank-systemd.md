# selfbank real como servicio systemd

- **Estado:** En curso (unidad preparada y validada; instalación en la Pi pendiente)
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
- [ ] Instalada en la Pi: `systemctl is-active selfbank-real` da `active` y `curl http://127.0.0.1:8789/api/health` da `{"ok": true}`.
- [ ] Tras un reinicio de la Pi el servicio vuelve solo y la pestaña «Consultas» responde.

## Verificación

| Check | Resultado |
|---|---|
| `systemd-analyze verify` sobre una copia temporal en la Pi (borrada después) | Sin avisos; `systemd-analyze security --offline`: 4.6 OK |
| Instalación y reinicio en la Pi | Pendiente: la ejecuta el desarrollador (necesita `sudo`) |

Tests de caja negra: `Omitido: no cubierto por el runner` (es configuración de despliegue); la comprobación es manual, tras instalar.

## Impacto documental

Actualizados: `docs/arquitectura/deploy-persistencia-raspberry.md` (sección `systemd` y token), `.agents/context/system-status.md`, `docs/requisitos/backlog-features.md`, `Issues/README.md`. Sin cambio: `docs/diagramas/` (no cambia el flujo), `.agents/skills/` (no cambian endpoints ni widgets).

## Pendientes

- [ ] Instalar la unidad (pasos en la sección «`selfbank` como servicio de `systemd`» del documento de despliegue) y comprobar el reinicio.
- [ ] Sincronización periódica de los datos bancarios → repositorio `selfbank`.
