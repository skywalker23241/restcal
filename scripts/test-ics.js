const assert = require("node:assert/strict");

require("../public/assets/js/ics-exporter.js");

const records = {
    "2026-08-26": {
        status: "work",
        note: "完成上线检查",
        overtime: {
            hours: 2.5,
            rate: 2,
            reason: "项目上线前的紧急处理与系统维护",
            updatedAt: "2026-08-26T01:02:03.000Z"
        },
        updatedAt: "2026-08-26T01:02:03.000Z"
    },
    "2026-08-27": {
        status: "annual",
        leaveType: "年假",
        reason: "家庭安排",
        note: "第一行\n第二行",
        updatedAt: "2026-08-26T02:00:00.000Z"
    }
};

const content = global.XiuliIcs.generateIcs({
    records,
    ticketReminders: [{name: "国庆节", saleDate: "2026-09-16", departure: "2026-10-01"}],
    ticketReminderTime: "09:00",
    include: {work: true}
});
const unfolded = content.replace(/\r\n /g, "");

assert.match(unfolded, /UID:restcal-work-2026-08-26@restcal\.app/);
assert.match(unfolded, /UID:restcal-overtime-2026-08-26@restcal\.app/);
assert.match(unfolded, /SUMMARY:.*\[加班\] 2\.5小时/);
assert.match(unfolded, /DTSTART:20260916T010000Z/);
assert.match(unfolded, /TRANSP:OPAQUE/);
assert.ok(unfolded.includes("备注: 第一行\\n第二行"), "description newlines should use one RFC escape");
assert.ok(!unfolded.includes("第一行\\\\n第二行"), "description newlines must not be double escaped");

for (const line of content.split("\r\n")) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75, `ICS line exceeds 75 octets: ${line}`);
}

const defaultContent = global.XiuliIcs.generateIcs({records});
assert.doesNotMatch(defaultContent, /UID:restcal-work-/);
assert.match(defaultContent, /UID:restcal-overtime-/);
assert.match(defaultContent, /UID:restcal-leave-/);

console.log("ICS export tests passed");
