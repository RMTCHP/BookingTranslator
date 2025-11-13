// =================== CONFIG ===================
const calendarDays = document.getElementById('calendarDays');
const monthYear = document.getElementById('monthYear');
const prevMonth = document.getElementById('prevMonth');
const nextMonth = document.getElementById('nextMonth');
const todayButton = document.getElementById('todayButton');
const modal = document.getElementById("myModal");
const modalText = document.getElementById("modalText");
const span = document.getElementsByClassName("close")[0];
const spinner = document.getElementById('spinner');
const refreshButton = document.querySelector('.refresh');

const API_URL = "https://script.google.com/macros/s/AKfycbzs7NdZGjjZTivIBIqR0OKRciTADISJGxQ9pGuriuwzmjaUaBng9HZfYSiqxFBQnUk/exec";

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

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

let allBookings = [];

// =================== FETCH BOOKINGS ===================
async function fetchBookings() {
  spinner.style.display = 'block';
  try {
    const res = await fetch(API_URL + "?page=listBookings");
    allBookings = await res.json();
  } catch (err) {
    console.error("❌ fetchBookings error:", err);
  } finally {
    spinner.style.display = 'none';
  }
}

// =================== RENDER CALENDAR ===================
function renderCalendar(month, year) {
  calendarDays.innerHTML = '';
  monthYear.textContent = `${months[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  // ช่องว่างก่อนวันที่ 1
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.classList.add('calendar-day');
    calendarDays.appendChild(emptyCell);
  }

  // วนวันที่ในเดือน
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${('0' + (month + 1)).slice(-2)}-${('0' + day).slice(-2)}`;
    const dayCell = document.createElement('div');
    dayCell.classList.add('calendar-day');
    dayCell.innerHTML = `<p>${day}</p>`;

    if (day === todayDate && month === todayMonth && year === todayYear) {
      dayCell.classList.add('today');
    }

    // ✅ รวมทั้ง Booked และ Unavailable (ไม่สนตัวพิมพ์ใหญ่/เล็ก)
    const events = allBookings.filter(b => {
      const status = (b.status || '').toUpperCase();
      return b.date === dateStr && (status === "BOOKED" || status === "UNAVAILABLE");
    });

    if (events.length > 0) {
      dayCell.classList.add('has-event');

      // นับจำนวนงานต่อ interpreter
      const count = { somSan: 0, gookSan: 0, pookySan: 0, lSan: 0 };
      events.forEach(ev => {
        if (ev.interpreterId === "i001") count.somSan++;
        if (ev.interpreterId === "i002") count.gookSan++;
        if (ev.interpreterId === "i003") count.pookySan++;
        if (ev.interpreterId === "i004") count.lSan++;
      });

      // Tooltip แสดงจำนวนงาน
      dayCell.title =
        `SOM SAN = ${count.somSan} Job\n` +
        `GOOK SAN = ${count.gookSan} Job\n` +
        `POOKY SAN = ${count.pookySan} Job\n` +
        `L SAN = ${count.lSan} Job`;
    }

    dayCell.addEventListener('click', () => {
      currentDay = day;
      loadEventsForDay(dateStr);
    });

    calendarDays.appendChild(dayCell);
  }
}

// =================== LOAD EVENTS FOR DAY ===================
function loadEventsForDay(dateStr) {
  spinner.style.display = 'block';

  // เคลียร์ตารางเก่า
  timeSlots.forEach(time => {
    document.getElementById(`somSan_${time}`).innerHTML = '';
    document.getElementById(`gookSan_${time}`).innerHTML = '';
    document.getElementById(`pookySan_${time}`).innerHTML = '';
    document.getElementById(`lSan_${time}`).innerHTML = '';
  });

  // ✅ ดึงทั้ง BOOKED + UNAVAILABLE (ไม่สนตัวพิมพ์)
  const events = allBookings.filter(b => {
    const status = (b.status || '').toUpperCase();
    return b.date === dateStr && (status === "BOOKED" || status === "UNAVAILABLE");
  });

  spinner.style.display = 'none';

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
function openModal() { modal.style.display = "block"; }
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

function changeMonth(offset) {
  currentMonth += offset;
  if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
  else if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
  renderCalendar(currentMonth, currentYear);
}

// =================== EVENTS ===================
refreshButton.addEventListener('click', () => {
  if (currentDay) {
    const dateStr = `${currentYear}-${('0' + (currentMonth + 1)).slice(-2)}-${('0' + currentDay).slice(-2)}`;
    loadEventsForDay(dateStr);
  }
});

todayButton.addEventListener('click', () => {
  const today = new Date();
  currentMonth = today.getMonth();
  currentYear = today.getFullYear();
  renderCalendar(currentMonth, currentYear);
});

prevMonth.addEventListener('click', () => changeMonth(-1));
nextMonth.addEventListener('click', () => changeMonth(1));

span.onclick = function() { closeModal(); }
window.onclick = function(event) { if (event.target == modal) closeModal(); }

// =================== INIT ===================
async function init(){
  await fetchBookings();
  renderCalendar(currentMonth, currentYear);
}
init();
