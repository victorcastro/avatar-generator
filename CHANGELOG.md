# Changelog

## [1.0.0] - Current

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

