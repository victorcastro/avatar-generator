# Avatar Generator

A simple Node.js tool for generating circular community avatars. It allows you to upload a background image, a transparent PNG of the person, adjust scale and position, choose a role, and print the result as a PNG.

## Requisitos

- Node.js 18+

## Run

```bash
npm install
npm start
```

open `http://localhost:3000`.

## Export for static site

```bash
npm run build
```

## Dependencies

- `@picocss/pico`
- `lucide`

## Notes

- El render vive en `canvas`
- La exportación usa el mismo estado que el preview
