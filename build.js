const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const distDir = path.join(rootDir, "dist");
const vendorDir = path.join(distDir, "vendor");
const picoSource = path.join(rootDir, "node_modules", "@picocss", "pico", "css", "pico.red.min.css");
const lucideSource = path.join(rootDir, "node_modules", "lucide", "dist", "umd", "lucide.min.js");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(source, destination) {
  ensureDir(path.dirname(destination));
  fs.copyFileSync(source, destination);
}

function copyTextFile(source, destination, transform) {
  const content = fs.readFileSync(source, "utf8");
  const output = typeof transform === "function" ? transform(content) : content;
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, output);
}

function cleanDist() {
  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(vendorDir);
}

cleanDist();
fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

copyFile(picoSource, path.join(vendorDir, "pico.red.min.css"));
copyFile(lucideSource, path.join(vendorDir, "lucide.min.js"));
copyFile(path.join(rootDir, "styles.css"), path.join(distDir, "styles.css"));
copyFile(path.join(rootDir, "script.js"), path.join(distDir, "script.js"));

copyTextFile(path.join(rootDir, "index.html"), path.join(distDir, "index.html"), (html) =>
  html
    .replace("/node_modules/@picocss/pico/css/pico.red.min.css", "./vendor/pico.red.min.css")
    .replace("/node_modules/lucide/dist/umd/lucide.min.js", "./vendor/lucide.min.js")
);

copyTextFile(path.join(rootDir, "README.md"), path.join(distDir, "README.md"));

console.log(`Built static site in ${path.relative(rootDir, distDir)}/`);
