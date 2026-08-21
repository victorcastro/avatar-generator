# Changelog

## [2.0] - 2026-08-21

### Changed
- The sidebar is now three cards instead of two: `Template and name`, `Portrait image`, and `Background image`. The single `Images` card held both dropzones with their own controls stacked underneath, which made it the longest card by far and left the portrait — the layer most people adjust — buried under the background. Each layer now owns a card, and the portrait comes first.
- The `No file selected` line under each dropzone is gone while the layer is empty; the row only appears once it has something to say (a file name or an unsupported-type error), and it collapses again when the layer is cleared. The `Runs in your browser, the first run downloads the model` note under the `Remove background` switch is hidden too — the status line now shows up only while the removal is running or when it fails.
- Framing is no longer bound to the rule that the image must cover the whole circle. Both the zoom floor and the pan bounds existed to guarantee no transparent gap inside the clip; that guarantee is dropped, since the composition already renders transparency for cut-out portraits. Zoom and panning are now free enough to place a small image anywhere in the frame instead of only cropping into it.
- Both zoom sliders now go down to `0.25` instead of stopping at `1`. `1` meant "the image covers the circle exactly", so the old floor made it impossible to place an image smaller than the clip; the gap it leaves is transparent, which the composition already supports since the cut-out portrait shipped.
- Panning no longer stops at the point where the image would stop covering the circle, which left a square photo at the default zoom with about 22px of travel per axis and a landscape one with no vertical travel at all. The bounds now only require the image to keep a quarter of its side overlapping the clip, so it can be dragged until it hangs half outside the circle and still cannot be lost off-canvas.
- The `Zoom in to unlock panning` hint is gone: with the new bounds every loaded layer can be dragged, so the message could never be reached.
- Clearing a layer resets its zoom to the load default (`1.1`) instead of the lowest supported scale, which with the new floor would have left the slider pinned at `0.25`.
- A non-positive scale reaching the wheel handler now recovers on the load default instead of the lowest supported scale.

## [1.9] - 2026-08-21

### Changed
- The sidebar is now the only column: the role select, name field, and both image dropzones moved out of the preview area into the left sidebar, and the preview card holds only the canvas.
- The sidebar is split into two numbered sections, `Template and name` and `Images`, each with its own heading and description, instead of one flat panel.
- The role `<select>` is replaced by a row of community chips (iOS, Android, React, QA, ADM, PM, PO); picking one still drives the same `role` state as before.
- The name field now shows a live `n/64` character counter next to its label.
- Each dropzone is now a horizontal row — icon, file formats, and an `Upload` button — instead of a stacked drag-and-drop panel, matching the rest of the sidebar's density.
- The `Remove background` checkbox is now styled as an iOS-style switch; it is still the same checkbox input underneath, so existing behavior is unchanged.

### Fixed
- A failed background removal left the layer stuck with no way to try again short of re-uploading the file. The failure message now includes a `Retry` link that re-runs the removal, guarded so a second click while a run is already in flight is a no-op.

## [1.8] - 2026-08-21

### Added
- The portrait layer now accepts JPG and WEBP on top of PNG, matching what the background already took. Requiring a pre-cut PNG was the only reason the two layers had different rules.
- Background removal for the portrait, running entirely in the browser through `@imgly/background-removal` and `onnxruntime-web`. It is on by default and a `Remove background` checkbox switches back to the original image; both versions are kept in memory, so toggling never re-runs the model.
- Portraits that already carry a transparent pixel are detected from a downscaled sample and skip the model entirely, so cut-out PNGs keep their own alpha.
- Progress feedback under the checkbox while the model downloads and runs, and an inline failure message that keeps the original image instead of leaving the layer empty.
- A clear button next to each file name, shown only while that layer holds an image. It drops the image, resets the zoom and the offsets, and on the portrait it also drops the cached cut-out. Replacing a layer used to be the only way to get rid of it.

### Changed
- The transparency checkerboard now stays under the composition instead of only showing on the empty state, so the holes left by a cut-out portrait read as transparent. The dashed outline still belongs to the empty state, and neither is drawn when rendering for export.
- `src/index.hbs` declares an import map for `onnxruntime-web`; `@imgly/background-removal` resolves that bare specifier at runtime and cannot load without it.
- The dev server serves `.mjs` as JavaScript and `.wasm` as `application/wasm`.

### Fixed
- A background loaded on its own claimed the hint `Moving the background — release Alt to move the portrait`, naming a modifier that was not held and a portrait that did not exist. It now reads as a plain drag.

### Notes
- Only the two ES modules are vendored into `dist/` (~570 KB). The segmentation model and the ONNX Runtime WebAssembly binaries — around 55 MB for the `isnet_quint8` model — are fetched from `staticimgly.com` on first use and cached by the browser. Images are never uploaded anywhere: only the model travels over the network.
- Removal runs on the WebAssembly execution provider (`device: "cpu"`). WebGPU would be faster but pulls a 23 MB runtime instead of 11.8 MB and is uneven across browsers.

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
