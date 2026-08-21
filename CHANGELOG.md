# Changelog

## [1.7] - 2026-08-21

### Added
- Direct manipulation on the preview: drag the portrait to reposition it, hold `Alt` to drag the background instead. The hint under the canvas rewrites itself as `Alt` is pressed and released so the shortcut is discoverable. When no portrait is loaded, dragging moves the background so the gesture is never dead.
- Wheel zoom anchored at the cursor, so the point under the pointer stays pinned while scaling. The zoom slider reuses the same math anchored at the canvas center.
- Drag-and-drop upload zones for both layers, plus dropping a file straight onto the canvas (`Alt` targets the background). Rejected file types now report inline instead of opening a blocking `alert`.
- Keyboard panning on the focused canvas: arrows move 1px, `Shift`+arrow moves 10px, `Alt`+arrow moves the background. Double-click recenters the active layer.
- A transparency checkerboard and dashed outline inside the circle while no image is loaded, so the avatar area reads as a distinct drop target instead of blending into the frame. It is a preview affordance only and is skipped when rendering for export. The frame itself now carries a faint grid to read as a canvas.

### Changed
- Images now load at 1.1 zoom. Cover is exact at zoom 1, which leaves a square image with zero panning slack; loading slightly zoomed guarantees there is always something to drag.
- Offsets are clamped so a layer can never expose a transparent gap inside the circle, and are re-clamped when the zoom is reduced.
- Rendering is coalesced through `requestAnimationFrame` instead of redrawing synchronously on every input event. The download button still renders synchronously so the exported PNG is never a stale frame.
- The minimum zoom is now 1 (was 0.5). Any value below 1 was guaranteed to expose a gap.
- Pinned the root font size to 16px. Pico scales it up to 131.25% (21px) past the 1536px breakpoint, which oversized the whole rem-based layout on wide screens.
- Flattened the workspace: the settings and preview panels no longer render as bordered cards, the `Settings` heading is gone, and the download button and the hint now float over the canvas instead of sitting in their own rows.
- UI messages no longer end in a period, and the two-sentence hints use an em dash instead.
- The iOS and Android roles now draw their real brand logos from `src/icons/`, keeping Swift's orange-to-red gradient and Android's green, instead of the flat single-colour Font Awesome glyphs. Roles can now declare `iconProvider: "svg"` with an `iconSrc`; if the file fails to load, the Font Awesome glyph is still drawn as a fallback.

### Fixed
- The two vertical axes moved in opposite directions: the background used the raw slider value while the portrait inverted it. Both axes now follow the cursor.

### Removed
- The four position sliders, including the vertical one that was a horizontal `input[type=range]` rotated `-90deg`.
- The dark ring stroked around the avatar, both in the preview and in the exported PNG.

### Notes
- On some Linux window managers `Alt`+drag is captured by the desktop and never reaches the browser. The zoom slider and double-click reset remain available there.

## [1.6] - 2026-08-21

### Changed
- Replaced `ci.yml`, `tag-release.yml`, and `deploy-pages.yml` with `pull-request.yml` (pull requests: version/changelog gate, quality checks, build) and `merge.yml` (pushes to `main`: quality checks, release tagging, GitHub Pages build and deploy).
- Pull requests now gate on a version bump (`package.json`) and matching `CHANGELOG.md` entry versus `main` before merge; the check runs first and blocks the rest of the pipeline on failure.

## [1.5] - 2026-05-21

### Updated
- Frontend source files are now grouped under `src/` to keep source and build output separated.
- The homepage now builds from `src/index.hbs` into static `dist/index.html`.
- The project now uses `yarn` as its package manager and CI install command.

## [1.4] - 2026-05-21

### Added
- Social sharing metadata in the homepage template for richer previews in WhatsApp and other clients.
- Dedicated `og-image.png` asset for Open Graph and Twitter previews.
- Subtle visible version label in the homepage header to identify the active web revision.
- `Handlebars` templating for the homepage so the visible app version is rendered from `package.json`.

### Features
- The static build now copies `og-image.png` into `dist/` for deployment.
- The homepage now builds from `index.hbs` into static `dist/index.html`.

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
