/* 移动端布局验证脚本：用项目自带的 Electron 加载页面并截图。
 * 用法：npm run verify:mobile
 * 输出：scripts/shots/*.png（各视口首页 + 请假条弹窗）。 */
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const shotsDir = path.join(__dirname, "shots");
const URL = "http://127.0.0.1:8765/app.html";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function capture(win, name) {
    const image = await win.webContents.capturePage();
    fs.writeFileSync(path.join(shotsDir, `${name}.png`), image.toPNG());
    console.log(`saved ${name}.png`);
}

async function run() {
    fs.mkdirSync(shotsDir, { recursive: true });
    require(path.join(__dirname, "..", "server.js"));
    await wait(500);

    const win = new BrowserWindow({
        show: false,
        useContentSize: true,
        webPreferences: { contextIsolation: true }
    });
    win.webContents.on("console-message", (_event, level, message, line, source) => {
        if (level >= 2) console.log(`renderer-console[${level}] ${message} (${source}:${line})`);
    });

    const viewports = [
        [360, 780], [390, 844], [430, 932],
        [768, 1024], [1024, 768], [1440, 900]
    ];
    for (const [w, h] of viewports) {
        win.setContentSize(w, h);
        await win.loadURL(URL);
        await wait(1200);
        // 应用首次打开会展示引导；本脚本测试主应用功能时明确跳过它。
        await win.webContents.executeJavaScript("if (typeof skipOnboarding === 'function') skipOnboarding(); undefined");
        await wait(300);
        const overflow = await win.webContents.executeJavaScript(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        );
        console.log(`${w}px horizontal overflow: ${overflow}px`);
        await capture(win, `home-${w}`);
        // 打开请假条生成器（内联脚本的顶层函数是全局的），填表并生成小票
        await win.webContents.executeJavaScript("openLeaveGenerator({}); undefined");
        await wait(600);
        await capture(win, `leave-${w}`);
        await win.webContents.executeJavaScript(`
            document.getElementById("leaveApplicantDoc").value = "张三";
            document.getElementById("leaveStart").value = "2026-07-06";
            document.getElementById("leaveEnd").value = "2026-07-07";
            document.getElementById("leaveReasonDoc").value = "个人事务";
            generateLeaveDoc();
            undefined
        `);
        await wait(600);
        await capture(win, `leave-filled-${w}`);
        await win.webContents.executeJavaScript(
            "document.querySelector('.leave-generator-body').scrollTo(0, 99999); undefined"
        );
        await wait(300);
        await capture(win, `leave-filled-bottom-${w}`);
        await win.webContents.executeJavaScript("closeLeaveGenerator(); undefined");
        await wait(400);
        // 打开日期弹窗（当月 15 号）
        await win.webContents.executeJavaScript(
            "openModal(`${currentYear}-${String(currentMonth).padStart(2, \"0\")}-15`); undefined"
        );
        await wait(600);
        await capture(win, `day-${w}`);
        await win.webContents.executeJavaScript("closeModal(); undefined");
        await wait(400);
    }
    app.exit(0);
}

app.whenReady().then(() => run().catch(error => {
    console.error(error);
    app.exit(1);
}));
