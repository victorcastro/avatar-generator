# Avatar Generator

[![Deploy GithubPages](https://github.com/victorcastro/avatar-generator/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/victorcastro/avatar-generator/actions/workflows/deploy-pages.yml)
[![Build Check](https://github.com/victorcastro/avatar-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/victorcastro/avatar-generator/actions/workflows/ci.yml)

Live site: https://victorcastro.github.io/avatar-generator

A simple Node.js tool for generating circular community avatars. It allows you to upload a background image, a transparent PNG of the person, adjust scale and position, choose a role, and print the result as a PNG.

The main page is authored as a `Handlebars` template in `index.hbs`. During local development, `npm start` renders that template on the fly, and `npm run build` compiles it into a static `dist/index.html` ready for GitHub Pages or any static hosting.

## Requirements

- Node.js 24+
- npm 10+

The project uses modern actions and dependencies compatible with Node 24. It is not intended for earlier versions.

## Run

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Quality and Build

```bash
npm run lint
npm test
npm run build
```

After `npm run build`, the production-ready static site is available in `dist/`.

## Dependencies

The project is split into runtime and build/quality dependencies:

- Runtime:
  - `@fortawesome/fontawesome-free`
  - `@picocss/pico`
  - `handlebars`
  - `lucide`
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
