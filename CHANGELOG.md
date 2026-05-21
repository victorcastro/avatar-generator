# Changelog

## [1.5] - 2026-05-21

### Updated
- Frontend source files are now grouped under `src/` to keep source and build output separated.
- The homepage now builds from `src/index.hbs` into static `dist/index.html`.

## [1.4] - 2026-05-21

### Added
- Social sharing metadata in the homepage template for richer previews in WhatsApp and other clients.
- Dedicated `og-image.png` asset for Open Graph and Twitter previews.
- Subtle visible version label in the homepage header to identify the active web revision.
- `Handlebars` templating for the homepage so the visible app version is rendered from `package.json`.

### Features
- The static build now copies `og-image.png` into `dist/` for deployment.

## [1.3] - 2026-05-21

### Release Automation
- Removed automatic GitHub Release generation from the pipeline.
- The workflow now creates only numeric tags from `package.json` on merges to `main`.

## [1.2] - 2026-05-21

### Release Automation
- Added a GitHub Actions workflow that creates numeric tags from `package.json` on merges to `main`.
- The release workflow now creates a GitHub Release using the matching section from `CHANGELOG.md`.

## [1.1] - 2026-05-21

### Added
- Subtle GitHub repo link in the hero header with a `View code` label.
- Automated GitHub Actions workflow that creates numeric tags from `package.json` on merges to `main`.

### Updated
- All homepage copy in `index.html` is now in English.
- Card headers keep the rounded top corners visually clean.

## [1.0] - 2026-05-19

### Added
- Generacion de avatares circulares para comunidades y equipos.
- Carga de imagen de fondo en `PNG`, `JPG` o `WEBP`.
- Carga de retrato en `PNG` con soporte para composicion sobre el fondo.
- Ajustes en vivo de escala y posicion horizontal/vertical para fondo y persona.
- Selector de rol con iconos integrados para `iOS`, `Android`, `React`, `QA`, `ADM`, `PM` y `PO`.
- Render de iconos con `Font Awesome` para marcas y roles generales.
- Vista previa inmediata en `canvas`.
- Texto del avatar editable con ajuste automatico de tamano para que encaje.
- Exportacion directa a `PNG` desde la interfaz.
- Nombre de archivo de descarga generado de forma segura a partir del rol y el titulo.
- Estilos de interfaz orientados a una vista estatica, lista para hosting simple.

### Build
- `npm run build` genera un sitio estatico en `dist/`.
- El build minifica `HTML`, `CSS` y `JavaScript`.
- El build copia dependencias visuales a `dist/vendor/`.
- Se incluye `.nojekyll` para despliegue en GitHub Pages.

### Runtime
- Servidor local Node.js para desarrollo con `npm start`.
- Carga de `Lucide` para los iconos secundarios de la interfaz.
- Carga local de `Font Awesome` para los iconos de rol.
