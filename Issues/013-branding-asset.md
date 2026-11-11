# Branding con asset real en la app

- **Estado:** Hecho
- **REQ:** REQ-013
- **Tipo:** fix
- **Área:** `src/components/layout/`, `src/assets/logo.png`, `public/icons/`, `vite.config.ts`, `index.html`
- **GitHub:** [#13](https://github.com/alonsomoros/ALON_alxns-hub-app/issues/13)
- **Actualizada:** 2026-11-11

## Problema

La marca usaba un texto provisional (`AX`) en lugar del logo real, y el manifest PWA apuntaba a un icono anterior, por lo que la instalación móvil mostraba una identidad distinta de la app.

## Decisión

Usar `src/assets/logo.png` en splash, cabecera, favicon y manifest PWA, con los iconos `public/icons/logo-*.png`. El texto `alXns` queda como complemento. El contenedor conserva proporción en móvil y el fondo claro `#f5f7f4` mejora el contraste del logo verde.

## Criterios de aceptación

- [x] El splash muestra el logo real.
- [x] La cabecera usa el mismo logo.
- [x] El logo no se deforma en tamaños pequeños ni grandes.
- [x] La instalación PWA ofrece los iconos de `/icons/` con el fondo claro.

## Verificación

`npm run lint` y `npm run build` OK. Validación visual manual en la entrega original.

## Impacto documental

Sin cambio posterior.

## Pendientes

- [ ] Decidir si hace falta una versión dark/light del logo cuando exista el tema oscuro → backlog (preferencias).
