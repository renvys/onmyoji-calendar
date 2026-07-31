// 可配置数据：首领顺序、词条顺序和基准周都集中在这里。
const CONFIG = {
  bosses: ["鬼灵歌伎", "蜃气楼", "土蜘蛛", "荒骷髅", "地震鲶", "胧车", "夜荒魂"],
  terms: ["斗魂", "疾行", "巧劲", "易碎", "咒术", "猛火", "狂风"],
  termIcons: {
    "斗魂": "douhun",
    "疾行": "jixing",
    "巧劲": "qiaojin",
    "易碎": "yisui",
    "咒术": "zhoushu",
    "猛火": "menghuo",
    "狂风": "kuangfeng"
  },
  extremeWeekdays: new Set([1, 2, 3, 4]), // 周二至周五（下标从周一开始）
  baseMonday: new Date(2026, 6, 27),
  baseTermIndexes: { 1: 1, 2: 2, 3: 3, 4: 4 }
};

const weekdayNames = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];
const weekdayShort = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
const MIN_YEAR = 2022;
const MAX_YEAR = new Date().getFullYear() + 30;

const elements = {
  selectedDate: document.querySelector("#selectedDate"),
  dateNumber: document.querySelector("#dateNumber"),
  weekdayText: document.querySelector("#weekdayText"),
  statusBadge: document.querySelector("#statusBadge"),
  encounterTitle: document.querySelector("#encounterTitle"),
  termPanel: document.querySelector("#termPanel"),
  termIcon: document.querySelector("#termIcon"),
  termName: document.querySelector("#termName"),
  ordinaryPanel: document.querySelector("#ordinaryPanel"),
  sealCharacter: document.querySelector("#sealCharacter"),
  termTrack: document.querySelector("#termTrack"),
  monthTitle: document.querySelector("#monthTitle"),
  yearSelect: document.querySelector("#yearSelect"),
  yearSelectValue: document.querySelector("#yearSelectValue"),
  yearPicker: document.querySelector("#yearPicker"),
  yearOptions: document.querySelector("#yearOptions"),
  monthSelect: document.querySelector("#monthSelect"),
  monthSelectValue: document.querySelector("#monthSelectValue"),
  monthPicker: document.querySelector("#monthPicker"),
  monthOptions: document.querySelector("#monthOptions"),
  calendarGrid: document.querySelector("#calendarGrid"),
  scheduleList: document.querySelector("#scheduleList"),
  todayButton: document.querySelector("#todayButton"),
  previousMonth: document.querySelector("#previousMonth"),
  nextMonth: document.querySelector("#nextMonth")
};

const today = startOfDay(new Date());
let selected = startOfDay(new Date());
let visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a, b) {
  return dateKey(a) === dateKey(b);
}

function floorMod(number, divisor) {
  return ((number % divisor) + divisor) % divisor;
}

function getEncounter(date) {
  const weekday = mondayIndex(date);
  const isExtreme = CONFIG.extremeWeekdays.has(weekday);
  let term = null;
  let termIndex = null;

  if (isExtreme) {
    const dateMonday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekday);
    const weekOffset = Math.round((dateMonday - CONFIG.baseMonday) / 604800000);
    termIndex = floorMod(CONFIG.baseTermIndexes[weekday] + weekOffset, CONFIG.terms.length);
    term = CONFIG.terms[termIndex];
  }

  return {
    weekday,
    boss: CONFIG.bosses[weekday],
    seal: CONFIG.bosses[weekday].slice(0, 1),
    isExtreme,
    term,
    termIndex
  };
}

function formatFullDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function renderEncounter() {
  const encounter = getEncounter(selected);
  elements.selectedDate.textContent = formatFullDate(selected);
  elements.dateNumber.textContent = selected.getDate();
  elements.weekdayText.textContent = weekdayNames[encounter.weekday];
  elements.encounterTitle.textContent = encounter.boss;
  elements.sealCharacter.textContent = encounter.seal;

  elements.statusBadge.textContent = encounter.isExtreme ? "极" : "普通";
  elements.statusBadge.classList.toggle("is-extreme", encounter.isExtreme);
  elements.statusBadge.classList.toggle("is-ordinary", !encounter.isExtreme);
  elements.termPanel.hidden = !encounter.isExtreme;
  elements.ordinaryPanel.hidden = encounter.isExtreme;

  if (encounter.isExtreme) {
    elements.termName.textContent = encounter.term;
    elements.termIcon.dataset.termIcon = CONFIG.termIcons[encounter.term];
  }

  elements.termTrack.innerHTML = CONFIG.terms.map((term, index) => {
    const active = encounter.termIndex === index ? " active" : "";
    return `<span class="term-pip${active}" role="img" title="${term}" aria-label="${term}">
      <span class="term-icon term-pip-icon" data-term-icon="${CONFIG.termIcons[term]}" aria-hidden="true"></span>
    </span>`;
  }).join("");
}

