/* 移动端布局验证脚本：用项目自带的 Electron 加载页面并截图。
 * 用法：npm run verify:mobile
 * 输出：scripts/shots/*.png（各视口首页、请假条、日期与设置弹窗）。 */
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const shotsDir = path.join(__dirname, "shots");
const URL = "http://127.0.0.1:8765/app.html";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function capture(win, name) {
    win.webContents.invalidate();
    await wait(120);
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
        const noteMarker = await win.webContents.executeJavaScript(`
            (() => {
                const iso = \`\${currentYear}-\${String(currentMonth).padStart(2, "0")}-15\`;
                state.records[iso] = {...(state.records[iso] || {}), status: "work", note: "布局验证备注"};
                renderCalendarView();
                const marker = document.querySelector(\`[data-date="\${iso}"] .note-marker\`);
                if (!marker) return null;
                const rect = marker.getBoundingClientRect();
                return {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    href: marker.querySelector("use")?.getAttribute("href")
                };
            })()
        `);
        if (!noteMarker || noteMarker.width < 11 || noteMarker.height < 11 || noteMarker.href !== "#i-note") {
            throw new Error(`${w}px note marker layout failed: ${JSON.stringify(noteMarker)}`);
        }
        const overviewAudit = await win.webContents.executeJavaScript(`
            [...document.querySelectorAll("#monthSummary .overview-item")].map(item => {
                const style = getComputedStyle(item);
                return {
                    label: item.querySelector(".overview-label")?.textContent.trim(),
                    border: style.borderTopStyle,
                    background: style.backgroundColor,
                    align: style.textAlign
                };
            })
        `);
        const expectedOverviewLabels = ["请假 / 出勤", "请假每日扣款", "距下个节假日"];
        if (overviewAudit.length !== 3 || overviewAudit.some((item, index) =>
            item.label !== expectedOverviewLabels[index] || item.border === "none"
            || item.background === "rgba(0, 0, 0, 0)" || item.align !== "center"
        )) {
            throw new Error(`${w}px overview card audit failed: ${JSON.stringify(overviewAudit)}`);
        }
        await wait(650);
        const tooltipAudit = await win.webContents.executeJavaScript(`
            (async () => {
                const iso = \`\${currentYear}-\${String(currentMonth).padStart(2, "0")}-15\`;
                const card = document.querySelector(\`[data-date="\${iso}"]\`);
                card.dispatchEvent(new PointerEvent("pointerover", {bubbles: true}));
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const tooltip = document.getElementById("noteTooltip");
                const rect = tooltip.getBoundingClientRect();
                const root = document.documentElement;
                const previousTheme = root.dataset.theme;
                root.dataset.theme = "light";
                const lightBackground = getComputedStyle(tooltip).backgroundColor;
                root.dataset.theme = "dark";
                const darkBackground = getComputedStyle(tooltip).backgroundColor;
                root.dataset.theme = previousTheme;
                return {
                    hidden: tooltip.hidden,
                    visible: tooltip.classList.contains("visible"),
                    text: tooltip.textContent,
                    lightBackground,
                    darkBackground,
                    insideViewport: rect.left >= 0 && rect.top >= 0
                        && rect.right <= innerWidth && rect.bottom <= innerHeight
                };
            })()
        `);
        if (tooltipAudit.hidden || !tooltipAudit.visible || tooltipAudit.text !== "布局验证备注"
            || !tooltipAudit.insideViewport || tooltipAudit.lightBackground === tooltipAudit.darkBackground) {
            throw new Error(`${w}px note tooltip audit failed: ${JSON.stringify(tooltipAudit)}`);
        }
        const overflow = await win.webContents.executeJavaScript(
            "document.documentElement.scrollWidth - document.documentElement.clientWidth"
        );
        console.log(`${w}px horizontal overflow: ${overflow}px`);
        if (w <= 760) {
            const mobileSettingsAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const button = document.getElementById("settingsToggle");
                    const buttonRect = button.getBoundingClientRect();
                    const topbarRect = document.querySelector(".topbar").getBoundingClientRect();
                    return {
                        visible: getComputedStyle(button).display !== "none" && buttonRect.width >= 40,
                        insideTopbar: buttonRect.top >= topbarRect.top && buttonRect.bottom <= topbarRect.bottom,
                        bottomItems: document.querySelectorAll(".bottom-nav-btn").length,
                        hasBottomSettings: Boolean(document.getElementById("bottomNavSettings"))
                    };
                })()
            `);
            if (!mobileSettingsAudit.visible || !mobileSettingsAudit.insideTopbar
                || mobileSettingsAudit.bottomItems !== 3 || mobileSettingsAudit.hasBottomSettings) {
                throw new Error(`${w}px mobile settings placement failed: ${JSON.stringify(mobileSettingsAudit)}`);
            }
        }
        await capture(win, `home-${w}`);
        await win.webContents.executeJavaScript("document.activeElement?.blur(); hideNoteTooltip(); undefined");
        const dayNoteAudit = await win.webContents.executeJavaScript(`
            (() => {
                const previousMode = calendarMode;
                const previousAnchor = new Date(anchorDate);
                anchorDate = new Date(currentYear, currentMonth - 1, 15);
                calendarMode = "day";
                renderCalendarView();
                const note = document.querySelector(".page-note");
                const style = note ? getComputedStyle(note) : null;
                const result = note ? {
                    border: style.borderTopStyle,
                    background: style.backgroundColor,
                    icon: note.querySelector("use")?.getAttribute("href")
                } : null;
                calendarMode = previousMode;
                anchorDate = previousAnchor;
                renderCalendarView();
                return result;
            })()
        `);
        if (!dayNoteAudit || dayNoteAudit.border === "none"
            || dayNoteAudit.background === "rgba(0, 0, 0, 0)" || dayNoteAudit.icon !== "#i-note") {
            throw new Error(`${w}px day note card audit failed: ${JSON.stringify(dayNoteAudit)}`);
        }
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
        await win.webContents.executeJavaScript("document.getElementById('closeLeaveGenerator').click(); undefined");
        await wait(400);
        // 打开日期弹窗（当月第一个可标记工作日）
        await win.webContents.executeJavaScript(
            `(() => {
                const date = getMonthDates(currentYear, currentMonth).find(item => getDayInfo(item).isWorkday);
                if (!date) throw new Error("当前月份没有可验证的工作日");
                const iso = toISO(date);
                state.records[iso] = {...(state.records[iso] || {}), status: "work", note: "布局验证备注"};
                openModal(iso);
                return iso;
            })()`
        );
        await wait(600);
        const reasonFieldAudit = await win.webContents.executeJavaScript(`
            (() => {
                const field = document.getElementById("modalReasonField");
                const initiallyHidden = field.hidden;
                document.querySelector('[data-action="personal"]').click();
                const shownForLeave = !field.hidden;
                document.getElementById("modalReason").value = "保留输入";
                document.querySelector('[data-action="work"]').click();
                return {
                    initiallyHidden,
                    shownForLeave,
                    hiddenForWork: field.hidden,
                    preserved: document.getElementById("modalReason").value
                };
            })()
        `);
        if (!reasonFieldAudit.initiallyHidden || !reasonFieldAudit.shownForLeave
            || !reasonFieldAudit.hiddenForWork || reasonFieldAudit.preserved !== "保留输入") {
            throw new Error(`${w}px conditional reason field failed: ${JSON.stringify(reasonFieldAudit)}`);
        }
        const noteSelectionAudit = await win.webContents.executeJavaScript(`
            (() => {
                const modal = document.getElementById("dayModal");
                const note = document.getElementById("modalNote");
                document.getElementById("modalAdvanced").open = true;
                note.value = "需要全选的备注";
                note.focus();
                note.select();
                note.dispatchEvent(new KeyboardEvent("keydown", {
                    key: "a",
                    code: "KeyA",
                    ctrlKey: true,
                    bubbles: true
                }));
                const openAfterSelectAll = modal.classList.contains("open")
                    && note.selectionStart === 0
                    && note.selectionEnd === note.value.length;
                note.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, pointerId: 1}));
                modal.dispatchEvent(new PointerEvent("pointerup", {bubbles: true, pointerId: 1}));
                modal.dispatchEvent(new MouseEvent("click", {bubbles: true}));
                return {
                    openAfterSelectAll,
                    openAfterSelectionDrag: modal.classList.contains("open")
                };
            })()
        `);
        if (!noteSelectionAudit.openAfterSelectAll || !noteSelectionAudit.openAfterSelectionDrag) {
            throw new Error(`${w}px note selection closed day modal: ${JSON.stringify(noteSelectionAudit)}`);
        }
        const statusButtons = await win.webContents.executeJavaScript(`
            [...document.querySelectorAll(".action-grid-primary .action-btn")].map(button => {
                const buttonRect = button.getBoundingClientRect();
                const icon = button.querySelector(".icon");
                const iconRect = icon.getBoundingClientRect();
                return {
                    width: Math.round(buttonRect.width),
                    height: Math.round(buttonRect.height),
                    icon: Math.round(iconRect.width),
                    href: icon.querySelector("use").getAttribute("href")
                };
            })
        `);
        if (statusButtons.length !== 5 || statusButtons.some(item =>
            item.width < 50 || item.height < 42 || item.icon < 15 || !item.href.startsWith("#i-status-")
        )) {
            throw new Error(`${w}px status button layout failed: ${JSON.stringify(statusButtons)}`);
        }
        const dayActionIcons = await win.webContents.executeJavaScript(`
            [...document.querySelectorAll(".day-modal .btn.icon-only")].map(button => ({
                label: button.getAttribute("aria-label"),
                title: button.getAttribute("title"),
                href: button.querySelector("use")?.getAttribute("href")
            }))
        `);
        if (dayActionIcons.length !== 3 || dayActionIcons.some(item =>
            !item.label || !item.title || !item.href?.startsWith("#i-action-")
        )) {
            throw new Error(`${w}px day action icon audit failed: ${JSON.stringify(dayActionIcons)}`);
        }
        const dayFooterAudit = await win.webContents.executeJavaScript(`
            (() => {
                const clear = document.getElementById("modalClear");
                const cancel = document.getElementById("modalCancel");
                const save = document.getElementById("modalSave");
                const clearRect = clear.getBoundingClientRect();
                const cancelRect = cancel.getBoundingClientRect();
                const saveRect = save.getBoundingClientRect();
                return {
                    clearVisible: !clear.hidden && clearRect.width > 0,
                    sameRow: Math.abs(clearRect.top - cancelRect.top) <= 4
                        && Math.abs(cancelRect.top - saveRect.top) <= 4,
                    order: clearRect.left < cancelRect.left && cancelRect.left < saveRect.left,
                    trash: clear.querySelector("use")?.getAttribute("href"),
                    footerHeight: Math.round(document.querySelector(".day-modal-foot").getBoundingClientRect().height)
                };
            })()
        `);
        if (!dayFooterAudit.clearVisible || !dayFooterAudit.sameRow || !dayFooterAudit.order
            || dayFooterAudit.trash !== "#i-action-trash" || dayFooterAudit.footerHeight > 78) {
            throw new Error(`${w}px day footer layout failed: ${JSON.stringify(dayFooterAudit)}`);
        }
        await capture(win, `day-${w}`);
        const backdropCloseAudit = await win.webContents.executeJavaScript(`
            (() => {
                const modal = document.getElementById("dayModal");
                modal.dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, pointerId: 2}));
                modal.dispatchEvent(new MouseEvent("click", {bubbles: true}));
                return modal.classList.contains("closing");
            })()
        `);
        if (!backdropCloseAudit) {
            throw new Error(`${w}px direct backdrop click did not close day modal`);
        }
        await wait(400);
        const weekendNoteAudit = await win.webContents.executeJavaScript(`
            (() => {
                const date = getMonthDates(currentYear, currentMonth).find(item => getDayInfo(item).isWeekend);
                if (!date) return null;
                const iso = toISO(date);
                openModal(iso);
                const note = document.getElementById("modalNote");
                const save = document.getElementById("modalSave");
                const statusesDisabled = [...document.querySelectorAll(".action-grid-primary .action-btn")]
                    .every(button => button.disabled);
                const advancedOpen = document.getElementById("modalAdvanced").open;
                const saveEnabled = !save.disabled;
                note.value = "周末备注验证";
                save.click();
                return {
                    iso,
                    statusesDisabled,
                    advancedOpen,
                    saveEnabled,
                    note: state.records[iso]?.note,
                    status: state.records[iso]?.status || ""
                };
            })()
        `);
        if (!weekendNoteAudit || !weekendNoteAudit.statusesDisabled || !weekendNoteAudit.advancedOpen
            || !weekendNoteAudit.saveEnabled || weekendNoteAudit.note !== "周末备注验证" || weekendNoteAudit.status) {
            throw new Error(`${w}px weekend note audit failed: ${JSON.stringify(weekendNoteAudit)}`);
        }
        await wait(400);
        // 打开设置，验证桌面侧栏与移动端目录的图标和对齐
        const settingsState = await win.webContents.executeJavaScript(`
            document.getElementById("settingsToggle").click();
            document.getElementById("settingsModal").className
        `);
        console.log(`${w}px settings modal: ${settingsState}`);
        await wait(600);
        const settingsItems = await win.webContents.executeJavaScript(`
            [...document.querySelectorAll(".settings-nav-btn")].map(button => {
                const icon = button.querySelector(".icon");
                const rect = icon.getBoundingClientRect();
                return {
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    href: icon.querySelector("use").getAttribute("href")
                };
            })
        `);
        if (settingsItems.length !== 8 || settingsItems.some(item =>
            item.width < 16 || item.height < 16 || !item.href.startsWith("#i-")
        )) {
            throw new Error(`${w}px settings icon layout failed: ${JSON.stringify(settingsItems)}`);
        }
        await capture(win, `settings-${w}`);
        await win.webContents.executeJavaScript("document.getElementById('closeSettings').click(); undefined");
        await wait(400);
    }
    app.exit(0);
}

app.whenReady().then(() => run().catch(error => {
    console.error(error);
    app.exit(1);
}));
