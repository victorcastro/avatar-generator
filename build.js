import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import CleanCSS from "clean-css";
import { minify as minifyHtml } from "html-minifier-terser";
import * as terser from "terser";

const rootDir = import.meta.dirname;
const distDir = path.join(rootDir, "dist");
const vendorDir = path.join(distDir, "vendor");
const sourceDir = path.join(rootDir, "src");
const templateSource = path.join(sourceDir, "index.hbs");
const stylesSource = path.join(sourceDir, "styles", "styles.css");
const scriptsSource = path.join(sourceDir, "scripts");
const assetsSource = path.join(sourceDir, "assets");
const picoSource = path.join(rootDir, "node_modules", "@picocss", "pico", "css", "pico.red.min.css");
const lucideSource = path.join(rootDir, "node_modules", "lucide", "dist", "umd", "lucide.min.js");
const backgroundRemovalSource = path.join(
  rootDir,
  "node_modules",
  "@imgly",
  "background-removal",
  "dist",
  "index.mjs"
);
const onnxRuntimeSource = path.join(
  rootDir,
  "node_modules",
  "onnxruntime-web",
  "dist",
  "ort.wasm.bundle.min.mjs"
);
const fontAwesomeCssSource = path.join(
  rootDir,
  "node_modules",
  "@fortawesome",
  "fontawesome-free",
  "css",
  "all.min.css"
);
const fontAwesomeWebfontsSource = path.join(
  rootDir,
  "node_modules",
  "@fortawesome",
  "fontawesome-free",
  "webfonts"
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function copyDirectory(source, destination) {
  ensureDir(destination);

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath);
      continue;
    }

    copyFile(sourcePath, destinationPath);
  }
}

function copyTextFile(source, destination, transform) {
  const content = fs.readFileSync(source, "utf8");
  const output = typeof transform === "function" ? transform(content) : content;
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, output);
}

async function writeMinifiedTextFile(source, destination, minify) {
  const content = fs.readFileSync(source, "utf8");
  const output = await minify(content);
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, output);
}

async function minifyModule(source) {
  const result = await terser.minify(source, {
    compress: true,
    mangle: true,
    module: true
  });

  if (result.error) {
    throw result.error;
  }

  return result.code || "";
}

async function minifyModuleTree(source, destination) {
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await minifyModuleTree(sourcePath, destinationPath);
      continue;
    }

    await writeMinifiedTextFile(sourcePath, destinationPath, minifyModule);
  }
}

function minifyCss(source) {
  const output = new CleanCSS({
    level: 2
  }).minify(source);

  if (output.errors && output.errors.length > 0) {
    throw new Error(output.errors.join("\n"));
  }

  return output.styles || "";
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(vendorDir);
}

function getTemplateContext() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));

  return {
    appVersion: packageJson.version
  };
}

function renderIndexTemplate() {
  const template = fs.readFileSync(templateSource, "utf8");
  return Handlebars.compile(template)(getTemplateContext());
}

async function build() {
  cleanDist();
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

  copyFile(picoSource, path.join(vendorDir, "pico.red.min.css"));
  copyFile(lucideSource, path.join(vendorDir, "lucide.min.js"));
  copyFile(backgroundRemovalSource, path.join(vendorDir, "background-removal.mjs"));
  copyFile(onnxRuntimeSource, path.join(vendorDir, "onnxruntime-web.mjs"));
  copyFile(fontAwesomeCssSource, path.join(vendorDir, "fontawesome", "css", "all.min.css"));
  copyDirectory(fontAwesomeWebfontsSource, path.join(vendorDir, "fontawesome", "webfonts"));
  copyDirectory(assetsSource, path.join(distDir, "assets"));
  await writeMinifiedTextFile(stylesSource, path.join(distDir, "styles", "styles.css"), async (css) =>
    minifyCss(css)
  );
  await minifyModuleTree(scriptsSource, path.join(distDir, "scripts"));

  await writeMinifiedTextFile(templateSource, path.join(distDir, "index.html"), () =>
    minifyHtml(
      renderIndexTemplate()
        .replace("/node_modules/@picocss/pico/css/pico.red.min.css", "./vendor/pico.red.min.css")
        .replace("/node_modules/@fortawesome/fontawesome-free/css/all.min.css", "./vendor/fontawesome/css/all.min.css")
        .replace("/node_modules/lucide/dist/umd/lucide.min.js", "./vendor/lucide.min.js")
        .replace(
          "/node_modules/@imgly/background-removal/dist/index.mjs",
          "./vendor/background-removal.mjs"
        )
        .replace(
          "/node_modules/onnxruntime-web/dist/ort.wasm.bundle.min.mjs",
          "./vendor/onnxruntime-web.mjs"
        ),
      {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true
      }
    )
  );

  copyTextFile(path.join(rootDir, "README.md"), path.join(distDir, "README.md"));

  console.log(`Built static site in ${path.relative(rootDir, distDir)}/`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
