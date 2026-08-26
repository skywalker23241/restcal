package com.skywalker23241.xiuli;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.util.Iterator;
import java.util.concurrent.TimeUnit;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;

@CapacitorPlugin(name = "WebDav")
public class WebDavPlugin extends Plugin {

    private static final MediaType DEFAULT_MEDIA_TYPE = MediaType.parse("application/octet-stream");
    private final OkHttpClient client = new OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build();

    @PluginMethod
    public void request(PluginCall call) {
        String url = call.getString("url", "").trim();
        String method = call.getString("method", "GET").trim().toUpperCase();
        String body = call.getString("body");
        JSObject headers = call.getObject("headers", new JSObject());

        if (url.isEmpty()) {
            call.reject("WebDAV 服务器地址不能为空");
            return;
        }

        try {
            Request.Builder builder = new Request.Builder().url(url);
            Iterator<String> headerNames = headers.keys();
            while (headerNames.hasNext()) {
                String name = headerNames.next();
                String value = headers.optString(name, "");
                if (!name.isEmpty() && !value.isEmpty()) builder.header(name, value);
            }

            RequestBody requestBody = null;
            if (body != null) {
                String contentType = headers.optString("Content-Type", "application/octet-stream");
                MediaType mediaType = MediaType.parse(contentType);
                requestBody = RequestBody.create(mediaType != null ? mediaType : DEFAULT_MEDIA_TYPE, body);
            } else if (method.equals("PUT") || method.equals("POST") || method.equals("PATCH")) {
                requestBody = RequestBody.create(DEFAULT_MEDIA_TYPE, new byte[0]);
            }
            builder.method(method, requestBody);

            client.newCall(builder.build()).enqueue(new Callback() {
                @Override
                public void onFailure(Call requestCall, IOException error) {
                    call.reject(readableNetworkError(error), error);
                }

                @Override
                public void onResponse(Call requestCall, Response response) {
                    try (Response closeableResponse = response) {
                        ResponseBody responseBody = closeableResponse.body();
                        JSObject result = new JSObject();
                        result.put("ok", closeableResponse.isSuccessful());
                        result.put("status", closeableResponse.code());
                        result.put("url", closeableResponse.request().url().toString());
                        result.put("body", responseBody != null ? responseBody.string() : "");

                        JSObject responseHeaders = new JSObject();
                        for (String name : closeableResponse.headers().names()) {
                            responseHeaders.put(name, closeableResponse.header(name, ""));
                        }
                        result.put("headers", responseHeaders);
                        call.resolve(result);
                    } catch (Exception error) {
                        call.reject("无法读取 WebDAV 服务器响应：" + error.getMessage(), error);
                    }
                }
            });
        } catch (Exception error) {
            call.reject("WebDAV 请求创建失败：" + error.getMessage(), error);
        }
    }

    private String readableNetworkError(IOException error) {
        String detail = error.getLocalizedMessage();
        if (detail == null || detail.trim().isEmpty()) detail = error.getClass().getSimpleName();
        return "无法连接 WebDAV 服务器：" + detail;
    }
}
