const { app, BrowserWindow, Menu, net, protocol, shell, ipcMain } = require("electron");
const path = require("path");
const http = require("http");
const https = require("https");
const { pathToFileURL } = require("url");

// 网页静态文件统一放在 public/；开发和打包后都从这里加载。
const root = path.join(__dirname, "..", "public");

const APP_SCHEME = "app";
const APP_ORIGIN = `${APP_SCHEME}://xiuli`;

// 用自定义协议而不是 file://：页面里农历、节假日 JSON 是通过 fetch 加载的，
// file:// 下 fetch 会失败并退回内置备用数据；标准安全协议下 fetch 和
// localStorage 都正常，且 origin 固定，用户数据不会因端口变化丢失。
protocol.registerSchemesAsPrivileged([
    {
        scheme: APP_SCHEME,
        privileges: { standard: true, secure: true, supportFetchAPI: true }
    }
]);

function handleAppRequest(request) {
    const url = new URL(request.url);
    let pathname;
    try {
        pathname = decodeURIComponent(url.pathname);
    } catch {
        return new Response("Bad request", { status: 400 });
    }
    const requested = pathname === "" || pathname === "/" ? "app.html" : pathname.replace(/^\/+/, "");
    const file = path.resolve(root, requested);
    const relative = path.relative(root, file);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return new Response("Forbidden", { status: 403 });
    }

    return net.fetch(pathToFileURL(file).toString()).catch(() => new Response("Not found", { status: 404 }));
}

function openExternally(url) {
    if (/^https?:\/\//i.test(url)) {
        shell.openExternal(url);
    }
}

// WebDav 请求在主进程用 Node 发出，绕过渲染进程的 CORS 限制，
// 因此能兼容坚果云、Nextcloud、群晖等不发 CORS 头的服务器。
// 入参 { method, url, headers, body }，返回 { ok, status, statusText, body }。
// HTTP 层面的 401/404 等照常返回（ok=false），仅网络/连接错误才 reject。
function webdavRequest({ method, url, headers, body } = {}) {
    return new Promise((resolve, reject) => {
        let target;
        try {
            target = new URL(url);
        } catch {
            reject(new Error("WebDav 地址无效"));
            return;
        }
        if (target.protocol !== "https:" && target.protocol !== "http:") {
            reject(new Error("WebDav 地址必须以 http:// 或 https:// 开头"));
            return;
        }
        const transport = target.protocol === "https:" ? https : http;
        const payload = body == null ? null : Buffer.from(String(body), "utf-8");
        const requestHeaders = { ...(headers || {}) };
        if (payload) requestHeaders["Content-Length"] = payload.length;

        const req = transport.request(target, { method: method || "GET", headers: requestHeaders }, res => {
            const chunks = [];
            res.on("data", chunk => chunks.push(chunk));
            res.on("end", () => {
                const status = res.statusCode || 0;
                resolve({
                    ok: status >= 200 && status < 300,
                    status,
                    statusText: res.statusMessage || "",
                    body: Buffer.concat(chunks).toString("utf-8")
                });
            });
        });
        req.on("error", err => reject(new Error(err.message || "网络请求失败")));
        req.setTimeout(20000, () => req.destroy(new Error("连接超时")));
        if (payload) req.write(payload);
        req.end();
    });
}

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1180,
        height: 820,
        minWidth: 360,
        minHeight: 560,
        autoHideMenuBar: true,
        backgroundColor: "#f6f3ed",
        icon: path.join(root, "assets", "icons", "icon-512.png"),
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            sandbox: true
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        openExternally(url);
        return { action: "deny" };
    });
    mainWindow.webContents.on("will-navigate", (event, url) => {
        if (!url.startsWith(`${APP_ORIGIN}/`)) {
            event.preventDefault();
            openExternally(url);
        }
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.loadURL(`${APP_ORIGIN}/`);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        Menu.setApplicationMenu(null);
        protocol.handle(APP_SCHEME, handleAppRequest);
        ipcMain.handle("webdav:request", (event, options) => webdavRequest(options || {}));
        createWindow();
        app.on("activate", () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    });

    app.on("window-all-closed", () => {
        app.quit();
    });
}
