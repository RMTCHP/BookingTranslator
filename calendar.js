// =================== CONFIG ===================
const calendarDays = document.getElementById('calendarDays');
const monthYear = document.getElementById('monthYear');
const monthPickerWrap = document.getElementById('monthPickerWrap');
const monthPickerPopover = document.getElementById('monthPickerPopover');
const monthPickerYear = document.getElementById('monthPickerYear');
const monthYearPrev = document.getElementById('monthYearPrev');
const monthYearNext = document.getElementById('monthYearNext');
const monthGrid = document.getElementById('monthGrid');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const modal = document.getElementById("myModal");
const modalText = document.getElementById("modalText");
const span = document.getElementsByClassName("close")[0];
const spinner = document.getElementById('spinner');
const refreshButton = document.querySelector('.refresh');

const API_URL = "https://script.google.com/macros/s/AKfycbxHYHV7Ou-0DhTwTqdOs74GrqfOubZGNC0NLPn4e6jof9B6hsOyDeJwvGnk9mFiuRg/exec";

const INTERPRETER_MAP = {
  i001: "somSan",
  i002: "gookSan",
  i003: "pookySan",
  i004: "lSan"
};

const timeSlots = [
  '0700_0730', '0730_0800', '0800_0830', '0830_0900', '0900_0930', '0930_1000',
  '1000_1030', '1030_1100', '1100_1130', '1130_1200', '1200_1230', '1230_1300',
  '1300_1330', '1330_1400', '1400_1430', '1430_1500', '1500_1530', '1530_1600',
  '1600_1630', '1630_1700', '1700_1730', '1730_1800', '1800_1830', '1830_1900',
  '1900_1930', '1930_2000'
];

const date = new Date();
let currentMonth = date.getMonth();
let currentYear = date.getFullYear();
let currentDay = null;
let pickerYear = currentYear;

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let allBookings = [];
let calendarRenderToken = 0;
let calendarDayWorkAtMap = {};
const CALENDAR_INTERPRETERS = [
  { id: "i001", name: "SOM SAN", email: "teeraporn.sanyaprachasakul.xijqx@resonac.com" },
  { id: "i003", name: "POOKY SAN", email: "waraporn.yokao.xlbmb@resonac.com" },
  { id: "i004", name: "L SAN", email: "prataksara.poolsawad.xmpuh@resonac.com" }
];
const factoryPlanCache = {};

function normalizeFactoryValue(raw) {
  const v = String(raw || "").trim().toUpperCase();
  if (v === "CHP") return "CHP";
  if (v === "G1P") return "G1P";
  if (v === "CHP | G1P") return "CHP | G1P";
  if (v === "G1P | CHP") return "G1P | CHP";
  if (v === "LEAVE") return "Leave";
  return "Not set";
}

function fetchFactoryPlan(interpreterEmail, yearMonth) {
  const url = `${API_URL}?page=getFactoryPlan&interpreterEmail=${encodeURIComponent(interpreterEmail)}&yearMonth=${encodeURIComponent(yearMonth)}`;
  return fetch(url).then((r) => r.json());
}

async function getFactoryPlanByInterpreterForMonth(yearMonth) {
  if (!/^\d{4}-\d{2}$/.test(String(yearMonth || ""))) return {};
  const pairs = await Promise.all(
    CALENDAR_INTERPRETERS.map(async (it) => {
      const key = `${it.email}|${yearMonth}`;
      if (factoryPlanCache[key]) return [it.id, factoryPlanCache[key]];
      try {
        const result = await fetchFactoryPlan(it.email, yearMonth);
        const map = result && result.success && result.data ? result.data : {};
        factoryPlanCache[key] = map;
        return [it.id, map];
      } catch (_) {
        factoryPlanCache[key] = {};
        return [it.id, {}];
      }
    })
  );
  return Object.fromEntries(pairs);
}

function animateMonth(direction) {
  if (!calendarDays) return;
  calendarDays.classList.remove("month-slide-left", "month-slide-right");
  void calendarDays.offsetWidth; // force reflow to replay animation
  if (direction === "left") calendarDays.classList.add("month-slide-left");
  if (direction === "right") calendarDays.classList.add("month-slide-right");
}

