# Avatar Generator

[![Release](https://github.com/victorcastro/avatar-generator/actions/workflows/merge.yml/badge.svg)](https://github.com/victorcastro/avatar-generator/actions/workflows/merge.yml)

Live site: https://victorcastro.github.io/avatar-generator

A simple Node.js tool for generating circular community avatars. It allows you to upload a background image and a portrait (PNG, JPG or WEBP), adjust scale and position, choose a role, and print the result as a PNG.

The portrait background is removed in the browser with `@imgly/background-removal`, so no image ever leaves the machine. The segmentation model and the ONNX Runtime WebAssembly binaries are downloaded on first use from `staticimgly.com` (~55 MB, cached by the browser afterwards) instead of being shipped in `dist/`. Portraits that already carry transparency are left untouched, and the `Remove background` checkbox restores the original image at any time.

## Requirements

- Node.js 24+
- Yarn 1.22+

The project uses modern actions and dependencies compatible with Node 24. It is not intended for earlier versions.

## Run

```bash
yarn install
yarn start
```

Open `http://localhost:3000`.

## Quality and Build

```bash
yarn lint
yarn test
yarn build
```

After `yarn build`, the production-ready static site is available in `dist/`.

## Dependencies

The project is split into runtime and build/quality dependencies:

- Runtime:
  - `@fortawesome/fontawesome-free`
  - `@imgly/background-removal`
  - `@picocss/pico`
  - `handlebars`
  - `lucide`
  - `onnxruntime-web`
- Build and quality:
  - `clean-css`
  - `html-minifier-terser`
  - `terser`
  - `eslint`
  - `@eslint/js`
  - `globals`

## Notes

- [Releases](https://github.com/victorcastro/avatar-generator/releases)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)
