/* 休历 Service Worker
 * 发布新版本时递增 CACHE_VERSION，旧缓存会在 activate 阶段清除。 */
const CACHE_VERSION = "v1.5.27";
const APP_CACHE = `xiuli-app-${CACHE_VERSION}`;
const FONT_CACHE = "xiuli-fonts-v1";
const CALENDAR_CACHE = "xiuli-calendar-data-v1";

const PRECACHE = [
    "./",
    "index.html",
    "app.html",
    "assets/js/app-i18n-v1.4.9.js",
    "assets/js/calendar-years.js",
    "assets/js/onboarding.js",
    "assets/js/product-tour.js",
    "assets/css/styles.css",
    "manifest.webmanifest",
    "assets/vendor/chinese-days/index.min.js",
    "assets/icons/favicon-16.png",
    "assets/icons/favicon-32.png",
    "assets/icons/icon-192.png",
    "assets/icons/icon-512.png",
    "assets/icons/maskable-512.png",
    "assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(APP_CACHE)
            .then(cache => Promise.allSettled(PRECACHE.map(async url => {
                const response = await fetch(new Request(url, {cache: "reload"}));
                if (!isCacheable(response)) throw new Error(`Cannot precache ${url}`);
                // 预缓存请求会跟随重定向；带 redirected 标记的响应之后回给导航请求
                // 会被浏览器判成网络错误，重新包一层去掉标记再入缓存。
                const clean = response.redirected
                    ? new Response(await response.blob(), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    })
                    : response;
                await cache.put(url, clean);
            })))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== APP_CACHE && key !== FONT_CACHE && key !== CALENDAR_CACHE)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // 未打包的新年份日历数据：优先联网获取官方更新，离线时使用最近一次成功缓存。
    if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("/chinese-days/")) {
        event.respondWith(networkFirst(request, CALENDAR_CACHE));
        return;
    }

    // 字体 CDN 资源：URL 带版本号不可变，cache-first
    if (url.hostname === "cdn.jsdelivr.net" && url.pathname.includes("/@fontsource/")) {
        event.respondWith(cacheFirst(request, FONT_CACHE));
        return;
    }

    if (url.origin !== self.location.origin) return;

    // 同源动态接口（/__quote、/__webdav 等代理）：始终走网络，不读写缓存，
    // 否则第一条格言会被缓存后永远命中，日日相同。
    if (url.pathname.startsWith("/__")) return;

    // 页面与样式 network-first：避免新页面搭配旧 styles.css 造成布局错位，离线时回退缓存。
    // 导航请求按路径区分：/app.html 与 /app（线上无后缀重写路径）是应用，其余路径是落地页。
    if (request.mode === "navigate" || url.pathname.endsWith("/styles.css")) {
        const isApp = url.pathname.endsWith("/app.html") || url.pathname.endsWith("/app");
        const cacheKey = request.mode === "navigate" ? (isApp ? "app.html" : "index.html") : request;
        event.respondWith(
            fetch(request)
                .then(response => {
                    // 重定向响应原样交还浏览器跟进（导航的 redirect mode 是 manual，
                    // 换成缓存里跟随过重定向的响应会直接判网络错误）；Cloudflare
                    // 质询页也必须原样放行——质询脚本在页面里跑通后会自动重载，
                    // 吞掉换成缓存会让用户永远过不了质询，卡在旧页面之间跳转失败。
                    if (response.type === "opaqueredirect" || response.redirected) return response;
                    if (response.headers.get("cf-mitigated") === "challenge") return response;
                    if (!isCacheable(response)) throw new Error(`Uncacheable response ${response.status}`);
                    const copy = response.clone();
                    caches.open(APP_CACHE).then(cache => cache.put(cacheKey, copy));
                    return response;
                })
                .catch(() => caches.match(cacheKey))
        );
        return;
    }

    // 其余同源静态资源：cache-first
    event.respondWith(cacheFirst(request, APP_CACHE));
});

function cacheFirst(request, cacheName) {
    return caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
            if (response.ok || response.type === "opaque") {
                const copy = response.clone();
                caches.open(cacheName).then(cache => cache.put(request, copy));
            }
            return response;
        });
    });
}

function networkFirst(request, cacheName) {
    return fetch(request).then(response => {
        if (!response.ok) throw new Error(`Uncacheable response ${response.status}`);
        const copy = response.clone();
        caches.open(cacheName).then(cache => cache.put(request, copy));
        return response;
    }).catch(() => caches.match(request).then(cached => cached || Response.error()));
}

function isCacheable(response) {
    return response.ok && response.headers.get("cf-mitigated") !== "challenge";
}
