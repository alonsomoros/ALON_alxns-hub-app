# <Título corto>

- **Estado:** Propuesta | En curso | Hecho | Bloqueado | Descartado
- **REQ:** REQ-NNN (mismo NNN que el nombre de este archivo)
- **Tipo:** feat | fix | docs | architecture | ci | chore | refactor
- **Área:** <carpetas/módulos afectados>
- **GitHub:** [#N](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/N) (creada con `gh issue create`; no inventar números)
- **Actualizada:** AAAA-MM-DD

## Problema

Qué comportamiento o necesidad motiva el cambio y qué NO se cambia.

## Decisión

Solución elegida y alternativas descartadas (una línea cada una). Una propuesta no es decisión de arquitectura: si es de alto impacto, queda como `Propuesta` hasta aprobación.

## Criterios de aceptación

- [ ] Condición observable y verificable 1.
- [ ] Condición observable y verificable 2.

## Verificación

| Check | Resultado |
|---|---|
| `npm run lint` | |
| `npm run build` | |
| Test/manual: <qué se comprobó> | |

Tests de caja negra: `REQ-NNN ...` (`npm test`) u `Omitido: no cubierto por el runner` con la comprobación manual (ver `REQ-020`).

## Impacto documental

Lista de documentos actualizados o `Sin cambio: motivo` por cada artefacto de la matriz de `WORKFLOW.md` §3.

## Pendientes

- [ ] Pendiente concreto → destino (`REQ-NNN`, backlog o `[BLOQUEADO] motivo`).
