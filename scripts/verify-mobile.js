/* 移动端布局验证脚本：用项目自带的 Electron 加载页面并截图。
 * 用法：npm run verify:mobile
 * 输出：scripts/shots/*.png（各视口首页、请假条、日期与设置弹窗）。 */
const { app, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");

const shotsDir = path.join(__dirname, "shots");
const URL = "http://127.0.0.1:8765/app.html";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/* 紧凑月视图（styles.css 的 @media (max-width: 768px)）的布局约束。
 * 尺寸一律用区间而非精确值，给字体回退和 DPR 取整留出余量；
 * 改动那段 CSS 的尺寸时，同步改这里而不是散落在断言表达式里。 */
const COMPACT_BREAKPOINT = 768;
const COMPACT_MONTH_RANGES = {
    switcherHeight: [48, 52],        // 年月选择器整体触控高度
    pickerHeight: [48, 52],          // 内嵌的年 / 月下拉与外框等高
    tabsHeight: [24, 38],            // 日/周/月/年降级为轻量 Tab
    summaryHeight: [36, 48],         // 三卡合并后的单行摘要条
    weekdayHeight: [28, 32],         // 星期表头
    gridHeight: [342, 400],          // 6 行日期格
    cellHeight: [52, 58],            // 单个日期格行高
    calendarShare: [0.6, 1],         // 日历面板占「控件+日历」总高的比例
    bannerHeight: [28, 52],          // 初始设置提示压缩为单行
    bannerDismissWidth: [36, 64]     // 「×」按钮仍需满足触控区
};
const COMPACT_MONTH_EXACT = {
    cards: 42,
    indicatorHeight: 2,              // Tab 下的 2px 滑动指示器
    tabsBackground: "rgba(0, 0, 0, 0)",
    cellBorder: "none",
    cellRadius: "0px",
    cellBackground: "rgba(0, 0, 0, 0)",
    subNoWrap: true,
    footerDisplay: "none",
    bannerSubtitleDisplay: "none"
};
const COMPACT_NOTE_MARKER = [3, 6];  // 便签标记降为小圆点
const WIDE_NOTE_MARKER = [11, 40];   // 宽屏保留图标本体

function collectFailures(audit, ranges, exact) {
    const failures = Object.entries(ranges).flatMap(([key, [min, max]]) => {
        const value = audit[key];
        return typeof value === "number" && value >= min && value <= max
            ? []
            : [`${key}=${JSON.stringify(value)} 期望 ${min}~${max}`];
    });
    return failures.concat(Object.entries(exact).flatMap(([key, expected]) =>
        audit[key] === expected ? [] : [`${key}=${JSON.stringify(audit[key])} 期望 ${JSON.stringify(expected)}`]));
}

function inRange(value, [min, max]) {
    return typeof value === "number" && value >= min && value <= max;
}

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
        if (w === 360) {
            const overtimeAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const iso = "2026-08-26";
                    delete state.records[iso];
                    openModal(iso);
                    chooseStatus("overtime");
                    document.getElementById("modalOvertimeHours").value = "2.5";
                    document.getElementById("modalOvertimeRate").value = "2";
                    document.getElementById("modalOvertimeReason").value = "自动化验证";
                    openEnhancedSelect(document.getElementById("modalOvertimeRate"));
                    const selectMenu = document.getElementById("modalOvertimeRateMenu");
                    const selectRect = selectMenu.getBoundingClientRect();
                    const pickerAudit = {
                        allSelectsEnhanced: [...document.querySelectorAll("select")].every(select => select.classList.contains("select-native") && enhancedSelects.has(select)),
                        allDatesEnhanced: [...document.querySelectorAll('input[type="date"]')].every(input => input.classList.contains("select-native") && enhancedDateInputs.has(input)),
                        hasNativeTimeInput: Boolean(document.querySelector('input[type="time"]')),
                        portal: selectMenu.classList.contains("is-portal"),
                        themed: getComputedStyle(selectMenu).backgroundColor !== "rgba(0, 0, 0, 0)",
                        inViewport: selectRect.left >= 0 && selectRect.right <= innerWidth && selectRect.top >= 0 && selectRect.bottom <= innerHeight
                    };
                    closeEnhancedSelect(document.getElementById("modalOvertimeRate"));
                    saveModalRecord();
                    const saved = structuredClone(state.records[iso]);
                    const migrated = normalizeRecords({
                        [iso]: {status: "overtime", reason: "旧数据", overtimeHours: 3, overtimeRate: 2, updatedAt: "2026-08-26T00:00:00.000Z"}
                    }, state.workSchedule)[iso];
                    const csvRows = [
                        [...CSV_HEADERS, CSV_USER_DATA_HEADER],
                        ["2026-08-29", "", "", "", "3.5", "2", "周末发布", "否", "是", "备注", "2026-08-29T00:00:00.000Z", ""]
                    ];
                    const csvRecord = validateImportedRows(csvRows).records["2026-08-29"];
                    delete state.records[iso];
                    saveState();
                    return {saved, migrated, csvRecord, pickerAudit};
                })()
            `);
            if (overtimeAudit.saved?.status !== "work"
                || overtimeAudit.saved?.overtime?.hours !== 2.5
                || overtimeAudit.saved?.overtime?.rate !== 2
                || overtimeAudit.migrated?.status !== "work"
                || overtimeAudit.migrated?.overtime?.hours !== 3
                || overtimeAudit.csvRecord?.status !== ""
                || overtimeAudit.csvRecord?.overtime?.hours !== 3.5
                || overtimeAudit.csvRecord?.overtime?.rate !== 2
                || !overtimeAudit.pickerAudit?.allSelectsEnhanced
                || !overtimeAudit.pickerAudit?.allDatesEnhanced
                || overtimeAudit.pickerAudit?.hasNativeTimeInput
                || !overtimeAudit.pickerAudit?.portal
                || !overtimeAudit.pickerAudit?.themed
                || !overtimeAudit.pickerAudit?.inViewport) {
                throw new Error(`overtime data model audit failed: ${JSON.stringify(overtimeAudit)}`);
            }

            const handlePoint = await win.webContents.executeJavaScript(`
                (() => {
                    document.getElementById("searchToggle").click();
                    const backdrop = document.getElementById("searchModal");
                    backdrop.getAnimations().forEach(animation => animation.finish());
                    backdrop.firstElementChild.getAnimations().forEach(animation => animation.finish());
                    const rect = backdrop.querySelector(".sheet-drag-handle").getBoundingClientRect();
                    return {x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2)};
                })()
            `);
            win.webContents.sendInputEvent({type: "mouseDown", x: handlePoint.x, y: handlePoint.y, button: "left", clickCount: 1});
            await wait(80);
            win.webContents.sendInputEvent({type: "mouseMove", x: handlePoint.x, y: handlePoint.y + 150, button: "left"});
            await wait(100);
            win.webContents.sendInputEvent({type: "mouseUp", x: handlePoint.x, y: handlePoint.y + 150, button: "left", clickCount: 1});
            await wait(520);
            const dragAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const backdrop = document.getElementById("searchModal");
                    const drawer = backdrop.firstElementChild;
                    return {closed: !backdrop.classList.contains("open"), backdropClass: backdrop.className, drawerClass: drawer.className, transform: drawer.style.transform};
                })()
            `);
            if (!dragAudit.closed) throw new Error(`mobile sheet drag-to-close audit failed: ${JSON.stringify({handlePoint, dragAudit})}`);
        }

        if (w >= 768) {
            const navIndicatorAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const auditVisibleSegments = () => [...document.querySelectorAll(".segmented")]
                        .filter(group => group.offsetWidth && group.offsetHeight)
                        .map(group => {
                            const active = group.querySelector(":scope > .seg-btn.active");
                            const indicator = group.querySelector(":scope > .segmented-indicator");
                            indicator?.getAnimations().forEach(animation => animation.finish());
                            indicator?.classList.remove("no-transition");
                            const activeRect = active?.getBoundingClientRect();
                            const indicatorRect = indicator?.getBoundingClientRect();
                            return {
                                id: group.id || group.className,
                                hasIndicator: Boolean(indicator),
                                widthMatch: Boolean(activeRect && indicatorRect && Math.abs(activeRect.width - indicatorRect.width) < 1),
                                leftMatch: Boolean(activeRect && indicatorRect && Math.abs(activeRect.left - indicatorRect.left) < 1),
                                transition: Boolean(indicator && getComputedStyle(indicator).transitionDuration !== "0s")
                            };
                        });
                    switchView("calendar");
                    const calendarSegments = auditVisibleSegments();
                    switchView("stats");
                    setStatsPeriodMode("year");
                    syncAllSegmentedIndicators(false);
                    const statsSegments = auditVisibleSegments();
                    openSettings("appearance");
                    syncAllSegmentedIndicators(false);
                    const appearanceSegments = auditVisibleSegments()
                        .filter(item => ["themeChoice", "languageChoice"].includes(item.id));
                    closeSettings();
                    const nav = document.querySelector(".app-nav");
                    const active = nav.querySelector('[data-nav="stats"]');
                    const indicator = nav.querySelector(".app-nav-indicator");
                    indicator.getAnimations().forEach(animation => animation.finish());
                    const activeRect = active.getBoundingClientRect();
                    const indicatorRect = indicator.getBoundingClientRect();
                    const result = {
                        widthMatch: Math.abs(activeRect.width - indicatorRect.width) < 1,
                        leftMatch: Math.abs(activeRect.left - indicatorRect.left) < 1,
                        transition: getComputedStyle(indicator).transitionDuration !== "0s",
                        segments: [...calendarSegments, ...statsSegments, ...appearanceSegments]
                    };
                    setStatsPeriodMode("month");
                    switchView("calendar");
                    return result;
                })()
            `);
            if (!navIndicatorAudit.widthMatch || !navIndicatorAudit.leftMatch || !navIndicatorAudit.transition
                || !["themeChoice", "languageChoice"].every(id => navIndicatorAudit.segments.some(item => item.id === id))
                || navIndicatorAudit.segments.some(item => !item.hasIndicator || !item.widthMatch || !item.leftMatch || !item.transition)) {
                throw new Error(`${w}px nav indicator audit failed: ${JSON.stringify(navIndicatorAudit)}`);
            }
        }
        const noteMarker = await win.webContents.executeJavaScript(`
            (() => {
                const iso = \`\${currentYear}-\${String(currentMonth).padStart(2, "0")}-15\`;
                state.records[iso] = {...(state.records[iso] || {}), status: "work", note: "布局验证备注"};
                renderCalendarView();
                const marker = document.querySelector(\`[data-date="\${iso}"] .note-marker\`);
                if (!marker) return null;
                const card = marker.closest(".day-card");
                const rect = marker.getBoundingClientRect();
                return {
                    marker: {
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        href: marker.querySelector("use")?.getAttribute("href"),
                        iconDisplay: getComputedStyle(marker.querySelector(".icon")).display
                    },
                    statusCell: {
                        subText: card.querySelector(".day-sub")?.textContent.trim(),
                        background: getComputedStyle(card).backgroundColor,
                        radius: getComputedStyle(card).borderTopLeftRadius
                    }
                };
            })()
        `);
        const compactViewport = w <= COMPACT_BREAKPOINT;
        const markerAudit = noteMarker?.marker;
        const markerRange = compactViewport ? COMPACT_NOTE_MARKER : WIDE_NOTE_MARKER;
        const markerFailed = !markerAudit || markerAudit.href !== "#i-note"
            || !inRange(markerAudit.width, markerRange) || !inRange(markerAudit.height, markerRange)
            // 紧凑月视图把便签标记降为小圆点，图标本体隐藏。
            || (compactViewport ? markerAudit.iconDisplay !== "none" : markerAudit.iconDisplay === "none");
        if (markerFailed) {
            throw new Error(`${w}px note marker layout failed: ${JSON.stringify(markerAudit ?? noteMarker)}`);
        }
        // 上面的夹具给这一天写了 status:"work"，因此同一个格子可以顺带校验
        // 紧凑月视图“出勤用底色表达、不再显示✓”的约定。断言分开抛，避免失败时指错方向。
        if (compactViewport) {
            const statusCell = noteMarker.statusCell;
            if (statusCell.background === "rgba(0, 0, 0, 0)" || statusCell.radius !== "8px"
                || statusCell.subText === "✓") {
                throw new Error(`${w}px compact status cell audit failed: ${JSON.stringify(statusCell)}`);
            }
        }
        const overviewAudit = await win.webContents.executeJavaScript(`
            [...document.querySelectorAll("#monthSummary .overview-item")].map(item => {
                const style = getComputedStyle(item);
                return {
                    label: item.querySelector(".overview-label")?.textContent.trim(),
                    border: style.borderTopStyle,
                    background: style.backgroundColor,
                    align: style.textAlign,
                    compact: item.querySelector(".overview-compact")?.textContent.trim(),
                    compactDisplay: getComputedStyle(item.querySelector(".overview-compact")).display
                };
            })
        `);
        const expectedOverviewLabels = ["请假 / 出勤", "请假每日扣款", "距下个节假日"];
        const overviewFailed = overviewAudit.length !== 3 || overviewAudit.some((item, index) => {
            if (item.label !== expectedOverviewLabels[index]) return true;
            if (compactViewport) return item.border !== "none" || item.background !== "rgba(0, 0, 0, 0)"
                || !item.compact || item.compactDisplay === "none";
            return item.border === "none" || item.background === "rgba(0, 0, 0, 0)"
                || item.align !== "center" || item.compactDisplay !== "none";
        });
        if (overviewFailed) {
            throw new Error(`${w}px overview card audit failed: ${JSON.stringify(overviewAudit)}`);
        }
        if (compactViewport) {
            const mobileMonthAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const switcher = document.querySelector("#viewCalendar .month-switcher");
                    const picker = switcher.querySelector(".picker-group");
                    const tabs = document.querySelector("#viewCalendar .view-switcher");
                    const indicator = tabs.querySelector(".segmented-indicator");
                    const summary = document.getElementById("monthSummary");
                    const panel = document.querySelector(".calendar-panel.mode-month");
                    const weekday = panel.querySelector(".weekday-row");
                    const grid = document.getElementById("calendarGrid");
                    const cards = [...grid.querySelectorAll(".day-card")];
                    const cardStyle = getComputedStyle(cards[0]);
                    const subStyles = cards.map(card => getComputedStyle(card.querySelector(".day-sub")));
                    const rect = element => element.getBoundingClientRect();
                    const controlsAndCalendarHeight = rect(panel).bottom - rect(switcher).top;
                    const previousOnboarding = state.onboardingCompleted;
                    const previousDismissed = state.setupBannerDismissed;
                    let bannerAudit;
                    try {
                        state.onboardingCompleted = false;
                        state.setupBannerDismissed = false;
                        renderSetupBanner();
                        const banner = document.getElementById("welcomeCard");
                        bannerAudit = {
                            height: Math.round(rect(banner).height),
                            subtitleDisplay: getComputedStyle(document.getElementById("welcomeSubtitle")).display,
                            dismissWidth: Math.round(rect(document.getElementById("setupBannerDismiss")).width)
                        };
                    } finally {
                        state.onboardingCompleted = previousOnboarding;
                        state.setupBannerDismissed = previousDismissed;
                        renderSetupBanner();
                    }
                    return {
                        switcherHeight: Math.round(rect(switcher).height),
                        pickerHeight: Math.round(rect(picker).height),
                        tabsHeight: Math.round(rect(tabs).height),
                        indicatorHeight: Math.round(rect(indicator).height),
                        tabsBackground: getComputedStyle(tabs).backgroundColor,
                        summaryHeight: Math.round(rect(summary).height),
                        weekdayHeight: Math.round(rect(weekday).height),
                        gridHeight: Math.round(rect(grid).height),
                        panelHeight: Math.round(rect(panel).height),
                        calendarShare: rect(panel).height / controlsAndCalendarHeight,
                        cards: cards.length,
                        cellHeight: cards.length > 7 ? Math.round(rect(cards[7]).top - rect(cards[0]).top) : 0,
                        cellBorder: cardStyle.borderTopStyle,
                        cellRadius: cardStyle.borderTopLeftRadius,
                        cellBackground: cardStyle.backgroundColor,
                        subNoWrap: subStyles.every(style => style.whiteSpace === "nowrap"),
                        footerDisplay: getComputedStyle(panel.querySelector(".calendar-footer")).display,
                        banner: bannerAudit
                    };
                })()
            `);
            const compactMonthFailures = collectFailures({
                ...mobileMonthAudit,
                bannerHeight: mobileMonthAudit.banner.height,
                bannerDismissWidth: mobileMonthAudit.banner.dismissWidth,
                bannerSubtitleDisplay: mobileMonthAudit.banner.subtitleDisplay
            }, COMPACT_MONTH_RANGES, COMPACT_MONTH_EXACT);
            if (compactMonthFailures.length) {
                throw new Error(`${w}px compact month audit failed: ${compactMonthFailures.join("; ")}`);
            }
            const mobileThemeLanguageAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const root = document.documentElement;
                    const previousTheme = root.dataset.theme;
                    const previousLanguage = window.RestCalI18n.getLanguage();
                    try {
                        window.RestCalI18n.setLanguage("en");
                        root.dataset.theme = "dark";
                        const grid = document.getElementById("calendarGrid");
                        const panel = document.querySelector(".calendar-panel.mode-month");
                        return {
                            language: root.lang,
                            horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                            summaryText: document.querySelector("#monthSummary .overview-compact")?.textContent.trim(),
                            summaryNoWrap: [...document.querySelectorAll("#monthSummary .overview-compact")]
                                .every(item => getComputedStyle(item).whiteSpace === "nowrap"),
                            overflowing: [...document.querySelectorAll("body *")]
                                .filter(item => {
                                    const rect = item.getBoundingClientRect();
                                    return rect.width && (rect.right > innerWidth + 0.5 || rect.left < -0.5);
                                })
                                .slice(0, 8)
                                .map(item => ({tag: item.tagName, id: item.id, className: String(item.className), right: Math.round(item.getBoundingClientRect().right), width: Math.round(item.getBoundingClientRect().width)})),
                            gridBackground: getComputedStyle(grid).backgroundColor,
                            panelBackground: getComputedStyle(panel).backgroundColor,
                            foreground: getComputedStyle(panel.querySelector(".solar")).color,
                            pageBackground: getComputedStyle(document.body).backgroundColor
                        };
                    } finally {
                        if (previousTheme === undefined) delete root.dataset.theme;
                        else root.dataset.theme = previousTheme;
                        window.RestCalI18n.setLanguage(previousLanguage);
                    }
                })()
            `);
            if (mobileThemeLanguageAudit.language !== "en" || mobileThemeLanguageAudit.horizontalOverflow !== 0
                || !mobileThemeLanguageAudit.summaryText?.includes("leave") || !mobileThemeLanguageAudit.summaryNoWrap
                || mobileThemeLanguageAudit.gridBackground !== "rgba(0, 0, 0, 0)"
                || mobileThemeLanguageAudit.panelBackground !== "rgba(0, 0, 0, 0)"
                || mobileThemeLanguageAudit.foreground === mobileThemeLanguageAudit.pageBackground) {
                throw new Error(`${w}px mobile dark/i18n audit failed: ${JSON.stringify(mobileThemeLanguageAudit)}`);
            }
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
                note.dispatchEvent(new MouseEvent("click", {bubbles: true}));
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
        if (statusButtons.length !== 6 || statusButtons.some(item =>
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
                const statusesDisabled = [...document.querySelectorAll(".action-grid-primary .action-btn:not(.overtime)")]
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
        if (w === 360) {
            await win.webContents.executeJavaScript(`
                setSettingsPanel("data");
                document.getElementById("webdavConfigure").click();
                undefined
            `);
            await wait(420);
            const webdavModalAudit = await win.webContents.executeJavaScript(`
                (() => {
                    const backdrop = document.getElementById("webdavConfigModal");
                    const modal = backdrop.querySelector(".webdav-config-modal");
                    backdrop.getAnimations().forEach(animation => animation.finish());
                    modal.getAnimations().forEach(animation => animation.finish());
                    const rect = modal.getBoundingClientRect();
                    const modalStyle = getComputedStyle(modal);
                    return {
                        className: backdrop.className,
                        open: backdrop.classList.contains("open"),
                        dialog: backdrop.getAttribute("role") === "dialog" && backdrop.getAttribute("aria-modal") === "true",
                        themed: getComputedStyle(modal).backgroundColor !== "rgba(0, 0, 0, 0)",
                        animation: {name: modalStyle.animationName, state: modalStyle.animationPlayState, transform: modalStyle.transform},
                        inViewport: rect.left >= -1 && rect.right <= innerWidth + 1 && rect.top >= -1 && rect.bottom <= innerHeight + 1,
                        rect: {left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height},
                        viewport: {width: innerWidth, height: innerHeight},
                        focused: document.activeElement === document.getElementById("webdavUrl"),
                        outsideSettings: !document.getElementById("settingsModal").contains(backdrop)
                    };
                })()
            `);
            if (!webdavModalAudit.open || !webdavModalAudit.dialog || !webdavModalAudit.themed
                || !webdavModalAudit.inViewport || !webdavModalAudit.focused || !webdavModalAudit.outsideSettings) {
                throw new Error(`WebDAV config modal audit failed: ${JSON.stringify(webdavModalAudit)}`);
            }
            await capture(win, "webdav-config-360");
            await win.webContents.executeJavaScript(`
                document.getElementById("webdavConfigDone").click();
                setSettingsPanel("profile");
                undefined
            `);
            await wait(260);
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