function renderCalendar() {
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  elements.monthTitle.textContent = `${year}年 ${month + 1}月`;
  elements.yearSelectValue.textContent = String(year);
  elements.yearOptions.innerHTML = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, index) => {
      const optionYear = MIN_YEAR + index;
      return `<button class="year-option" type="button" role="option" data-year="${optionYear}" aria-selected="${optionYear === year}">${optionYear}</button>`;
    }
  ).join("");
  elements.monthSelectValue.textContent = String(month + 1);
  elements.monthOptions.innerHTML = Array.from(
    { length: 12 },
    (_, index) => `<button class="month-option" type="button" role="option" data-month="${index}" aria-selected="${index === month}">${index + 1}</button>`
  ).join("");
  elements.previousMonth.disabled = year === MIN_YEAR && month === 0;
  elements.nextMonth.disabled = year === MAX_YEAR && month === 11;

  const firstWeekday = mondayIndex(new Date(year, month, 1));
  const gridStart = new Date(year, month, 1 - firstWeekday);
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const encounter = getEncounter(date);
    const outside = date.getMonth() !== month;
    const selectedClass = sameDay(date, selected) ? " is-selected" : "";
    const todayClass = sameDay(date, today) ? " is-today" : "";
    const outsideClass = outside ? " is-outside" : "";
    const term = encounter.isExtreme ? `<span class="day-term">
      <span class="term-icon day-term-icon" data-term-icon="${CONFIG.termIcons[encounter.term]}" aria-hidden="true"></span>
      <span>${encounter.term}</span>
    </span>` : "";
    const label = `${formatFullDate(date)}，${encounter.boss}${encounter.isExtreme ? `，极词条${encounter.term}` : "，普通逢魔"}`;

    cells.push(`
      <button class="day-cell${outsideClass}${selectedClass}${todayClass}" type="button"
        role="gridcell" data-date="${dateKey(date)}" aria-label="${label}" aria-selected="${sameDay(date, selected)}">
        <span class="day-number">${date.getDate()}</span>
        ${term}
      </button>
    `);
  }

  elements.calendarGrid.innerHTML = cells.join("");
}

function renderSchedule() {
  elements.scheduleList.innerHTML = CONFIG.bosses.map((boss, index) => `
    <div class="schedule-item${CONFIG.extremeWeekdays.has(index) ? " has-extreme" : ""}">
      <span class="schedule-day">${weekdayShort[index]}</span>
      <span class="schedule-boss">${boss}</span>
    </div>
  `).join("");
}

function renderAll() {
  renderEncounter();
  renderCalendar();
}

function selectDate(date) {
  selected = startOfDay(date);
  visibleMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  renderAll();
}

function moveVisibleMonth(offset) {
  const candidate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
  const minimum = new Date(MIN_YEAR, 0, 1);
  const maximum = new Date(MAX_YEAR, 11, 1);
  visibleMonth = candidate < minimum ? minimum : candidate > maximum ? maximum : candidate;
  renderCalendar();
}

elements.calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-date]");
  if (!button) return;
  const [year, month, day] = button.dataset.date.split("-").map(Number);
  selectDate(new Date(year, month - 1, day));
});

elements.previousMonth.addEventListener("click", () => {
  moveVisibleMonth(-1);
});

elements.nextMonth.addEventListener("click", () => {
  moveVisibleMonth(1);
});

let wheelLocked = false;
elements.calendarGrid.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (wheelLocked || Math.abs(event.deltaY) < 12) return;
  moveVisibleMonth(event.deltaY > 0 ? 1 : -1);
  wheelLocked = true;
  setTimeout(() => { wheelLocked = false; }, 220);
}, { passive: false });

function setYearPickerOpen(open) {
  elements.yearSelect.setAttribute("aria-expanded", String(open));
  elements.yearOptions.hidden = !open;
  if (open) {
    requestAnimationFrame(() => {
      elements.yearOptions.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    });
  }
}

function setMonthPickerOpen(open) {
  elements.monthSelect.setAttribute("aria-expanded", String(open));
  elements.monthOptions.hidden = !open;
  if (open) {
    requestAnimationFrame(() => {
      elements.monthOptions.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    });
  }
}

elements.yearSelect.addEventListener("click", () => {
  setMonthPickerOpen(false);
  setYearPickerOpen(elements.yearSelect.getAttribute("aria-expanded") !== "true");
});

elements.monthSelect.addEventListener("click", () => {
  setYearPickerOpen(false);
  setMonthPickerOpen(elements.monthSelect.getAttribute("aria-expanded") !== "true");
});

elements.yearOptions.addEventListener("click", (event) => {
  const option = event.target.closest("[data-year]");
  if (!option) return;
  visibleMonth = new Date(Number(option.dataset.year), visibleMonth.getMonth(), 1);
  setYearPickerOpen(false);
  renderCalendar();
  elements.yearSelect.focus();
});

elements.monthOptions.addEventListener("click", (event) => {
  const option = event.target.closest("[data-month]");
  if (!option) return;
  visibleMonth = new Date(visibleMonth.getFullYear(), Number(option.dataset.month), 1);
  setMonthPickerOpen(false);
  renderCalendar();
  elements.monthSelect.focus();
});

document.addEventListener("click", (event) => {
  if (!elements.yearPicker.contains(event.target)) setYearPickerOpen(false);
  if (!elements.monthPicker.contains(event.target)) setMonthPickerOpen(false);
});

elements.yearPicker.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setYearPickerOpen(false);
    elements.yearSelect.focus();
  }
});

elements.monthPicker.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMonthPickerOpen(false);
    elements.monthSelect.focus();
  }
});

elements.todayButton.addEventListener("click", () => selectDate(today));

renderSchedule();
renderAll();

function loadVisitCounter() {
  const counter = document.getElementById("busuanzi_container_site_pv");
  const counterValue = document.getElementById("busuanzi_value_site_pv");
  const footer = counter?.closest("footer");

  const revealCounter = () => {
    if (!/^\d+$/.test(counterValue?.textContent.trim() || "")) return;
    footer?.classList.add("has-visit-count");
    observer.disconnect();
  };

  const observer = new MutationObserver(revealCounter);
  if (counter) observer.observe(counter, { attributes: true, childList: true, subtree: true });

  const counterScript = document.createElement("script");
  counterScript.src = "https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js";
  counterScript.async = true;
  document.body.appendChild(counterScript);
}

window.addEventListener("load", () => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadVisitCounter, { timeout: 2000 });
    return;
  }

  window.setTimeout(loadVisitCounter, 0);
});
