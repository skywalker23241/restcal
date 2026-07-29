const {spawn} = require("child_process");
const path = require("path");

const repo = path.resolve(__dirname, "..");
const port = 18765;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(repo, "server.js")], {
    cwd: repo,
    env: {...process.env, PORT: String(port)},
    stdio: ["ignore", "pipe", "pipe"]
});

let stderr = "";
server.stderr.on("data", chunk => {
    stderr += chunk;
});

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWhenReady(pathname) {
    let lastError;
    for (let attempt = 0; attempt < 20; attempt += 1) {
        try {
            return await fetch(`${base}${pathname}`);
        } catch (error) {
            lastError = error;
            await wait(100);
        }
    }
    throw lastError;
}

(async () => {
    try {
        const checks = [
            ["/", "text/html"],
            ["/app", "text/html"],
            ["/app.html", "text/html"],
            ["/assets/css/styles.css", "text/css"],
            ["/assets/js/calendar-years.js", "text/javascript"],
            ["/assets/icons/icon-192.png", "image/png"],
            ["/manifest.webmanifest", "application/manifest+json"],
            ["/sw.js", "text/javascript"],
            ["/robots.txt", "text/plain"]
        ];
        for (const [pathname, type] of checks) {
            const response = await fetchWhenReady(pathname);
            const contentType = response.headers.get("content-type") || "";
            if (response.status !== 200 || !contentType.startsWith(type)) {
                throw new Error(`${pathname}: expected 200 ${type}, got ${response.status} ${contentType}`);
            }
            console.log(`OK ${pathname} -> ${contentType}`);
        }

        const privateFile = await fetchWhenReady("/package.json");
        if (privateFile.status !== 404) {
            throw new Error(`/package.json: expected 404, got ${privateFile.status}`);
        }
        console.log("OK /package.json -> 404 (not published)");
    } finally {
        server.kill();
    }
})().catch(error => {
    if (stderr.trim()) console.error(stderr.trim());
    console.error(error.message);
    process.exitCode = 1;
});
