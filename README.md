# Avatar Generator

[![Deploy GithubPages](https://github.com/victorcastro/avatar-generator/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/victorcastro/avatar-generator/actions/workflows/deploy-pages.yml)
[![Build Check](https://github.com/victorcastro/avatar-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/victorcastro/avatar-generator/actions/workflows/ci.yml)

Live site: https://victorcastro.github.io/avatar-generator

A simple Node.js tool for generating circular community avatars. It allows you to upload a background image, a transparent PNG of the person, adjust scale and position, choose a role, and print the result as a PNG.

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