// =================== FETCH BOOKINGS ===================
async function fetchBookings() {
  spinner.style.display = 'block';
  try {
    const res = await fetch(API_URL + "?page=listBookings");
    allBookings = await res.json();
  } catch (err) {
    console.error("âŒ fetchBookings error:", err);
  } finally {
    spinner.style.display = 'none';
  }
}

// =================== RENDER CALENDAR ===================
async function renderCalendar(month, year, slideDirection = "") {
  calendarDays.innerHTML = '';
  monthYear.textContent = `${months[month]} ${year}`;
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const factoryByInterpreter = await getFactoryPlanByInterpreterForMonth(monthKey);
  calendarDayWorkAtMap = {};
  const leaveByInterpreter = {
    i001: new Set(),
    i003: new Set(),
    i004: new Set()
  };
  (allBookings || []).forEach((b) => {
    const iid = String(b && b.interpreterId ? b.interpreterId : "").trim();
    const ymd = String(b && b.date ? b.date : "").trim();
    const title = String(b && b.title ? b.title : "").trim().toLowerCase();
    const status = String(b && b.status ? b.status : "").trim().toUpperCase();
    if (!leaveByInterpreter[iid]) return;
    if (!ymd.startsWith(monthKey + "-")) return;
    if (title !== "take leave") return;
    if (status === "CANCELED" || status === "CANCELLED") return;
    leaveByInterpreter[iid].add(ymd);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // à¸Šà¹ˆà¸­à¸‡à¸§à¹ˆà¸²à¸‡à¸à¹ˆà¸­à¸™à¸§à¸±à¸™à¸—à¸µà¹ˆ 1
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('calendar-day');
    calendarDays.appendChild(emptyCell);
  }

  // à¸§à¸™à¸§à¸±à¸™à¸—à¸µà¹ˆà¹ƒà¸™à¹€à¸”à¸·à¸­à¸™
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${('0' + (month + 1)).slice(-2)}-${('0' + day).slice(-2)}`;
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day');
    dayCell.innerHTML = `<p>${day}</p>`;

    if (day === todayDate && month === todayMonth && year === todayYear) {
      dayCell.classList.add('today');
    }

    // âœ… à¸£à¸§à¸¡à¸—à¸±à¹‰à¸‡ Booked à¹à¸¥à¸° Unavailable (à¹„à¸¡à¹ˆà¸ªà¸™à¸•à¸±à¸§à¸žà¸´à¸¡à¸žà¹Œà¹ƒà¸«à¸à¹ˆ/à¹€à¸¥à¹‡à¸)
    const events = allBookings.filter(b => {
      const status = (b.status || '').toUpperCase();
      return b.date === dateStr && (status === "BOOKED" || status === "UNAVAILABLE");
    });

    const i001Factory = leaveByInterpreter.i001.has(dateStr)
      ? "Leave"
      : normalizeFactoryValue(factoryByInterpreter.i001 && factoryByInterpreter.i001[dateStr]);
    const i003Factory = leaveByInterpreter.i003.has(dateStr)
      ? "Leave"
      : normalizeFactoryValue(factoryByInterpreter.i003 && factoryByInterpreter.i003[dateStr]);
    const i004Factory = leaveByInterpreter.i004.has(dateStr)
      ? "Leave"
      : normalizeFactoryValue(factoryByInterpreter.i004 && factoryByInterpreter.i004[dateStr]);
    calendarDayWorkAtMap[dateStr] = { i001: i001Factory, i003: i003Factory, i004: i004Factory };

    if (events.length > 0) {
      dayCell.classList.add('has-event');

      // à¸™à¸±à¸šà¸ˆà¸³à¸™à¸§à¸™à¸‡à¸²à¸™à¸•à¹ˆà¸­ interpreter
      const count = { somSan: 0, gookSan: 0, pookySan: 0, lSan: 0 };
      events.forEach(ev => {
        if (ev.interpreterId === "i001") { count.somSan++; }
        if (ev.interpreterId === "i002") { count.gookSan++; }
        if (ev.interpreterId === "i003") { count.pookySan++; }
        if (ev.interpreterId === "i004") { count.lSan++; }
      });

      const tooltipLine = (name, state, jobs) => {
        if (state === "Leave") return `${name} [Leave]`;
        return `${name} [${state}] = ${jobs} Job`;
      };

      // Tooltip à¹à¸ªà¸”à¸‡à¸ˆà¸³à¸™à¸§à¸™à¸‡à¸²à¸™
      dayCell.title =
        `${tooltipLine("SOM SAN", i001Factory, count.somSan)}\n` +
      //  `GOOK SAN = ${count.gookSan} Job\n` +
        `${tooltipLine("POOKY SAN", i003Factory, count.pookySan)}\n` +
        `${tooltipLine("L SAN", i004Factory, count.lSan)}`;
    }

    dayCell.addEventListener('click', () => {
      currentDay = day;
      loadEventsForDay(dateStr);
    });

    calendarDays.appendChild(dayCell);
  }

  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "calendar-month-workat",
      yearMonth: monthKey,
      workAtByDate: calendarDayWorkAtMap
    }, "*");
  }

  animateMonth(slideDirection);
}

async function renderCalendarWithLoader(month, year, slideDirection = "") {
  const token = ++calendarRenderToken;
  spinner.style.display = 'block';
  try {
    await renderCalendar(month, year, slideDirection);
  } finally {
    if (token === calendarRenderToken) spinner.style.display = 'none';
  }
}

// =================== LOAD EVENTS FOR DAY ===================
function loadEventsForDay(dateStr) {
  spinner.style.display = 'block';

  // à¹€à¸„à¸¥à¸µà¸¢à¸£à¹Œà¸•à¸²à¸£à¸²à¸‡à¹€à¸à¹ˆà¸²
  timeSlots.forEach(time => {
    document.getElementById(`somSan_${time}`).innerHTML = '';
    document.getElementById(`gookSan_${time}`).innerHTML = '';
    document.getElementById(`pookySan_${time}`).innerHTML = '';
    document.getElementById(`lSan_${time}`).innerHTML = '';
  });

  // âœ… à¸”à¸¶à¸‡à¸—à¸±à¹‰à¸‡ BOOKED + UNAVAILABLE (à¹„à¸¡à¹ˆà¸ªà¸™à¸•à¸±à¸§à¸žà¸´à¸¡à¸žà¹Œ)
  const events = allBookings.filter(b => {
    const status = (b.status || '').toUpperCase();
    return b.date === dateStr && (status === "BOOKED" || status === "UNAVAILABLE");
  });

  const detailEvents = events.map(ev => ({
    date: ev.date || "",
    startTime: ev.startTime || "",
    endTime: ev.endTime || "",
    title: ev.title || "",
    location: ev.location || "",
    userEmail: ev.userEmail || "",
    interpreterId: ev.interpreterId || "",
    status: (ev.status || "").toUpperCase()
  }));

  spinner.style.display = 'none';

  // If loaded inside dashboard iframe, ask parent to render details via SweetAlert.
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "calendar-day-details",
      date: dateStr,
      events: detailEvents,
      workAtByInterpreter: calendarDayWorkAtMap[dateStr] || { i001: "Not set", i003: "Not set", i004: "Not set" }
    }, "*");
    return;
  }

  if (events.length === 0) {
    modalText.textContent = `No events for ${dateStr}`;
    document.getElementById('eventTable').style.display = 'none';
  } else {
    document.getElementById('eventTable').style.display = '';
    events.forEach(ev => {
      let timeFrom = ev.startTime.replace(":", "");
      let timeTo = ev.endTime.replace(":", "");
      let username = ev.userEmail ? ev.userEmail.split("@")[0] : ev.userEmail;
      const status = (ev.status || '').toUpperCase();

      while (timeFrom < timeTo) {
        const slot = getTimeSlot(timeFrom);
        if (slot) {
          const col = INTERPRETER_MAP[ev.interpreterId];
          if (col) {
            const colorClass = status === "BOOKED" ? "blue-dot" : "orange-dot";
            document.getElementById(`${col}_${slot}`).innerHTML += `
              <span class="${colorClass}"
                data-tooltip="Title: ${ev.title}\nLocation: ${ev.location}\nUser: ${username}">
              </span>`;
          }
        }
        timeFrom = incrementTimeSlotBy30Minutes(timeFrom);
      }
    });
    modalText.textContent = `Details for ${dateStr}`;
  }

  openModal();
}

// =================== UTILS ===================
function openModal() {
  modal.style.display = "flex";
  modal.scrollTop = 0;
}
function closeModal() { modal.style.display = "none"; }

function getTimeSlot(timeFrom) {
  const slots = {
    '0700': '0700_0730', '0730': '0730_0800', '0800': '0800_0830', '0830': '0830_0900',
    '0900': '0900_0930', '0930': '0930_1000', '1000': '1000_1030', '1030': '1030_1100',
    '1100': '1100_1130', '1130': '1130_1200', '1200': '1200_1230', '1230': '1230_1300',
    '1300': '1300_1330', '1330': '1330_1400', '1400': '1400_1430', '1430': '1430_1500',
    '1500': '1500_1530', '1530': '1530_1600', '1600': '1600_1630', '1630': '1630_1700',
    '1700': '1700_1730', '1730': '1730_1800', '1800': '1800_1830', '1830': '1830_1900',
    '1900': '1900_1930', '1930': '1930_2000'
  };
  return slots[timeFrom] || null;
}

function incrementTimeSlotBy30Minutes(timeSlot) {
  let hour = parseInt(timeSlot.slice(0, 2));
  let minute = parseInt(timeSlot.slice(2));
  minute += 30;
  if (minute >= 60) { minute = 0; hour += 1; }
  return ('0' + hour).slice(-2) + ('0' + minute).slice(-2);
}

async function changeMonth(offset) {
  currentMonth += offset;
  if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
  else if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
  await renderCalendarWithLoader(currentMonth, currentYear, offset > 0 ? "left" : "right");
}

function toggleMonthPicker(forceOpen = null) {
  if (!monthPickerPopover) return;
  const willOpen = forceOpen === null ? !monthPickerPopover.classList.contains("open") : !!forceOpen;
  monthPickerPopover.classList.toggle("open", willOpen);
  monthPickerPopover.setAttribute("aria-hidden", String(!willOpen));
}

function renderMonthPicker() {
  if (!monthPickerYear || !monthGrid) return;
  monthPickerYear.textContent = String(pickerYear);
  monthGrid.innerHTML = months.map((name, idx) => {
    const activeClass = pickerYear === currentYear && idx === currentMonth ? "active" : "";
    const shortName = name.slice(0, 3);
    return `<button type="button" class="month-item ${activeClass}" data-month-index="${idx}">${shortName}</button>`;
  }).join("");
  monthGrid.querySelectorAll(".month-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const idx = Number(btn.getAttribute("data-month-index"));
      const oldIndex = currentYear * 12 + currentMonth;
      const newIndex = pickerYear * 12 + idx;
      currentYear = pickerYear;
      currentMonth = idx;
      await renderCalendarWithLoader(currentMonth, currentYear, newIndex > oldIndex ? "left" : "right");
      toggleMonthPicker(false);
    });
  });
}

// Expose handlers for inline onclick in calendar.html
window.changeMonth = changeMonth;

// =================== EVENTS ===================
if (refreshButton) {
  refreshButton.addEventListener('click', () => {
    if (currentDay) {
      const dateStr = `${currentYear}-${('0' + (currentMonth + 1)).slice(-2)}-${('0' + currentDay).slice(-2)}`;
      loadEventsForDay(dateStr);
    }
  });
}


if (span) {
  span.onclick = function() { closeModal(); };
}

window.onclick = function(event) {
  if (monthPickerWrap && !monthPickerWrap.contains(event.target)) {
    toggleMonthPicker(false);
  }
  if (modal && event.target == modal) closeModal();
};

if (monthYear) {
  monthYear.addEventListener("click", (e) => {
    e.stopPropagation();
    pickerYear = currentYear;
    renderMonthPicker();
    toggleMonthPicker();
  });
}

if (monthYearPrev) {
  monthYearPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    pickerYear -= 1;
    renderMonthPicker();
  });
}

if (monthYearNext) {
  monthYearNext.addEventListener("click", (e) => {
    e.stopPropagation();
    pickerYear += 1;
    renderMonthPicker();
  });
}

// =================== INIT ===================
async function init(){
  await fetchBookings();
  await renderCalendarWithLoader(currentMonth, currentYear);
}
init();




