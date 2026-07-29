# Contributing

欢迎改进休历。

## 开发方式

项目没有前端构建步骤，发布文件统一放在 `public/`。介绍页是
`public/index.html`，应用页面是 `public/app.html`。

本地预览：

```bash
node server.js
```

然后访问：

```text
http://localhost:8765/
```

## 提交建议

- 保持原生 HTML/CSS/JavaScript 实现，避免引入不必要的依赖。
- 修改统计、工资、CSV 或节假日逻辑时，请同时检查导入导出和本地保存行为。
- UI 修改需要兼顾桌面端和移动端。
- 节假日数据来自 `public/assets/vendor/chinese-days/`，保留本地回退逻辑。
- 修改任何静态资源后，发布前递增 `public/sw.js` 顶部的 `CACHE_VERSION`，否则已安装的 PWA 用户拿不到更新。

## 发布前检查

- 页面可以正常打开。
- 月历可以切换月份和年份。
- 日期状态可以保存到 `localStorage`。
- CSV 可以导入和导出。
- 工资计算结果符合当前扣款比例。
- 移动端布局没有横向溢出。
- `public/sw.js` 的 `CACHE_VERSION` 已递增，断网刷新页面仍可正常使用。
