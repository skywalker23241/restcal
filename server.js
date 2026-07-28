const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 8765);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

// 网页/PWA 版的 WebDav 同源代理：浏览器无法直接跨域访问坚果云等不发 CORS 头的
// 服务器，这里在 Node 端（不受 CORS 限制）转发请求。安全上：要求自定义请求头
// X-Xiuli-Proxy（迫使跨站请求走预检而被浏览器拦截），且服务仅监听 127.0.0.1。
// 入参 { method, url, headers, body } 与返回 { ok, status, statusText, body } 与桌面版 IPC 一致。
function proxyWebdav(req, res) {
  const sendJson = (code, obj) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(obj));
  };
  if (req.headers["x-xiuli-proxy"] !== "1") {
    sendJson(403, { error: "Forbidden" });
    return;
  }
  const chunks = [];
  req.on("data", chunk => chunks.push(chunk));
  req.on("end", () => {
    let opts;
    try {
      opts = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
    } catch {
      sendJson(400, { error: "请求格式错误" });
      return;
    }
    let target;
    try {
      target = new URL(opts.url);
    } catch {
      sendJson(400, { error: "WebDav 地址无效" });
      return;
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      sendJson(400, { error: "地址必须以 http:// 或 https:// 开头" });
      return;
    }
    const transport = target.protocol === "https:" ? https : http;
    const payload = opts.body == null ? null : Buffer.from(String(opts.body), "utf-8");
    const headers = { ...(opts.headers || {}) };
    if (payload) headers["Content-Length"] = payload.length;

    const upstream = transport.request(target, { method: opts.method || "GET", headers }, up => {
      const out = [];
      up.on("data", chunk => out.push(chunk));
      up.on("end", () => {
        const status = up.statusCode || 0;
        sendJson(200, {
          ok: status >= 200 && status < 300,
          status,
          statusText: up.statusMessage || "",
          body: Buffer.concat(out).toString("utf-8")
        });
      });
    });
    upstream.on("error", err => sendJson(502, { error: err.message || "无法连接服务器" }));
    upstream.setTimeout(20000, () => upstream.destroy(new Error("连接超时")));
    if (payload) upstream.write(payload);
    upstream.end();
  });
}

// 每日一言代理。英文源 api.quotable.io 的 HTTPS 证书长期过期，浏览器无法直连，
// 服务端改走明文 HTTP 转发；中文源一言（hitokoto.cn）证书正常，代理只为让前端
// 两种语言共用同一入口（内容为公开格言，不含敏感信息）。请求时给上游 URL 追加
// 时间戳参数：一言经 Cloudflare，相同 URL 短时间内会命中边缘缓存返回同一条。
const quoteSources = {
  zh: { url: "https://v1.hitokoto.cn/?c=d&c=i&c=k&max_length=60", transport: https, textField: "hitokoto" },
  en: { url: "http://api.quotable.io/quotes/random?maxLength=120", transport: http, textField: "content" }
};

function proxyQuote(res, lang) {
  const source = quoteSources[lang] || quoteSources.en;
  const sendJson = (code, obj) => {
    if (res.headersSent) return;
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    res.end(JSON.stringify(obj));
  };
  const request = source.transport.get(`${source.url}&_=${Date.now()}`, { timeout: 6000 }, upstream => {
    const chunks = [];
    upstream.on("data", chunk => chunks.push(chunk));
    upstream.on("end", () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        // 确保返回的是数组格式（API 既可能返回对象也可能返回数组）
        const quote = Array.isArray(data) ? data[0] : data;
        if (quote && quote[source.textField]) {
          sendJson(200, quote);
        } else {
          sendJson(502, { error: "格言服务响应异常" });
        }
      } catch {
        sendJson(502, { error: "格言服务响应异常" });
      }
    });
  });
  request.on("timeout", () => request.destroy(new Error("timeout")));
  request.on("error", () => sendJson(502, { error: "无法连接格言服务" }));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }

  if (req.method === "POST" && pathname === "/__webdav") {
    proxyWebdav(req, res);
    return;
  }

  if (req.method === "GET" && pathname === "/__quote") {
    proxyQuote(res, url.searchParams.get("lang"));
    return;
  }

  // 与线上的 /app → app.html 重写保持一致，本地也能用无后缀路径访问应用
  const routes = { "/": "index.html", "/app": "app.html" };
  const requested = routes[pathname] || pathname.replace(/^\/+/, "");
  const file = path.resolve(root, requested);
  const relative = path.relative(root, file);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`休历 running at http://127.0.0.1:${port}/`);
});
