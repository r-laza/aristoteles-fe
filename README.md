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

## Ciclos académicos

`/admin/cycles` consulta y crea ciclos en PostgreSQL mediante `/api/admin/cycles`. Cada tarjeta abre `/admin/cycles/:id`, donde se crean grupos y se inscriben estudiantes existentes. Primero crea un grupo; después selecciona un estudiante, su grupo y el descuento opcional. El backend valida y calcula los importes definitivos.

Los ciclos de la primera versión guardados únicamente en localStorage no se importan automáticamente. Ese almacenamiento permanece intacto, pero la página ahora muestra los ciclos del servidor.

## Gestión de pagos

`/admin/payments` permite seleccionar un ciclo y consultar los saldos de sus inscripciones. Selecciona inicialmente el ciclo activo; si no existe, utiliza el siguiente ciclo de la lista ordenada. Registra pagos desde cada fila y consulta su historial con el botón correspondiente. Los resúmenes y estados se actualizan después de registrar un pago. La información persiste en PostgreSQL mediante las rutas relativas `/api/admin/payments/...`.
