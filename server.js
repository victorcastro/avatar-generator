const http = require("http");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const PORT = process.env.PORT || 3000;
const HOST = "127.0.0.1";
const ROOT = __dirname;
const SOURCE_DIR = path.join(ROOT, "src");
const TEMPLATE_PATH = path.join(SOURCE_DIR, "index.hbs");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function resolveFile(urlPath) {
  const cleanPath = urlPath === "/" ? "/index.html" : urlPath;
  const sourcePath = path.normalize(path.join(SOURCE_DIR, cleanPath));

  if (sourcePath.startsWith(SOURCE_DIR) && fs.existsSync(sourcePath)) {
    return sourcePath;
  }

  const rootPath = path.normalize(path.join(ROOT, cleanPath));

  if (!rootPath.startsWith(ROOT)) {
    return null;
  }

  return rootPath;
}

function getTemplateContext() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));

  return {
    appVersion: packageJson.version
  };
}

function renderIndex() {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  return Handlebars.compile(template)(getTemplateContext());
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];

  if (urlPath === "/" || urlPath === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderIndex());
    return;
  }

  const filePath = resolveFile(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      res.writeHead(500);
      res.end("Internal Server Error");
      return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Avatar generator running at http://${HOST}:${PORT}`);
});
