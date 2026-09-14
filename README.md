# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

npm run dev -- --host 0.0.0.0

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Autenticación de Academia Aristóteles

Inicia primero PostgreSQL y el backend siguiendo `../aristoteles_be/README.md`.

```bash
npm install
npm run dev
```

Abre `/login`, selecciona **Administrador** e ingresa con `admin` / `admin2026` después del seed. Desde `/admin` puedes crear cuentas de docentes, estudiantes o administradores.

- `ADMIN` → `/admin` (gestión de usuarios).
- `TEACHER` → `/teacher` (módulo pendiente).
- `STUDENT` → `/` (dashboard existente, con sus datos de demostración).

La sesión se restaura con `/api/auth/me`; el botón de salida está junto al perfil en la barra superior. Todas las llamadas usan `/api/...` a través del proxy de Vite. No se guardan tokens en localStorage. Las rutas de otros roles redirigen al dashboard propio, y el backend también valida los permisos.

Los textos de interfaz están en `src/locales/es.json`. Verifica los cambios con `npm run build` y `npm run lint`.
