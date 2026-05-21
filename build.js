const fs = require("fs");
const path = require("path");
const CleanCSS = require("clean-css");
const { minify: minifyHtml } = require("html-minifier-terser");
const terser = require("terser");

const rootDir = __dirname;
const distDir = path.join(rootDir, "dist");
const vendorDir = path.join(distDir, "vendor");
const picoSource = path.join(rootDir, "node_modules", "@picocss", "pico", "css", "pico.red.min.css");
const lucideSource = path.join(rootDir, "node_modules", "lucide", "dist", "umd", "lucide.min.js");
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

async function build() {
  cleanDist();
  fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

  copyFile(picoSource, path.join(vendorDir, "pico.red.min.css"));
  copyFile(lucideSource, path.join(vendorDir, "lucide.min.js"));
  copyFile(fontAwesomeCssSource, path.join(vendorDir, "fontawesome", "css", "all.min.css"));
  copyDirectory(fontAwesomeWebfontsSource, path.join(vendorDir, "fontawesome", "webfonts"));
  await writeMinifiedTextFile(path.join(rootDir, "styles.css"), path.join(distDir, "styles.css"), async (css) =>
    minifyCss(css)
  );
  await writeMinifiedTextFile(path.join(rootDir, "avatar-core.js"), path.join(distDir, "avatar-core.js"), (js) =>
    terser.minify(js, {
      compress: true,
      mangle: true
    }).then((result) => {
      if (result.error) {
        throw result.error;
      }

      return result.code || "";
    })
  );
  await writeMinifiedTextFile(path.join(rootDir, "script.js"), path.join(distDir, "script.js"), (js) =>
    terser.minify(js, {
      compress: true,
      mangle: true
    }).then((result) => {
      if (result.error) {
        throw result.error;
      }

      return result.code || "";
    })
  );

  await writeMinifiedTextFile(path.join(rootDir, "index.html"), path.join(distDir, "index.html"), (html) =>
    minifyHtml(
      html
        .replace("/node_modules/@picocss/pico/css/pico.red.min.css", "./vendor/pico.red.min.css")
        .replace("/node_modules/@fortawesome/fontawesome-free/css/all.min.css", "./vendor/fontawesome/css/all.min.css")
        .replace("/node_modules/lucide/dist/umd/lucide.min.js", "./vendor/lucide.min.js"),
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
