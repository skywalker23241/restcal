/**
 * 休历 · RestCal - iCalendar (.ics) 日历导出器
 * 符合 RFC 5545 标准规范，支持导入 Apple 日历、Google Calendar、Outlook、飞书、企微等主流日历。
 */
(function (global) {
    "use strict";

    function escapeIcsText(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/\\/g, "\\\\")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,")
            .replace(/\r?\n/g, "\\n");
    }

    function formatIcsDate(val) {
        if (!val) return "";
        if (val instanceof Date) {
            const yyyy = val.getFullYear();
            const mm = String(val.getMonth() + 1).padStart(2, "0");
            const dd = String(val.getDate()).padStart(2, "0");
            return `${yyyy}${mm}${dd}`;
        }
        if (typeof val === "string") {
            const clean = val.replace(/[-/]/g, "").slice(0, 8);
            return clean;
        }
        return "";
    }

    function addOneDayIcs(val) {
        let d;
        if (val instanceof Date) {
            d = new Date(val.getFullYear(), val.getMonth(), val.getDate());
        } else if (typeof val === "string") {
            const raw = val.includes("-") || val.includes("/")
                ? val.replace(/\//g, "-")
                : `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
            const parts = raw.split("-").map(Number);
            d = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
            d = new Date();
        }
        d.setDate(d.getDate() + 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}${mm}${dd}`;
    }

    function generateIcs(options = {}) {
        const records = options.records || options.state?.records || {};
        const holidays = options.holidays || [];
        const makeups = options.makeups || [];
        const ticketReminders = options.ticketReminders || [];
        const statusLabels = Object.assign({
            work: "出勤",
            overtime: "加班",
            comp: "调休",
            annual: "年假",
            personal: "事假",
            sick: "病假"
        }, options.statusLabels || {});

        const targetYear = options.year || options.targetYear;
        const nowIso = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        const lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//RestCal//休历日历导出器//CN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:休历",
            "X-WR-TIMEZONE:Asia/Shanghai"
        ];

        // 1. 用户请假、出勤、加班与备注记录
        const recordDates = Object.keys(records).sort();
        recordDates.forEach(iso => {
            if (targetYear && !iso.startsWith(String(targetYear))) return;
            const rec = records[iso];
            if (!rec) return;

            const status = rec.status;
            const dtStart = formatIcsDate(iso);
            const dtEnd = addOneDayIcs(iso);
            const uid = `restcal-record-${iso}@restcal.local`;

            let summary = "";
            if (status === "overtime") {
                const hours = rec.overtimeHours || 8;
                summary = `💼 [加班] ${hours}小时 ${rec.reason || ""}`.trim();
            } else if (status === "work") {
                summary = `💻 [出勤] ${rec.note || ""}`.trim();
            } else if (status) {
                const label = statusLabels[status] || rec.leaveType || "请假";
                summary = `🏖️ [${label}] ${rec.reason || ""}`.trim();
            } else if (rec.note) {
                summary = `📝 [备注] ${rec.note}`;
            } else {
                return;
            }

            const descParts = [];
            if (rec.leaveType) descParts.push(`类型: ${rec.leaveType}`);
            if (rec.reason) descParts.push(`理由: ${rec.reason}`);
            if (rec.note) descParts.push(`备注: ${rec.note}`);
            if (rec.overtimeHours) descParts.push(`工时: ${rec.overtimeHours} 小时`);
            if (rec.overtimeRate && rec.overtimeRate !== 1) descParts.push(`调休倍率: ${rec.overtimeRate}x`);
            if (rec.updatedAt) descParts.push(`更新时间: ${rec.updatedAt}`);

            lines.push(
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTAMP:${nowIso}`,
                `DTSTART;VALUE=DATE:${dtStart}`,
                `DTEND;VALUE=DATE:${dtEnd}`,
                `SUMMARY:${escapeIcsText(summary)}`,
                `DESCRIPTION:${escapeIcsText(descParts.join("\\n"))}`,
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            );
        });

        // 2. 法定节假日
        const seenHolidays = new Set();
        holidays.forEach(h => {
            const dtStart = formatIcsDate(h.date);
            if (!dtStart) return;
            if (targetYear && !dtStart.startsWith(String(targetYear))) return;
            const key = `${dtStart}-${h.name}`;
            if (seenHolidays.has(key)) return;
            seenHolidays.add(key);

            const dtEnd = addOneDayIcs(h.date);
            lines.push(
                "BEGIN:VEVENT",
                `UID:restcal-holiday-${dtStart}-${escapeIcsText(h.name)}@restcal.local`,
                `DTSTAMP:${nowIso}`,
                `DTSTART;VALUE=DATE:${dtStart}`,
                `DTEND;VALUE=DATE:${dtEnd}`,
                `SUMMARY:🎉 [节假日] ${escapeIcsText(h.name)}`,
                `DESCRIPTION:${escapeIcsText("国务院法定节假日放假安排")}`,
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            );
        });

        // 3. 调休上班（补班日）
        const seenMakeups = new Set();
        makeups.forEach(m => {
            const dtStart = formatIcsDate(m.date);
            if (!dtStart) return;
            if (targetYear && !dtStart.startsWith(String(targetYear))) return;
            const key = `${dtStart}-${m.name}`;
            if (seenMakeups.has(key)) return;
            seenMakeups.add(key);

            const dtEnd = addOneDayIcs(m.date);
            lines.push(
                "BEGIN:VEVENT",
                `UID:restcal-makeup-${dtStart}-${escapeIcsText(m.name)}@restcal.local`,
                `DTSTAMP:${nowIso}`,
                `DTSTART;VALUE=DATE:${dtStart}`,
                `DTEND;VALUE=DATE:${dtEnd}`,
                `SUMMARY:💼 [调休上班] ${escapeIcsText(m.name)}`,
                `DESCRIPTION:${escapeIcsText("法定节假日调休补班")}`,
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            );
        });

        // 4. 12306 火车票抢票提醒
        const seenTickets = new Set();
        ticketReminders.forEach(t => {
            const dtStart = formatIcsDate(t.saleDate);
            if (!dtStart) return;
            if (targetYear && !dtStart.startsWith(String(targetYear))) return;
            const key = `${dtStart}-${t.name}`;
            if (seenTickets.has(key)) return;
            seenTickets.add(key);

            const dtEnd = addOneDayIcs(t.saleDate);
            const departureStr = t.departure instanceof Date
                ? `${t.departure.getFullYear()}年${t.departure.getMonth() + 1}月${t.departure.getDate()}日`
                : String(t.departure || "");

            lines.push(
                "BEGIN:VEVENT",
                `UID:restcal-ticket-${dtStart}-${escapeIcsText(t.name)}@restcal.local`,
                `DTSTAMP:${nowIso}`,
                `DTSTART;VALUE=DATE:${dtStart}`,
                `DTEND;VALUE=DATE:${dtEnd}`,
                `SUMMARY:🚄 [抢票提醒] ${escapeIcsText(t.name)} 火车票今日开售`,
                `DESCRIPTION:${escapeIcsText(`假期首日为 ${departureStr}，12306 提前 15 天开售，请记得提前准备抢票。`)}`,
                "BEGIN:VALARM",
                "ACTION:DISPLAY",
                `DESCRIPTION:${escapeIcsText(`${t.name}火车票开售提醒`)}`,
                "TRIGGER:-PT15M",
                "END:VALARM",
                "TRANSP:TRANSPARENT",
                "END:VEVENT"
            );
        });

        lines.push("END:VCALENDAR");
        return lines.join("\r\n");
    }

    /**
     * 触发浏览器下载 ICS 文件（支持 downloadIcs(content, filename) 与 downloadIcs(filename, content) 两种参数顺序）
     */
    function downloadIcs(arg1, arg2) {
        let icsContent = "";
        let filename = "RestCal.ics";

        if (typeof arg1 === "string" && arg1.includes("BEGIN:VCALENDAR")) {
            icsContent = arg1;
            filename = arg2 || filename;
        } else if (typeof arg2 === "string" && arg2.includes("BEGIN:VCALENDAR")) {
            filename = arg1 || filename;
            icsContent = arg2;
        } else {
            icsContent = String(arg1 || "");
            filename = String(arg2 || filename);
        }

        if (!filename.endsWith(".ics")) {
            filename += ".ics";
        }

        // 添加 UTF-8 BOM 保证 Windows Outlook / 系统日历完美识别中文
        const blob = new Blob(["\uFEFF", icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1500);
    }

    global.XiuliIcs = {
        generateIcs,
        downloadIcs
    };
})(typeof window !== "undefined" ? window : global);
