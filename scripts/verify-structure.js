const fs = require("fs");
const path = require("path");

const repo = path.resolve(__dirname, "..");
const publicDir = path.join(repo, "public");
const errors = [];

function requireFile(file, source = "project") {
    const absolute = path.resolve(publicDir, file);
    const relative = path.relative(publicDir, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        errors.push(`${source}: path escapes public/: ${file}`);
    } else if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
        errors.push(`${source}: missing ${file}`);
    }
}

function localReference(value) {
    if (!value || /^(?:[a-z]+:|#|data:|\/\/)/i.test(value)) return null;
    const reference = value.split(/[?#]/, 1)[0].replace(/^\/+/, "");
    return reference === "." || reference === "./" ? null : reference;
}

for (const htmlName of ["index.html", "app.html"]) {
    const html = fs.readFileSync(path.join(publicDir, htmlName), "utf8");
    const attributes = html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi);
    for (const match of attributes) {
        const reference = localReference(match[1]);
        if (reference) requireFile(reference, htmlName);
    }
}

const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, "manifest.webmanifest"), "utf8"));
for (const icon of manifest.icons || []) requireFile(localReference(icon.src), "manifest.webmanifest");

const serviceWorker = fs.readFileSync(path.join(publicDir, "sw.js"), "utf8");
const precacheSource = serviceWorker.match(/const PRECACHE = \[([\s\S]*?)\];/);
if (!precacheSource) {
    errors.push("sw.js: PRECACHE list not found");
} else {
    for (const match of precacheSource[1].matchAll(/"([^"]+)"/g)) {
        const reference = localReference(match[1]);
        if (reference) requireFile(reference, "sw.js");
    }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8"));
if (!packageJson.build?.files?.includes("public/**")) {
    errors.push("package.json: Electron build does not include public/**");
}
if (packageJson.build?.win?.icon !== "public/assets/icons/icon-512.png") {
    errors.push("package.json: Electron icon is outside public/assets/icons");
}

if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
}

console.log("Structure OK: HTML, manifest, Service Worker and Electron assets resolve inside public/.");
