/* RestCal 首次使用引导视图：只负责步骤文案、表单模板和摘要展示。 */
(function () {
    const steps = [
        {title: "欢迎使用 RestCal", text: "记录请假、统计出勤、计算工资，并在本地安全备份你的数据。", kind: "welcome"},
        {title: "先认识一下你", text: "所有字段都可以留空，之后也能在设置里修改。", kind: "profile"},
        {title: "设置你的工作制度", text: "用默认值开始，或按单休、大小周和排班情况调整。", kind: "schedule"},
        {title: "工资信息", text: "用于估算扣款和实发工资，不影响请假记录。", kind: "salary"},
        {title: "设置完成", text: "确认摘要后即可进入日历。", kind: "summary"}
    ];

    function restDayOptions(selected = [0, 6]) {
        return ["日", "一", "二", "三", "四", "五", "六"].map((label, index) =>
            `<label class="weekday-option"><input type="checkbox" value="${index}" ${selected.includes(index) ? "checked" : ""}><span>周${label}</span></label>`
        ).join("");
    }

    function markup(step) {
        if (step.kind === "welcome") return `<div class="onboarding-hero"><div class="onboarding-mark">休</div><h1 id="onboardingTitle">${step.title}</h1><p>${step.text}</p><div class="onboarding-benefits"><span>日历记录</span><span>出勤统计</span><span>工资估算</span><span>数据备份</span></div></div>`;
        if (step.kind === "profile") return `<div class="onboarding-heading"><h1 id="onboardingTitle">${step.title}</h1><p>${step.text}</p></div><div class="onboarding-form"><div class="field"><label for="obName">姓名或昵称</label><input id="obName" autocomplete="name" placeholder="例如：小明"></div><div class="field"><label for="obCompany">工作单位 <em>选填</em></label><input id="obCompany" autocomplete="organization" placeholder="例如：RestCal 工作室"></div><div class="field"><label for="obHireDate">入职日期 <em>选填</em></label><input id="obHireDate" type="date"></div></div>`;
        if (step.kind === "schedule") return `<div class="onboarding-heading"><h1 id="onboardingTitle">${step.title}</h1><p>${step.text}</p></div><div class="onboarding-form"><div class="field"><label for="obWorkdays">每周工作天数</label><input id="obWorkdays" type="number" inputmode="numeric" min="1" max="7" step="1"><small class="field-error" id="obWorkdaysError"></small></div><div class="field"><label for="obDailyHours">每日标准工作时长</label><input id="obDailyHours" type="number" inputmode="decimal" min="0.5" max="24" step="0.5"><small class="field-error" id="obDailyHoursError"></small></div><div class="field wide-field"><label>默认休息日</label><div class="weekday-picker" id="obRestDays"></div></div><div class="field wide-field"><label for="obScheduleType">工资计算方式</label><select id="obScheduleType"><option value="standard">按月薪计算</option><option value="daily">按日薪计算</option><option value="shift">排班制</option></select></div></div>`;
        if (step.kind === "salary") return `<div class="onboarding-heading"><h1 id="onboardingTitle">${step.title}</h1><p>${step.text}</p></div><div class="onboarding-privacy">这些数据仅保存在当前设备中，不会上传到服务器。</div><div class="onboarding-form"><div class="field"><label for="obSalary">月薪</label><input id="obSalary" type="number" inputmode="decimal" min="0" step="100" placeholder="选填"><small class="field-error" id="obSalaryError"></small></div><div class="field"><label for="obDeductions">五险一金或固定扣除</label><input id="obDeductions" type="number" inputmode="decimal" min="0" step="50" placeholder="选填"><small class="field-error" id="obDeductionsError"></small></div><div class="field"><label for="obTax">个税预估 <em>选填</em></label><input id="obTax" type="number" inputmode="decimal" min="0" step="50" placeholder="选填"><small class="field-error" id="obTaxError"></small></div><div class="field"><label for="obPayday">发薪日 <em>选填</em></label><input id="obPayday" type="number" inputmode="numeric" min="1" max="31" step="1" placeholder="例如 10"><small class="field-error" id="obPaydayError"></small></div></div>`;
        return `<div class="onboarding-heading"><h1 id="onboardingTitle">${step.title}</h1><p>${step.text}</p></div><div class="onboarding-summary" id="onboardingSummary"></div>`;
    }

    window.RestCalOnboardingView = Object.freeze({steps, markup, restDayOptions});
})();
