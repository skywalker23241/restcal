/* 每日一言同源转发函数。
 * 英文源 api.quotable.io 的 HTTPS 证书长期处于过期状态，浏览器无法直连，
 * 由服务端改走明文 HTTP 转发；中文源一言（hitokoto.cn）证书正常，代理只为
 * 让前端两种语言共用同一入口（内容为公开格言，不含敏感信息）。请求时给上游
 * URL 追加时间戳参数：一言经 Cloudflare，相同 URL 短时间内会命中边缘缓存
 * 返回同一条。
 */

const SOURCES = {
    zh: {url: "https://v1.hitokoto.cn/?c=d&c=i&c=k&max_length=60", textField: "hitokoto"},
    en: {url: "http://api.quotable.io/quotes/random?maxLength=120", textField: "content"}
};

export default async function handler(request) {
    let lang = "en";
    try {
        lang = new URL(request.url).searchParams.get("lang") || "en";
    } catch {
        // 解析失败时保持默认英文源
    }
    const source = SOURCES[lang] || SOURCES.en;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
        const upstream = await fetch(`${source.url}&_=${Date.now()}`, {
            signal: controller.signal
        });
        if (!upstream.ok) {
            return Response.json({error: `格言服务返回 ${upstream.status}`}, {status: 502});
        }
        const data = await upstream.json();
        // 确保返回的是正确格式（API 既可能返回对象也可能返回数组）
        const quote = Array.isArray(data) ? data[0] : data;
        if (quote && quote[source.textField]) {
            return Response.json(quote, {
                headers: {"Cache-Control": "no-store"}
            });
        } else {
            return Response.json({error: "格言服务响应异常"}, {status: 502});
        }
    } catch (error) {
        const message = error && error.name === "AbortError" ? "连接格言服务超时" : "无法连接格言服务";
        return Response.json({error: message}, {status: 502});
    } finally {
        clearTimeout(timer);
    }
}

export const config = {
    path: "/__quote"
};
