const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'public');
const target = path.join(root, 'mobile');

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
const appHtml = fs.readFileSync(path.join(source, 'app.html'), 'utf8')
    .replace('<html lang="zh-CN">', '<html class="android-shell" lang="zh-CN">');
fs.writeFileSync(path.join(target, 'index.html'), appHtml);
fs.copyFileSync(path.join(source, 'manifest.webmanifest'), path.join(target, 'manifest.webmanifest'));
fs.copyFileSync(path.join(source, 'sw.js'), path.join(target, 'sw.js'));
fs.cpSync(path.join(source, 'assets'), path.join(target, 'assets'), { recursive: true });

console.log(`Android web assets prepared in ${path.relative(root, target)}/`);
