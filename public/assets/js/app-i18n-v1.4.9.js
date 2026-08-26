/* RestCal application i18n. Keeps the existing Chinese source as the canonical copy. */
(function () {
    const STORAGE_KEY = "restcal-language";
    const textOriginals = new WeakMap();
    const attributeOriginals = new WeakMap();
    let language = "zh";
    let observer = null;

    const EN = {
        "休历": "RestCal",
        "请假、出行日程规划 & 工资核算": "Leave, travel planning & payroll",
        "正在加载日历数据": "Loading calendar data",
        "本地中国日历数据已就绪": "Chinese calendar data ready",
        "部分年份使用本地中国日历数据": "Some years use bundled Chinese calendar data",
        "正在使用本地备用日历数据": "Using local fallback calendar data",
        "首次设置模块暂不可用，请刷新后重试": "Setup is temporarily unavailable. Refresh and try again.",
        "远程日历暂不可用，正在使用本地备用数据": "Remote calendar unavailable; using local data",
        "部分年份使用远程数据，部分年份使用本地备用数据": "Some years use remote data; others use local data",
        "待发布": "Pending",
        "Chinese Days 发布该年度数据后，联网刷新页面即可自动获取。为避免误导，当前不计算该年度的出勤、工资和购票提醒。": "Once Chinese Days publishes data for this year, refresh while online to retrieve it automatically. To avoid misleading results, attendance, pay and ticket reminders are not calculated yet.",
        "今天": "Today", "上月": "Previous month", "下月": "Next month",
        "请假 / 出勤": "Leave / attendance", "请假每日扣款": "Daily leave deduction", "距下个节假日": "Next holiday in", "请假天数 / 已出勤天数": "Leave days / attended days", "按本月应出勤天数折算，实际按请假类型比例计算": "Based on this month's expected workdays; actual deduction varies by leave type",
        "选择日期": "Pick a date", "清空": "Clear", "上一年": "Previous year", "下一年": "Next year",
        "年份": "Year", "月份": "Month", "年月选择": "Year and month", "月份导航": "Month navigation", "月份切换": "Change month", "工具操作": "Tools",
        "搜索与筛选": "Search and filters", "切换主题": "Switch theme", "设置": "Settings", "使用说明": "Help", "界面引导": "Interface tour", "CSV 备份与导入": "CSV backup and import",
        "主题：跟随系统": "Theme: System", "主题：浅色": "Theme: Light", "主题：深色": "Theme: Dark",
        "关闭": "Close", "完成": "Done", "取消": "Cancel", "保存": "Save", "删除": "Delete", "清除": "Clear", "展开": "Expand", "收起": "Collapse", "选择": "Select",
        "本月统计": "This month", "月度": "Monthly", "年度": "Yearly", "月度统计": "Monthly stats", "年度统计": "Yearly stats", "统计周期": "Statistics period", "购票提醒": "Ticket reminders", "假期额度": "Leave allowance", "票据与工具": "Receipts and tools",
        "RestCal · 今日概览": "RestCal · Today", "欢迎使用 RestCal": "Welcome to RestCal", "把请假、出勤、工资和节假日安排放在一个日历里。": "Keep leave, attendance, pay and holidays together in one calendar.",
        "本月工作日": "Workdays", "已请假": "Leave taken", "剩余年假": "Annual leave left", "预计实发": "Estimated net pay", "下个节假日": "Next holiday", "最近请假": "Latest leave",
        "暂无记录": "No records yet", "暂无数据": "No data", "暂无安排": "None scheduled", "暂无": "None", "未设置": "Not set", "待设置": "Set up first", "未填写": "Not provided", "未标记": "Not marked",
        "核心状态": "Key status", "筛选": "Filter", "今日状态": "Today", "本月请假": "Leave this month", "本月出勤": "Attendance", "扣薪 / 实收": "Deduction / net", "已标记 / 应出勤": "Marked / expected", "按当前工资设置估算": "Estimated from current pay settings", "设置月薪后自动估算": "Set a monthly salary to estimate",
        "本月暂无请假": "No leave this month", "最近提醒": "Next reminder", "已开售": "On sale", "已开始": "Started",
        "应出勤": "Expected", "已出勤": "Attended", "总请假": "Total leave", "事假": "Personal leave", "病假": "Sick leave", "年假": "Annual leave", "调休": "Comp leave", "周末": "Weekend", "节假日": "Holiday", "工作日": "Workday", "出勤": "Present", "调休上班": "Make-up workday", "班": "Makeup",
        "设置": "Settings", "工资、假期额度和请假条默认内容会自动保存在本机浏览器。": "Pay, leave allowance and leave-note defaults are saved in this browser.",
        "个人与工作制度": "Profile and work schedule", "工资与扣款": "Pay and deductions", "假期额度": "Leave allowance", "请假条默认值": "Leave note defaults", "数据管理": "Data management", "WebDav 云备份": "WebDAV cloud backup",
        "姓名或昵称": "Name or nickname", "工作单位": "Company", "入职日期": "Start date", "每周工作天数": "Workdays per week", "每日标准工作时长": "Standard hours per day", "每日标准工作时长（小时）": "Standard hours per day", "小时": "hours", "工资计算方式": "Pay calculation", "默认休息日": "Default rest days",
        "按月薪计算": "Monthly salary", "按日薪计算": "Daily salary", "排班制": "Shift schedule", "选填": "optional",
        "月薪": "Monthly salary", "五险一金或固定扣除": "Insurance, housing fund or fixed deductions", "个税预估": "Estimated tax", "发薪日": "Payday",
        "事假扣款比例": "Personal leave deduction", "病假扣款比例": "Sick leave deduction", "年假扣款比例": "Annual leave deduction", "调休扣款比例": "Comp leave deduction",
        "这些数据仅保存在当前设备中，不会上传到服务器。": "This data stays on this device and is never uploaded to a server.",
        "年假额度": "Annual leave allowance", "调休额度": "Comp leave allowance", "申请人": "Applicant", "称呼": "Salutation", "事假默认理由": "Default personal leave reason", "病假默认理由": "Default sick leave reason", "工作安排说明": "Work handover notes",
        "重新运行首次引导": "Run onboarding again", "导出个人设置": "Export personal settings", "清除个人设置": "Clear personal settings", "清除所有本地数据": "Clear all local data", "CSV 导入导出": "CSV import/export", "WebDAV 云备份": "WebDAV cloud backup",
        "CSV 适合手动备份和迁移；WebDAV 适合跨设备保存云端备份。": "Use CSV for manual backup and migration, or WebDAV for cross-device cloud backups.",
        "服务器地址": "Server URL", "用户名": "Username", "密码": "Password", "账号 / 邮箱": "Account / email", "建议使用应用专用密码": "Use an app-specific password", "测试连接": "Test connection", "上传备份": "Upload backup", "从云端恢复": "Restore from cloud",
        "完成并进入 RestCal": "Finish and enter RestCal", "开始设置": "Start setup", "暂时跳过": "Skip for now", "稍后再设置": "Set up later", "返回": "Back", "下一步": "Next",
        "欢迎使用 RestCal": "Welcome to RestCal", "先认识一下你": "Tell us about yourself", "设置你的工作制度": "Set your work schedule", "工资信息": "Pay information", "设置完成": "Setup complete",
        "记录请假、统计出勤、计算工资，并在本地安全备份你的数据。": "Track leave and attendance, estimate pay, and back up your data locally.",
        "所有字段都可以留空，之后也能在设置里修改。": "Every field is optional and can be changed later in Settings.",
        "用默认值开始，或按单休、大小周和排班情况调整。": "Use the defaults or adjust them for single-rest-day, alternating-week or shift schedules.",
        "用于估算扣款和实发工资，不影响请假记录。": "Used only to estimate deductions and net pay; it does not change leave records.",
        "确认摘要后即可进入日历。": "Review your details, then enter the calendar.",
        "日历记录": "Calendar", "出勤统计": "Attendance", "工资估算": "Pay estimate", "数据备份": "Backup",
        "个人": "Profile", "工作制度": "Work schedule", "工资": "Pay",
        "使用说明": "Help", "知道了": "Got it", "搜索": "Search", "清空条件": "Clear filters", "确认筛选": "Apply filters",
        "快速上手": "Quick start", "用 2 分钟认识 RestCal": "Meet RestCal in 2 minutes",
        "跟随高亮提示认识日历记录、批量标记、统计、实用工具、外观设置和数据备份。": "Follow the highlights to learn calendar records, bulk marking, statistics, tools, appearance settings and backups.",
        "真实界面操作": "Try the real interface", "不会保存演示记录": "No demo record is saved", "随时可以退出": "Exit at any time",
        "暂不体验": "Not now", "开始引导": "Start tour", "退出界面引导": "Exit interface tour", "上一步": "Back",
        "点击高亮区域继续": "Select the highlighted area to continue",
        "切换日期范围": "Change the date range",
        "点击右箭头查看下一个月。旁边的年份、月份和“今天”也可以快速定位日期。": "Select the right arrow to view the next month. Use the year, month and Today controls to jump to a date.",
        "打开一天": "Open a day",
        "点击高亮的工作日，打开当天的出勤和请假记录。": "Select the highlighted workday to open its attendance and leave record.",
        "选择当天状态": "Choose the day status",
        "点击“年假”看看状态如何选择。引导不会替你保存这条演示记录。": "Select Annual leave to try choosing a status. The tour will not save this demo record.",
        "展开批量设置": "Open bulk settings",
        "点击“更多选项”，设置需要批量标记的日期范围。": "Select More options to set the date range you want to mark in bulk.",
        "选择多个日期": "Select multiple dates",
        "分别设置开始日期和结束日期。保存后，当前状态会应用到范围内所有工作日，并自动跳过周末和节假日。": "Set the start and end dates. When saved, the selected status is applied to every workday in the range, skipping weekends and public holidays.",
        "点击“统计”，查看月度出勤、请假天数和年度趋势。": "Select Statistics to see monthly attendance, leave totals and yearly trends.",
        "打开实用工具": "Open tools",
        "点击“工具”，这里可以生成工资条、请假条并查看购票提醒。": "Select Tools to generate payslips and leave notes or view ticket reminders.",
        "根据本月出勤和请假记录估算扣款、实发工资，并生成可下载的工资条。": "Estimate deductions and net pay from this month's attendance and leave records, then generate a downloadable payslip.",
        "根据所选月份的出勤和请假记录估算扣款、实发工资，并生成可下载的工资条。": "Estimate deductions and net pay from the selected month's attendance and leave records, then generate a downloadable payslip.",
        "填写日期、请假类型和理由，预览并下载规范的请假条。": "Enter dates, leave type and reason, then preview and download a formatted leave note.",
        "查看法定节假日火车票开售日期，提前安排假期出行。": "Check train-ticket sale dates for public holidays and plan your trip ahead.",
        "快速切换语言": "Quickly switch language",
        "右上角语言按钮可以在中文和 English 之间快速切换。": "Use the language button in the top-right to quickly switch between Chinese and English.",
        "进入设置": "Open Settings",
        "点击设置入口，管理工作制度、工资、假期额度和个人资料。": "Open Settings to manage your schedule, pay, leave allowances and profile.",
        "打开外观设置": "Open Appearance settings",
        "点击“外观”，设置主题和界面语言。": "Select Appearance to set the theme and interface language.",
        "选择显示主题": "Choose a display theme",
        "可以跟随系统，也可以固定使用浅色或深色主题。": "Follow the system theme, or keep the interface in light or dark mode.",
        "设置界面语言": "Set the interface language",
        "语言也可以在这里选择，设置会保存在当前设备。": "You can also choose the language here. The setting is saved on this device.",
        "找到数据与同步": "Find Data and sync",
        "点击“数据与同步”，进入备份、恢复和 WebDAV 配置。": "Select Data and sync for backups, restore and WebDAV configuration.",
        "记得备份数据": "Remember to back up",
        "RestCal 数据保存在当前设备。更换设备前，可以在这里导出 CSV 或配置 WebDAV。你已经完成界面引导。": "RestCal data stays on this device. Export CSV or configure WebDAV here before changing devices. You have completed the tour.",
        "界面引导模块暂不可用，请刷新后重试": "The interface tour is unavailable. Refresh and try again.",
        "已退出界面引导，可从右上角重新打开": "Tour closed. You can restart it from the top-right button.",
        "界面引导已完成": "Interface tour complete",
        "搜索日期、请假理由、备注、节假日": "Search date, leave reason, notes or holidays", "全部状态": "All statuses", "全部请假": "All leave", "开始日期": "Start date", "结束日期": "End date", "范围": "Range",
        "例如：小明": "e.g. Alex", "例如：RestCal 工作室": "e.g. RestCal Studio", "选填": "Optional",
        "请输入姓名": "Enter your name", "尊敬的领导": "Dear Manager", "个人事务": "Personal matters", "身体不适": "Illness",
        "请假期间我会提前安排好相关工作，确保不影响团队正常进度。": "I will arrange my work in advance to avoid disrupting the team's progress.",
        "账号 / 邮箱": "Account / email", "建议使用应用专用密码": "Use an app-specific password",
        "例如：个人事务、身体不适": "e.g. personal matters or illness", "选择请假类型时填写": "Enter after selecting a leave type", "可选": "Optional",
        "选择日期状态": "Choose day status", "请假理由": "Leave reason", "备注": "Notes", "更多选项": "More options", "生成请假条": "Generate leave note",
        "工资条": "Payslip", "请假条": "Leave note", "生成工资条": "Generate payslip", "请假合计": "Total leave", "请假扣款": "Leave deduction", "固定扣除": "Fixed deductions", "实际到手": "Net pay", "日薪": "Daily pay", "五险一金": "Insurance & housing fund", "个税预估": "Estimated tax", "仅供个人核算": "For personal estimates only",
        "日期": "Date", "状态": "Status", "请假类型": "Leave type", "是否节假日": "Holiday", "是否周末": "Weekend", "是": "Yes", "否": "No",
        "个人设置已导出": "Personal settings exported", "个人设置已清除": "Personal settings cleared", "设置已保存": "Settings saved", "设置已保存，欢迎来到 RestCal": "Settings saved. Welcome to RestCal.", "已跳过设置，之后可在设置中重新打开": "Setup skipped. You can run it again from Settings.",
        "CSV 数据": "CSV data", "导出 CSV": "Export CSV", "导入 CSV": "Import CSV", "CSV 已导出。": "CSV exported.",
        "导入前会校验字段和日期格式，校验失败不会覆盖现有数据。": "Fields and date formats are validated before import; invalid data will not overwrite existing records.",
        "事假 / 病假": "Personal / sick leave", "年假 / 调休": "Annual / comp leave",
        "查找请假、出勤、备注、农历和节假日，并跳转到日期。": "Find leave, attendance, notes, lunar dates and holidays, then jump to the date.",
        "关键词": "Keyword", "类型": "Type", "全部类型": "All types",
        "按下面步骤完成月份查看、请假管理、工资计算和数据备份。": "Follow these steps to browse months, manage leave, estimate pay and back up your data.",
        "切换月份": "Switch months",
        "使用顶部的年份、月份、上月、下月按钮查看不同月份。日历会自动标记周末、法定节假日、调休和农历信息。": "Use the year, month, previous and next controls at the top to browse the calendar. Weekends, public holidays, make-up workdays and lunar dates are marked automatically.",
        "标记单日状态": "Mark a day",
        "点击任意工作日，在弹窗中选择出勤、事假、病假、年假或调休。填写理由和备注后保存。": "Select any workday, choose attendance, personal, sick, annual or comp leave, then add an optional reason or note and save.",
        "批量请假或清除": "Mark or clear a date range",
        "在日期弹窗中设置开始日期和结束日期，再选择状态并保存。系统只会应用到工作日，自动跳过周末和法定节假日。": "Set a start and end date in the day dialog, choose a status and save. Only workdays are changed; weekends and public holidays are skipped automatically.",
        "查看统计": "View statistics",
        "左侧月度统计展示本月热力图和请假天数。右侧年度统计默认显示每月请假天数柱状图，也可以切换到全年每日热力图。": "Monthly statistics show a daily heatmap and leave totals. Yearly statistics show leave days by month and can switch to a full-year daily heatmap.",
        "设置额度和工资": "Set allowances and pay",
        "点击右上角设置按钮，统一填写年假、调休额度、月薪、固定扣除和各类请假扣款比例，即可得到请假扣款和实际收入。": "Open Settings to enter annual and comp leave allowances, monthly pay, fixed deductions and leave deduction rates, then RestCal will estimate deductions and net pay.",
        "在设置里维护申请人、称呼、默认理由和工作安排说明。点击日期后选择事假或病假，即可在弹窗里生成请假条。": "Save the applicant, salutation, default reasons and handover notes in Settings. Select personal or sick leave on a date to generate a leave note.",
        "备份和恢复": "Back up and restore",
        "在「设置 → 数据管理」中导出 CSV 备份（桌面端也可点击右上角的双向箭头图标）。更换浏览器或设备前建议先导出，之后可通过导入 CSV 恢复数据。": "Export a CSV backup from Settings → Data management (or use the two-arrow icon on desktop). Export before changing browsers or devices, then restore by importing the CSV.",
        "填好服务器地址、用户名和密码即可备份。建议地址末尾带一层子目录（如 /dav/xiuli/），程序会自动创建。": "Enter the server URL, username and password to back up. A dedicated subfolder such as /dav/xiuli/ is recommended and will be created automatically.",
        "恢复采用「合并」策略，不会删除本机已有记录。桌面版、本地服务及 Netlify 在线版均已绕过浏览器跨域限制。建议使用应用专用密码。": "Restore merges remote data without deleting existing local records. The desktop, local-server and Netlify versions handle browser cross-origin restrictions. Use an app-specific password.",
        "票据预览": "Receipt preview", "可下载为 PNG 图片": "Download as a PNG image", "打印/下载图片": "Print / download image",
        "填写请假信息，实时预览小票。": "Enter leave details to preview the receipt.", "工作安排": "Work handover",
        "填写左侧信息后点击生成": "Complete the form, then select Generate", "下载小票图片": "Download receipt image",
        "清除状态": "Clear status", "更多请假类型": "More leave types", "日期范围与备注": "Date range and notes",
        "个性化欢迎": "Personalized welcome", "本月关键状态": "Key status this month", "年度统计显示方式": "Yearly statistics view",
        "月度每日状态热力图": "Monthly daily-status heatmap", "年度每日状态热力图": "Yearly daily-status heatmap",
        "请假条信息": "Leave-note details", "请假条小票预览": "Leave-note receipt preview",
        "正在获取节假日、调休和农历数据...": "Loading holidays, make-up workdays and lunar dates...", "如果网络不可用，将自动使用本地备用数据。": "If the network is unavailable, local fallback data will be used automatically.", "点击日期可查看或编辑当天记录": "Select a date to view or edit its record",
        "本月状态分布": "Monthly status distribution", "每个方块代表本月一天，按周排列完整展示。": "Each square is one day of the month, arranged by week.", "每个方块代表全年一天，按周从左到右排列。": "Each square is one day of the year, arranged by week.",
        "月": "Month", "天": "Day", "年": "Year", "上午好": "Good morning", "早上好": "Good morning", "下午好": "Good afternoon", "晚上好": "Good evening", "夜深了": "Good evening",
        "周日": "Sun", "周一": "Mon", "周二": "Tue", "周三": "Wed", "周四": "Thu", "周五": "Fri", "周六": "Sat",
        "暂无购票提醒": "No ticket reminders", "本月没有节假日火车票开售节点。": "No holiday train-ticket sale dates this month.", "设置后可自动计算已用和剩余额度。": "Set an allowance to calculate used and remaining days.",
        "每月请假天数": "Leave days by month", "横轴为月份，柱高表示当月请假天数；切换到“每一天”可查看全年每日状态热力图。": "The horizontal axis shows months and bar height shows leave days. Switch to Day to view the yearly heatmap.",
        "按当前月份居中预览，并下载为图片": "Preview the current month and download it as an image", "填写请假时间和理由，预览并下载为图片": "Enter leave dates and a reason, then preview and download an image",
        "日历": "Calendar", "统计": "Statistics", "工具": "Tools", "主导航": "Main navigation", "本月概览": "Month overview", "设置分类": "Settings sections",
        "日": "Day", "周": "Week", "日历视图": "Calendar view",
        "上一天": "Previous day", "下一天": "Next day", "上一周": "Previous week", "下一周": "Next week", "上一年": "Previous year", "下一年": "Next year",
        "点击编辑当天记录": "Tap to edit this day", "今天还没有记录": "No record for today yet",
        "假期 · 好好休息": "Holiday · enjoy the break", "周末 · 无需打卡": "Weekend · no check-in required",
        "1月": "Jan", "2月": "Feb", "3月": "Mar", "4月": "Apr", "5月": "May", "6月": "Jun", "7月": "Jul", "8月": "Aug", "9月": "Sep", "10月": "Oct", "11月": "Nov", "12月": "Dec",
        "本月与全年的出勤、请假和额度使用情况。": "Attendance, leave and allowance usage for this month and the year.",
        "票据生成、数据备份和出行提醒。": "Receipts, data backup and travel reminders.",
        "处理请假、工资核算和假期出行。": "Create leave notes, calculate pay and plan holiday travel.",
        "工资核算与工资条": "Pay calculation & payslip", "核算本月扣款与实发工资，预览并下载工资条": "Calculate this month's deductions and net pay, then preview and download a payslip.",
        "选择月份核算扣款与实发工资，预览并下载工资条": "Choose a month to calculate deductions and net pay, then preview and download a payslip.",
        "工资年份": "Pay year", "工资月份": "Pay period", "按该月出勤记录和当前工资设置估算": "Estimated from that month's attendance and current pay settings",
        "选择工资月份，预览并下载 PNG 图片": "Choose a pay period, then preview and download a PNG image",
        "上一个月": "Previous month", "下一个月": "Next month",
        "开始核算": "Calculate pay", "填写请假日期和理由，预览并下载请假条": "Enter leave dates and a reason, then preview and download a leave note.", "创建请假条": "Create leave note",
        "查看本年度法定节假日火车票开售时间": "View train-ticket sale dates for this year's public holidays.", "查看提醒": "View reminders", "收起提醒": "Hide reminders",
        "本年度暂无购票提醒": "No ticket reminders this year", "本年度购票提醒均已结束": "This year's ticket reminders have ended", "本年度暂无节假日火车票开售节点。": "No public-holiday train-ticket sale dates this year.",
        "年度趋势": "Yearly trend", "最近记录": "Recent records", "设置额度": "Set allowance", "查看额度": "View allowance", "查看": "View", "去备份": "Back up", "撤销": "Undo",
        "还没有记录，点击日历中的日期开始标记。": "No records yet. Select a date in the calendar to start.",
        "完成初始设置": "Finish setting up", "填写工作制度、工资和假期额度，统计会更准确。": "Add your work schedule, pay and leave allowances for more accurate statistics.",
        "继续设置": "Continue setup", "暂不需要": "Not now",
        "今年的年假额度已用完": "This year's annual leave allowance is used up",
        "距上次云端备份已超过 30 天": "More than 30 days since the last cloud backup",
        "已配置 WebDAV，但还没有云端备份": "WebDAV is set up, but no cloud backup exists yet",
        "文档工具": "Documents", "数据工具": "Data", "出行工具": "Travel", "帮助": "Help",
        "生成请假条…": "Generate leave note…", "按当前月份预览，并下载为图片": "Preview the current month and download as an image",
        "下载全部记录和设置，用于备份或迁移": "Download all records and settings for backup or migration",
        "校验通过后与现有记录合并，不会覆盖数据": "Validated, then merged with existing records without overwriting",
        "跨设备备份和恢复数据": "Back up and restore data across devices",
        "法定节假日火车票开售提醒（按开售日前 15 天推算）。": "Train-ticket sale reminders for public holidays (sales open 15 days ahead).",
        "月份查看、请假管理、工资计算和数据备份": "Browse months, manage leave, estimate pay and back up data",
        "个人资料": "Profile", "薪资与扣款": "Pay and deductions", "请假条模板": "Leave note template", "数据与同步": "Data and sync", "外观": "Appearance", "高级设置": "Advanced",
        "‹ 设置": "‹ Settings", "返回设置目录": "Back to settings list", "关闭设置": "Close settings",
        "用于请假条署名和个性化显示，全部选填。": "Used for leave-note signatures and personalization. All fields are optional.",
        "决定日历中的应出勤天数和日薪折算。": "Determines expected workdays and the daily-pay conversion.",
        "用于估算请假扣款和实发工资，数据仅保存在本机。": "Used to estimate leave deductions and net pay. Data stays on this device.",
        "请假扣款比例（%）": "Leave deduction rates (%)",
        "设置每年可用的年假和调休天数，自动统计已用与剩余。": "Set yearly annual and comp leave allowances; used and remaining days are tracked automatically.",
        "生成请假条时的默认署名、称呼和理由。": "Default signature, salutation and reasons for generated leave notes.",
        "所有数据保存在本机浏览器，可通过 CSV 或 WebDAV 备份。": "All data lives in this browser and can be backed up via CSV or WebDAV.",
        "CSV 备份": "CSV backup",
        "适合手动备份和迁移。导入前会校验字段和日期格式，校验失败不会覆盖现有数据。": "Best for manual backup and migration. Fields and dates are validated before import; invalid files never overwrite existing data.",
        "主题与语言偏好保存在本机。": "Theme and language preferences are stored on this device.",
        "主题": "Theme", "深色模式会跟随此处设置": "Dark mode follows this setting", "跟随系统": "System", "浅色": "Light", "深色": "Dark", "语言": "Language", "界面显示语言": "Interface language",
        "引导、设置导出和数据清理。": "Onboarding, settings export and data cleanup.",
        "危险操作": "Danger zone",
        "重置资料、工作制度和工资配置，请假记录保留。": "Resets profile, schedule and pay settings. Leave records are kept.",
        "删除全部请假记录、设置和 WebDAV 配置，无法恢复。": "Deletes all leave records, settings and WebDAV config. This cannot be undone.",
        "全部清除": "Erase everything", "更改会自动保存在本机浏览器": "Changes are saved automatically in this browser",
        "年假额度（天 / 年）": "Annual leave allowance (days / year)", "调休额度（天 / 年）": "Comp leave allowance (days / year)",
        "填写上方额度后，会自动计算已用和剩余天数。": "Enter an allowance above to track used and remaining days automatically.",
        "未配置": "Not set up", "已配置": "Configured", "已连接": "Connected", "上次备份：暂无": "Last backup: none",
        "跨设备备份和恢复 RestCal 数据。": "Back up and restore RestCal data across devices.",
        "立即备份": "Back up now", "恢复数据": "Restore data", "配置 WebDAV": "Set up WebDAV", "管理配置": "Manage settings", "连接帮助": "Connection help", "连接坚果云、Nextcloud、群晖等 WebDAV 服务。": "Connect to Nutstore, Nextcloud, Synology, or another WebDAV service.", "填写连接信息后可先测试连接。": "Enter your connection details, then test the connection.",
        "建议地址末尾带一层子目录（如 /dav/xiuli/），首次备份会自动创建。坚果云等服务请使用「应用专用密码」，不要使用登录密码。": "Use a dedicated subfolder at the end of the URL (e.g. /dav/xiuli/); it is created on the first backup. For services like Jianguoyun, use an app-specific password instead of your login password.",
        "恢复采用「合并」策略，不会删除本机已有记录。桌面版、本地服务及 Netlify 在线版均已绕过浏览器跨域限制。": "Restore merges remote data without deleting local records. The desktop, local-server and Netlify versions handle browser cross-origin restrictions.",
        "请先填写服务器地址、用户名和密码。": "Enter the server URL, username and password first.",
        "正在测试连接…": "Testing connection…", "连接成功，可以备份。": "Connection successful. Ready to back up.",
        "连接正常，但目标目录还不存在，首次「立即备份」会自动创建。": "Connected, but the target folder does not exist yet. It will be created on the first backup.",
        "WebDAV 连接成功": "WebDAV connection successful", "WebDAV 连接失败，请检查配置": "WebDAV connection failed. Check your settings.",
        "正在上传备份…": "Uploading backup…", "云端备份成功": "Cloud backup successful", "云端备份失败，请查看状态说明": "Cloud backup failed. See the status message.",
        "正在从云端恢复…": "Restoring from the cloud…", "云端还没有备份文件，请先点「立即备份」。": "No backup file in the cloud yet. Use “Back up now” first.",
        "云端数据恢复成功": "Cloud data restored", "云端恢复失败，请查看状态说明": "Cloud restore failed. See the status message.",
        "云端恢复失败，文件格式无法识别": "Cloud restore failed: unrecognized file format", "云端恢复失败，文件缺少记录数据": "Cloud restore failed: the file has no record data",
        "从云端恢复数据？": "Restore data from the cloud?",
        "云端记录将与本机记录合并，同一天以较新的修改为准，不会删除本机已有记录。": "Cloud records merge with local records; for the same day the newer change wins. Nothing local is deleted.",
        "开始恢复": "Restore", "确认操作": "Confirm action", "确定": "OK",
        "清除个人设置？": "Clear personal settings?",
        "将重置个人资料、工作制度和工资配置。请假记录不会被删除。": "This resets your profile, work schedule and pay settings. Leave records are not deleted.",
        "清除所有本地数据？": "Clear all local data?",
        "将删除全部请假记录、个人与工资设置、主题与语言偏好以及 WebDAV 配置，且无法恢复。建议先导出 CSV 备份。": "This deletes all leave records, personal and pay settings, theme and language preferences, and the WebDAV config. It cannot be undone. Export a CSV backup first.",
        "记录已保存": "Record saved", "周末备注已保存": "Weekend note saved", "CSV 已导出": "CSV exported",
        "选择状态": "Choose status", "理由": "Reason", "仅自己可见": "Only visible to you", "清除记录": "Clear record", "请选择有效的日期范围": "Choose a valid date range",
        "选择范围后保存，会应用到范围内所有工作日，自动跳过周末和节假日。": "Saving with a range applies to every workday in it; weekends and holidays are skipped automatically.",
        "周末可添加备注，状态不可标记": "Weekends support notes only; status marking is unavailable.", "周末只能添加备注，不能标记出勤状态。": "Weekends support notes only; attendance status cannot be marked.",
        "可选择多个周末，保存后会将同一条备注应用到所选周末。": "Select multiple weekends to apply the same note to them.", "所选范围没有周末日期。": "The selected range contains no weekends.",
        "元旦": "New Year's Day", "春节": "Spring Festival", "清明节": "Qingming Festival", "劳动节": "Labour Day", "端午节": "Dragon Boat Festival", "中秋": "Mid-Autumn Festival", "中秋节": "Mid-Autumn Festival", "国庆节": "National Day",
        "小寒": "Minor Cold", "大寒": "Major Cold", "立春": "Start of Spring", "雨水": "Rain Water", "惊蛰": "Awakening of Insects", "春分": "Spring Equinox", "清明": "Pure Brightness", "谷雨": "Grain Rain", "立夏": "Start of Summer", "小满": "Grain Buds", "芒种": "Grain in Ear", "夏至": "Summer Solstice", "小暑": "Minor Heat", "大暑": "Major Heat", "立秋": "Start of Autumn", "处暑": "End of Heat", "白露": "White Dew", "秋分": "Autumn Equinox", "寒露": "Cold Dew", "霜降": "Frost Descent", "立冬": "Start of Winter", "小雪": "Minor Snow", "大雪": "Major Snow", "冬至": "Winter Solstice",
        "加班": "Overtime", "加班工时": "Overtime hours", "加班工时（小时）": "Overtime hours", "调休换算倍率": "Comp rate", "加班事由": "Overtime reason", "批量应用到": "Apply range to",
        "仅工作日": "Workdays only", "仅休息日": "Rest days only", "全部日期": "All dates", "普通出勤": "Regular attendance", "仅备注": "Notes only", "法定节假日": "Public holidays", "调休补班": "Make-up workdays", "抢票提醒时间": "Ticket reminder time",
        "加班会作为附加记录保存，不会覆盖当天的出勤或请假状态。": "Overtime is saved alongside the day's attendance or leave status and does not replace it.",
        "半天 (4 小时)": "Half day (4h)", "全天 (8 小时)": "Full day (8h)", "1.5 天 (12 小时)": "1.5 days (12h)", "2.0 天 (16 小时)": "2.0 days (16h)",
        "1.0x (1:1 调休)": "1.0x (1:1 comp)", "2.0x (双倍调休)": "2.0x (2x comp)", "3.0x (三倍调休)": "3.0x (3x comp)",
        "日历导出 (.ics)": "Calendar Export (.ics)", "日历文件导出 (.ics)": "iCalendar File Export (.ics)", "导出日历": "Export calendar",
        "导出当前年 (.ics)": "Export current year (.ics)", "导出当前年日历 (.ics)": "Export current year (.ics)", "导出全部记录 (.ics)": "Export all records (.ics)",
        "导出请假、节假日与抢票提醒至系统日历": "Export leave, holidays and ticket reminders to calendar apps",
        "将请假、出勤、节假日调休和抢票提醒导出为标准日历文件，支持导入 Apple 日历、Google 日历、飞书与企微。": "Export leave, attendance, holidays and ticket reminders as RFC 5545 .ics for Apple Calendar, Google Calendar, Feishu and WeCom.",
        "个税计算模式": "Tax calculation mode", "固定个税预估": "Fixed tax estimate", "阶梯个税（自然年累计预扣）": "Progressive tax (PRC cumulative withholding)",
        "专项附加扣除（元 / 月）": "Special deductions (CNY/mo)", "专项扣除": "Special deductions",
        "年假有效期": "Annual leave validity", "调休有效期": "Comp leave validity",
        "次年 3 月 31 日清零 (推荐)": "Expires Mar 31 next year (Recommended)", "次年 3 月 31 日清零": "Expires Mar 31 next year", "次年 6 月 30 日清零": "Expires Jun 30 next year", "当年度 12 月 31 日清零": "Expires Dec 31 current year", "永久有效 / 不自动清零": "Never expires",
        "可添加备注或加班记录": "Notes and overtime can be marked", "去规划": "Plan leave"
    };

    function translateCore(value) {
        const trimmed = value.trim();
        if (!trimmed) return value;
        let translated = EN[trimmed];
        if (!translated) {
            const lunarMonths = {"正月": 1, "一月": 1, "二月": 2, "三月": 3, "四月": 4, "五月": 5, "六月": 6, "七月": 7, "八月": 8, "九月": 9, "十月": 10, "冬月": 11, "十一月": 11, "腊月": 12, "十二月": 12};
            const lunarDays = ["初一", "初二", "初三", "初四", "初五", "初六", "初七", "初八", "初九", "初十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十", "廿一", "廿二", "廿三", "廿四", "廿五", "廿六", "廿七", "廿八", "廿九", "三十"];
            const lunar = trimmed.match(/^(闰)?(正月|一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|冬月|十一月|腊月|十二月)(初一|初二|初三|初四|初五|初六|初七|初八|初九|初十|十一|十二|十三|十四|十五|十六|十七|十八|十九|二十|廿一|廿二|廿三|廿四|廿五|廿六|廿七|廿八|廿九|三十)$/);
            if (lunar) translated = `Lunar ${lunar[1] ? "leap " : ""}${lunarMonths[lunar[2]]}/${lunarDays.indexOf(lunar[3]) + 1}`;
        }
        if (!translated) {
            const allowance = trimmed.match(/^(年假|调休)额度未设置$/);
            if (allowance) translated = `${EN[allowance[1]]} allowance not set`;
            const setAllowance = trimmed.match(/^设置(年假|调休)额度$/);
            if (setAllowance) translated = `Set ${EN[setAllowance[1]].toLowerCase()} allowance`;
            const holidayDate = trimmed.match(/^(中秋|中秋节|国庆节|春节|元旦|劳动节|清明节|端午节) · (.+)$/);
            if (holidayDate) translated = `${EN[holidayDate[1]]} · ${holidayDate[2]}`;
            const ticketToday = trimmed.match(/^(.+?)火车票今天开售，假期首日 (.+)$/);
            if (ticketToday) translated = `${EN[ticketToday[1]] || ticketToday[1]} train tickets go on sale today; the holiday starts ${translateCore(ticketToday[2])}`;
            const ticketSoon = trimmed.match(/^(.+?)火车票 (\d+) 天后开售（(.+)）$/);
            if (ticketSoon) translated = `${EN[ticketSoon[1]] || ticketSoon[1]} train tickets go on sale in ${ticketSoon[2]} days (${translateCore(ticketSoon[3])})`;
            const ticketOnSale = trimmed.match(/^(.+?)火车票已开售，假期首日 (.+)$/);
            if (ticketOnSale) translated = `${EN[ticketOnSale[1]] || ticketOnSale[1]} train tickets are on sale; the holiday starts ${translateCore(ticketOnSale[2])}`;
            const weekdayToday = trimmed.match(/^(周[一二三四五六日]) · 今天$/);
            if (weekdayToday && EN[weekdayToday[1]]) translated = `${EN[weekdayToday[1]]} · Today`;
        }
        if (!translated) {
            const greeting = trimmed.match(/^(夜深了|早上好|上午好|下午好|晚上好)，(.+)$/);
            if (greeting) translated = `${EN[greeting[1]]}, ${greeting[2]}`;
            const welcomeMonth = trimmed.match(/^(\d{4}) 年 (\d{1,2}) 月，今天也把节奏安排好。$/);
            if (welcomeMonth) {
                const date = new Date(Date.UTC(Number(welcomeMonth[1]), Number(welcomeMonth[2]) - 1, 1));
                translated = `${new Intl.DateTimeFormat("en", {month: "long", year: "numeric", timeZone: "UTC"}).format(date)} — stay on top of your plans today.`;
            }
            const statusCount = trimmed.match(/^(已出勤|出勤|事假|病假|年假|调休|周末|节假日|工作日)\s+(\d+(?:\.\d+)?)(\s*天)?$/);
            if (statusCount) translated = `${EN[statusCount[1]]} ${statusCount[2]}${statusCount[3] ? " days" : ""}`;
            const monthlyLeave = trimmed.match(/^(\d{4}-\d{2}) 请假 (\d+(?:\.\d+)?) 天$/);
            if (monthlyLeave) translated = `${monthlyLeave[1]} Leave ${monthlyLeave[2]} days`;
            const datedStatus = trimmed.match(/^(\d{4}-\d{2}-\d{2}) (工作日|周末|节假日|出勤|事假|病假|年假|调休)$/);
            if (datedStatus) translated = `${datedStatus[1]} ${EN[datedStatus[2]]}`;
        }
        if (!translated && trimmed.includes("，")) {
            const parts = trimmed.split("，");
            const localized = parts.map(part => translateCore(part));
            if (localized.some((part, index) => part !== parts[index])) translated = localized.join(", ");
        }
        if (!translated) {
            const rules = [
                [/^导入成功：(\d+) 条记录已合并，用户设置已恢复。$/, "Import successful: $1 records merged and user settings restored."],
                [/^(\d{4}) 年官方节假日数据尚未发布$/, "Official holiday data for $1 has not been published"],
                [/^正在核算 (\d{4}) 年 (\d{1,2}) 月工资…$/, "Calculating pay for $1-$2…"],
                [/^已从 Chinese Days 获取 (\d{4}) 年数据$/, "Chinese Days data for $1 loaded"],
                [/^(\d{4}) 年官方节假日数据尚未发布，暂不计算统计。$/, "Official holiday data for $1 is unavailable; statistics are not calculated."],
                [/^(\d{4}) 年官方节假日数据尚未发布，暂不估算工资。$/, "Official holiday data for $1 is unavailable; pay is not estimated."],
                [/^(\d{4}) 年官方节假日数据尚未发布，暂不生成购票提醒。$/, "Official holiday data for $1 is unavailable; ticket reminders are not generated."],
                [/^上传成功：已备份 (\d+) 条记录和全部用户设置（(.+)）。$/, "Upload successful: $1 records and all user settings backed up ($2)."],
                [/^恢复成功：新增 (\d+) 条，更新 (\d+) 条，用户设置已恢复。$/, "Restore successful: $1 added, $2 updated, and user settings restored."],
                [/^例如[：:]?\s*(.+)$/, "e.g. $1"],
                [/^(\d{4}) 年$/, "$1"],
                [/^(\d{1,2}) 月$/, "$1"],
                [/^(\d{1,2})月$/, "$1"],
                [/^(\d+(?:\.\d+)?) 天$/, "$1 days"],
                [/^(\d+)\s*\/\s*(\d+) 天$/, "$1 / $2 days"],
                [/^周末 (\d+)$/, "Weekend $1"],
                [/^(\d{4}-\d{2}-\d{2}) 周日$/, "$1 Sun"], [/^(\d{4}-\d{2}-\d{2}) 周一$/, "$1 Mon"], [/^(\d{4}-\d{2}-\d{2}) 周二$/, "$1 Tue"], [/^(\d{4}-\d{2}-\d{2}) 周三$/, "$1 Wed"], [/^(\d{4}-\d{2}-\d{2}) 周四$/, "$1 Thu"], [/^(\d{4}-\d{2}-\d{2}) 周五$/, "$1 Fri"], [/^(\d{4}-\d{2}-\d{2}) 周六$/, "$1 Sat"],
                [/^当前查看：(\d+)月$/, "Viewing: month $1"],
                [/^剩余年假 (.+)$/, "Annual leave left $1"],
                [/^每周 (.+) 天 · 每天 (.+) 小时$/, "$1 days/week · $2 hours/day"],
                [/^生成 (\d+) 月工资条$/, "Generate month $1 payslip"],
                [/^(\d+) 天后开售$/, "On sale in $1 days"],
                [/^(\d{4})年(\d{1,2})月$/, "$2/$1"],
                [/^导入成功：(.+)$/, "Import successful: $1"],
                [/^导入失败：(.+)$/, "Import failed: $1"],
                [/^连接失败：(.+)$/, "Connection failed: $1"],
                [/^上传失败：(.+)$/, "Upload failed: $1"],
                [/^恢复失败：(.+)$/, "Restore failed: $1"],
                [/^上次备份：今天 (\d{2}:\d{2})$/, "Last backup: today $1"],
                [/^上次备份：(.+)$/, "Last backup: $1"],
                [/^已清除 (\d+) 条记录$/, "Cleared $1 records"],
                [/^已保存 (\d+) 天记录$/, "Saved records for $1 days"],
                [/^已保存 (\d+) 个周末备注$/, "Saved notes for $1 weekends"],
                [/^共 (\d+) 条记录$/, "$1 records"],
                [/^额度 (\d+(?:\.\d+)?) 天$/, "Allowance: $1 days"],
                [/^今天 (\d{2}:\d{2})$/, "Today $1"],
                [/^(\d{1,2})月(\d{1,2})日$/, "$1/$2"],
                [/^：已用 (\d+(?:\.\d+)?) 天 \/ 额度 (\d+(?:\.\d+)?) 天 \/ 剩余 (\d+(?:\.\d+)?) 天$/, ": $1 used / $2 total / $3 left"]
            ];
            for (const [pattern, replacement] of rules) {
                if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
            }
        }
        if (!translated) return value;
        const start = value.match(/^\s*/)?.[0] || "";
        const end = value.match(/\s*$/)?.[0] || "";
        return `${start}${translated}${end}`;
    }

    function translatedOriginal(value) {
        return language === "en" ? translateCore(value) : value;
    }

    function translateTextNode(node) {
        if (node.parentElement?.closest("script, style, svg")) return;
        let original = textOriginals.get(node);
        if (original === undefined) {
            original = node.data;
            textOriginals.set(node, original);
        } else {
            const expectedEnglish = translateCore(original);
            if (node.data !== original && node.data !== expectedEnglish) {
                original = node.data;
                textOriginals.set(node, original);
            }
        }
        const next = translatedOriginal(original);
        if (node.data !== next) node.data = next;
    }

    function translateElement(element) {
        if (element.matches?.("script, style, svg, symbol, path")) return;
        const names = ["title", "aria-label", "placeholder"];
        let originals = attributeOriginals.get(element);
        if (!originals) { originals = new Map(); attributeOriginals.set(element, originals); }
        names.forEach(name => {
            if (!element.hasAttribute(name)) return;
            const current = element.getAttribute(name) || "";
            let original = originals.get(name);
            if (original === undefined || (current !== original && current !== translateCore(original))) {
                original = current;
                originals.set(name, original);
            }
            const next = translatedOriginal(original);
            if (current !== next) element.setAttribute(name, next);
        });
    }

    function apply(root = document) {
        if (root.nodeType === Node.TEXT_NODE) translateTextNode(root);
        if (root.nodeType === Node.ELEMENT_NODE) translateElement(root);
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
            else translateElement(node);
        }
        if (root !== document) return;
        const documentLanguage = language === "en" ? "en" : "zh-CN";
        const documentTitle = language === "en" ? "RestCal - Leave, attendance and pay" : "休历 - 请假、出勤与购票提醒";
        if (document.documentElement.lang !== documentLanguage) document.documentElement.lang = documentLanguage;
        if (document.title !== documentTitle) document.title = documentTitle;
        const button = document.getElementById("languageToggle");
        if (button) {
            const buttonText = language === "en" ? "ZH" : "EN";
            const buttonLabel = language === "en" ? "Switch to Chinese" : "Switch to English";
            if (button.textContent !== buttonText) button.textContent = buttonText;
            if (button.title !== buttonLabel) button.title = buttonLabel;
            if (button.getAttribute("aria-label") !== buttonLabel) button.setAttribute("aria-label", buttonLabel);
        }
    }

    function setLanguage(next) {
        language = next === "en" ? "en" : "zh";
        try { localStorage.setItem(STORAGE_KEY, language); } catch { }
        apply(document);
        window.dispatchEvent(new CustomEvent("restcal:languagechange", {detail: {language}}));
    }

    function init() {
        try { language = localStorage.getItem(STORAGE_KEY) || (navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en"); }
        catch { language = "zh"; }
        const nativeConfirm = window.confirm.bind(window);
        window.confirm = message => nativeConfirm(language === "en" ? translateCore(String(message)) : message);
        apply(document);
        observer = new MutationObserver(records => {
            records.forEach(record => {
                if (record.type === "characterData") translateTextNode(record.target);
                record.addedNodes.forEach(node => apply(node));
                if (record.type === "attributes") translateElement(record.target);
            });
        });
        observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["title", "aria-label", "placeholder"]});
    }

    window.RestCalI18n = Object.freeze({
        init,
        apply,
        t: value => language === "en" ? translateCore(String(value)) : String(value),
        getLanguage: () => language,
        toggle: () => setLanguage(language === "en" ? "zh" : "en"),
        setLanguage
    });
})();
