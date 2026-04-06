const API_URL = "https://script.google.com/macros/s/AKfycbzQL4inr6RI8Mm7O0nsXF20i4b106su38ofLyfAIpAYwPhFlolfaltN7-VLiasJ_l8/exec"; 

function showLoader(){ document.getElementById("loader").style.display="flex"; }
function hideLoader(){ document.getElementById("loader").style.display="none"; }
function logout(){ localStorage.removeItem("loggedInUser"); window.location.href="index.html"; }

function refreshCalendarFrame() {
  const iframe = document.getElementById("calendarFrame");
  if (iframe) iframe.src = "calendar.html";
}

const userMenu = document.getElementById("userMenu");
const userInfoBtn = document.getElementById("userInfo");
const menuChangePassword = document.getElementById("menuChangePassword");
const menuLogout = document.getElementById("menuLogout");
const bookingView = document.getElementById("bookingView");
const dashboardView = document.getElementById("dashboardView");
const navMyBooking = document.getElementById("navMyBooking");
const navDashboard = document.getElementById("navDashboard");
const DASH_INTERPRETERS = ["i001", "i003", "i004"];
const NEW_BOOKING_INTERPRETERS = ["i001", "i003", "i004"];
const DASH_INTERPRETER_NAMES = {
  i001: "SOM SAN",
  i003: "POOKY SAN",
  i004: "L SAN"
};
let dashDailyChart = null;
let dashInterpreterChart = null;
let dashLoaded = false;
let dashboardNeedsRefresh = false;
let dashAllBookedRows = [];
let dashSelectedMonth = "";
let dashPickerYear = new Date().getFullYear();
let dashChartLibPromise = null;
let bookingViewInitialized = false;
let newBookingWorkAtByInterpreter = {};
const calendarWorkAtCacheByMonth = {};
const leaveInterpreterCacheByMonth = {};

const dashMonthPickerWrap = document.getElementById("dashMonthPickerWrap");
const dashMonthPickerBtn = document.getElementById("dashMonthPickerBtn");
const dashMonthPickerPopover = document.getElementById("dashMonthPickerPopover");
const dashMonthPickerYearEl = document.getElementById("dashMonthPickerYear");
const dashMonthYearPrev = document.getElementById("dashMonthYearPrev");
const dashMonthYearNext = document.getElementById("dashMonthYearNext");
const dashMonthGrid = document.getElementById("dashMonthGrid");
const myDatePickerWrap = document.getElementById("myDatePickerWrap");
const myDateBtn = document.getElementById("myDateBtn");
const myDatePickerPopover = document.getElementById("myDatePickerPopover");
const myDatePickerMonthYear = document.getElementById("myDatePickerMonthYear");
const myDateMonthPrev = document.getElementById("myDateMonthPrev");
const myDateMonthNext = document.getElementById("myDateMonthNext");
const myDateGrid = document.getElementById("myDateGrid");
const myDateAllMonthBtn = document.getElementById("myDateAllMonthBtn");

function ensureDashboardChartLibrary() {
  if (typeof Chart !== "undefined") return Promise.resolve(true);
  if (dashChartLibPromise) return dashChartLibPromise;

  dashChartLibPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "chart.min.js";
    script.async = true;
    script.onload = () => resolve(typeof Chart !== "undefined");
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
    setTimeout(() => resolve(typeof Chart !== "undefined"), 7000);
  });

  return dashChartLibPromise;
}

function toggleUserMenu(forceOpen = null) {
  if (!userMenu) return;
  const willOpen = forceOpen === null ? !userMenu.classList.contains("open") : !!forceOpen;
  userMenu.classList.toggle("open", willOpen);
  if (userInfoBtn) userInfoBtn.setAttribute("aria-expanded", String(willOpen));
}

async function sha256Text(text) {
  const data = new TextEncoder().encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function openChangePasswordDialog() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.username) return;

  const { value: formData } = await Swal.fire({
    title: "Change Password",
    html: `
      <div class="change-pass-form">
        <div class="change-pass-field">
          <label for="newPwd">New Password</label>
          <input id="newPwd" class="swal2-input change-pass-input" type="password" placeholder="Enter new password">
        </div>
        <div class="change-pass-field">
          <label for="confirmPwd">Confirm Password</label>
          <input id="confirmPwd" class="swal2-input change-pass-input" type="password" placeholder="Re-enter new password">
        </div>
      </div>
    `,
    customClass: {
      popup: "swal-change-pass-popup",
      title: "swal-change-pass-title",
      confirmButton: "swal-change-pass-confirm",
      cancelButton: "swal-change-pass-cancel"
    },
    buttonsStyling: false,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const newPwd = document.getElementById("newPwd").value;
      const confirmPwd = document.getElementById("confirmPwd").value;
      if (!newPwd || !confirmPwd) {
        Swal.showValidationMessage("Please fill both password fields.");
        return null;
      }
      if (newPwd !== confirmPwd) {
        Swal.showValidationMessage("Passwords do not match.");
        return null;
      }
      if (newPwd.length < 6) {
        Swal.showValidationMessage("Password must be at least 6 characters.");
        return null;
      }
      return { newPwd };
    }
  });

  if (!formData) return;

  try {
    showLoader();
    const passwordHash = await sha256Text(formData.newPwd);
    const form = new URLSearchParams();
    form.append("page", "updatePassword");
    form.append("username", user.username);
    form.append("passwordHash", passwordHash);

    const res = await fetch(API_URL, { method: "POST", body: form });
    const result = await res.json();
    hideLoader();

    if (result.success) Swal.fire("Success", result.message || "Password updated.", "success");
    else Swal.fire("Error", result.message || "Cannot change password.", "error");
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  }
}

function bindUserMenu() {
  if (userInfoBtn) {
    userInfoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleUserMenu();
    });
  }
  if (menuChangePassword) {
    menuChangePassword.addEventListener("click", async () => {
      toggleUserMenu(false);
      await openChangePasswordDialog();
    });
  }
  if (menuLogout) {
    menuLogout.addEventListener("click", () => {
      toggleUserMenu(false);
      logout();
    });
  }
  document.addEventListener("click", (e) => {
    if (userMenu && !userMenu.contains(e.target)) toggleUserMenu(false);
  });
}

function renderHeaderUserInfo() {
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const userInfoEl = document.getElementById("userInfo");
  if (!userInfoEl || !user) return;
  userInfoEl.innerHTML = `
    <span class="user-icon" aria-hidden="true"><span class="user-dot-head"></span><span class="user-dot-body"></span></span>
    <span class="user-name">${user.username}</span>
    <span class="user-role">${user.role}</span>
    <span class="user-caret" aria-hidden="true">
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
      </svg>
    </span>
  `;
}

function switchWorkspaceView(view) {
  const isDashboard = view === "dashboard";
  if (!bookingView || !dashboardView || !navMyBooking || !navDashboard) return;

  navMyBooking.classList.toggle("active", !isDashboard);
  navDashboard.classList.toggle("active", isDashboard);

  if (isDashboard) {
    bookingView.classList.remove("booking-enter");
    bookingView.style.display = "none";
    dashboardView.style.display = "block";
    dashboardView.style.opacity = "1";
    dashboardView.style.transform = "translateY(0)";
    if (!dashLoaded || dashboardNeedsRefresh) {
      showLoader();
      dashLoaded = false;
      loadDashboardPanel();
    }
    return;
  }

  dashboardView.style.display = "none";
  bookingView.style.display = "grid";
  bookingView.style.opacity = "1";
  bookingView.style.transform = "translateY(0)";
  bookingView.classList.remove("booking-enter");
  void bookingView.offsetWidth;
  bookingView.classList.add("booking-enter");
  bookingView.classList.add("booking-focus");
  clearTimeout(window.__bookingEnterTimer);
  window.__bookingEnterTimer = setTimeout(() => {
    bookingView.classList.remove("booking-enter");
  }, 600);

  if (!bookingViewInitialized) {
    bookingViewInitialized = true;
    refreshCalendarFrame();
    loadMyBookings();
  }
}

function bindWorkspaceSidebar() {
  if (navMyBooking) {
    navMyBooking.addEventListener("click", () => switchWorkspaceView("booking"));
  }
  if (navDashboard) {
    navDashboard.addEventListener("click", () => switchWorkspaceView("dashboard"));
  }
}

function dashLocalDateParts() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return { y, m, d, ymd: `${y}-${m}-${d}`, ym: `${y}-${m}` };
}

async function getDashboardWorkAtByInterpreter(ymd) {
  const monthKey = String(ymd || "").slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return {};

  const pairs = await Promise.all(
    DASH_INTERPRETERS.map(async (iid) => {
      const interpreterEmail = getInterpreterEmail(iid);
      if (!interpreterEmail) return [iid, "-"];
      try {
        const url = `${API_URL}?page=getFactoryPlan&interpreterEmail=${encodeURIComponent(interpreterEmail)}&yearMonth=${encodeURIComponent(monthKey)}`;
        const res = await fetch(url);
        const result = await res.json();
        const map = result && result.success && result.data ? result.data : {};
        const raw = String(map[ymd] || "").trim().toUpperCase();
        const normalized = (raw === "CHP" || raw === "G1P" || raw === "CHP | G1P" || raw === "G1P | CHP")
          ? raw
          : "-";
        return [iid, normalized];
      } catch (_) {
        return [iid, "-"];
      }
    })
  );
  return Object.fromEntries(pairs);
}

function computeMonthChartData(ym) {
  const monthRows = dashAllBookedRows.filter((r) => String(r.date || "").replace(/^'/, "").startsWith(ym));
  const perDayTotals = {};
  const monthCategoryCounts = { CHP: 0, G1P: 0, "MS Team": 0, Other: 0 };

  monthRows.forEach((r) => {
    const d = String(r.date || "").replace(/^'/, "");
    if (!d) return;
    perDayTotals[d] = (perDayTotals[d] || 0) + 1;

    const location = String(r.location || "").trim().toUpperCase();
    if (location.startsWith("CHP-")) monthCategoryCounts.CHP += 1;
    else if (location.startsWith("G1P-")) monthCategoryCounts.G1P += 1;
    else if (location.includes("MS-TEAM") || location.includes("MS TEAM")) monthCategoryCounts["MS Team"] += 1;
    else monthCategoryCounts.Other += 1;
  });

  return { monthRows, perDayTotals, monthCategoryCounts };
}

function renderDashboardInterpreterCards(todayRows, workAtByInterpreter = null) {
  const workMap = workAtByInterpreter && typeof workAtByInterpreter === "object" ? workAtByInterpreter : {};
  DASH_INTERPRETERS.forEach((iid) => {
    const todayByInterpreter = (Array.isArray(todayRows) ? todayRows : []).filter((r) => String(r.interpreterId || "") === iid);
    const totalJobsToday = todayByInterpreter.length;
    const jobEl = document.getElementById(`dash${iid.toUpperCase()}Job`);
    const locEl = document.getElementById(`dash${iid.toUpperCase()}Loc`);
    if (!jobEl || !locEl) return;

    jobEl.innerHTML = `<span class="interpreter-meta-label">Today's Bookings</span><span class="interpreter-meta-value">${totalJobsToday}</span>`;
    const rawWorkAt = String(workMap[iid] || "Not set");
    const workAt = rawWorkAt === "-" ? "Not set" : rawWorkAt;
    let badgeClass = "work-at-badge empty";
    if (workAt === "CHP") badgeClass = "work-at-badge chp";
    else if (workAt === "G1P") badgeClass = "work-at-badge g1p";
    else if (workAt === "CHP | G1P") badgeClass = "work-at-badge mixed-chp-g1p";
    else if (workAt === "G1P | CHP") badgeClass = "work-at-badge mixed-g1p-chp";
    locEl.innerHTML = `<span class="interpreter-meta-label">Work at</span><span class="${badgeClass}">${escapeHtml(workAt)}</span>`;
  });
}

function renderDashboardChartsForMonth(ym) {
  if (!ym) return;
  dashSelectedMonth = ym;
  const monthLabel = formatDashMonthLabel(ym);
  if (dashMonthPickerBtn) dashMonthPickerBtn.textContent = monthLabel;
  const dashChannelMonthLabel = document.getElementById("dashChannelMonthLabel");
  if (dashChannelMonthLabel) dashChannelMonthLabel.textContent = monthLabel;
  const { perDayTotals, monthCategoryCounts } = computeMonthChartData(ym);
  buildDashboardDailyChart(perDayTotals, ym);
  buildDashboardInterpreterChart(monthCategoryCounts);
}

function formatDashMonthLabel(ym) {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "-";
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function toggleDashMonthPicker(forceOpen = null) {
  if (!dashMonthPickerPopover) return;
  const willOpen = forceOpen === null ? !dashMonthPickerPopover.classList.contains("open") : !!forceOpen;
  dashMonthPickerPopover.classList.toggle("open", willOpen);
  dashMonthPickerPopover.setAttribute("aria-hidden", String(!willOpen));
}

function renderDashMonthPicker() {
  if (!dashMonthGrid || !dashMonthPickerYearEl) return;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  dashMonthPickerYearEl.textContent = String(dashPickerYear);
  dashMonthGrid.innerHTML = months
    .map((name, idx) => {
      const monthValue = `${dashPickerYear}-${String(idx + 1).padStart(2, "0")}`;
      const active = monthValue === dashSelectedMonth ? "active" : "";
      return `<button type="button" class="dash-month-item ${active}" data-month="${monthValue}">${name}</button>`;
    })
    .join("");

  dashMonthGrid.querySelectorAll(".dash-month-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const monthValue = btn.getAttribute("data-month");
      renderDashboardChartsForMonth(monthValue);
      toggleDashMonthPicker(false);
    });
  });
}

function initDashMonthPicker(defaultYm) {
  if (!defaultYm) return;
  dashSelectedMonth = defaultYm;
  dashPickerYear = Number(defaultYm.slice(0, 4)) || new Date().getFullYear();
  if (dashMonthPickerBtn) dashMonthPickerBtn.textContent = formatDashMonthLabel(defaultYm);
  renderDashMonthPicker();

  if (dashMonthPickerBtn && !dashMonthPickerBtn.dataset.bound) {
    dashMonthPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renderDashMonthPicker();
      toggleDashMonthPicker();
    });
    dashMonthPickerBtn.dataset.bound = "1";
  }
  if (dashMonthYearPrev && !dashMonthYearPrev.dataset.bound) {
    dashMonthYearPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      dashPickerYear -= 1;
      renderDashMonthPicker();
    });
    dashMonthYearPrev.dataset.bound = "1";
  }
  if (dashMonthYearNext && !dashMonthYearNext.dataset.bound) {
    dashMonthYearNext.addEventListener("click", (e) => {
      e.stopPropagation();
      dashPickerYear += 1;
      renderDashMonthPicker();
    });
    dashMonthYearNext.dataset.bound = "1";
  }
  if (!document.body.dataset.dashMonthPickerBound) {
    document.addEventListener("click", (event) => {
      if (dashMonthPickerWrap && !dashMonthPickerWrap.contains(event.target)) {
        toggleDashMonthPicker(false);
      }
    });
    document.body.dataset.dashMonthPickerBound = "1";
  }
}

function buildDashboardDailyChart(perDayTotals, ym) {
  const canvas = document.getElementById("dashDailyChart");
  if (!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  const [year, month] = ym.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const labels = Array.from({ length: lastDay }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
  const teamTotals = labels.map((day) => Number(perDayTotals[day] || 0));

  if (dashDailyChart) dashDailyChart.destroy();
  dashDailyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.map((d) => d.slice(-2)),
      datasets: [{
        label: "Team Total",
        data: teamTotals,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.18)",
        borderWidth: 2.5,
        tension: 0.28,
        fill: true,
        pointRadius: 2.5,
        pointHoverRadius: 4.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1100,
        easing: "easeOutQuart"
      },
      animations: {
        y: {
          from: 0,
          duration: 1100,
          easing: "easeOutQuart",
          delay(context) {
            return (context.dataIndex || 0) * 20;
          }
        }
      },
      plugins: { legend: { position: "top" } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.25)" } },
        x: { grid: { color: "rgba(148,163,184,0.15)" } }
      }
    }
  });
}

function buildDashboardInterpreterChart(monthCategoryCounts) {
  const canvas = document.getElementById("dashInterpreterChart");
  if (!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  const labels = ["CHP", "G1P", "MS Team", "Other"];
  const values = labels.map((k) => Number(monthCategoryCounts[k] || 0));
  if (dashInterpreterChart) dashInterpreterChart.destroy();
  dashInterpreterChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Bookings",
        data: values,
        backgroundColor: ["#3b82f6", "#10b981", "#8b5cf6", "#94a3b8"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: "easeOutCubic"
      },
      animations: {
        y: {
          from: 0,
          duration: 1000,
          easing: "easeOutCubic",
          delay(context) {
            return (context.dataIndex || 0) * 120;
          }
        }
      },
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,0.25)" } },
        x: { grid: { display: false } }
      }
    }
  });
}

async function loadDashboardPanel() {
  if (dashLoaded) return;
  dashLoaded = true;
  showLoader();
  try {
    const { ymd, ym } = dashLocalDateParts();
    const res = await fetch(`${API_URL}?page=listBookings`);
    const rows = await res.json();
    const bookedRows = Array.isArray(rows)
      ? rows.filter((r) => String(r.status || "").toUpperCase() === "BOOKED")
      : [];
    dashAllBookedRows = bookedRows;

    const monthRows = bookedRows.filter((r) => String(r.date || "").replace(/^'/, "").startsWith(ym));
    const todayRows = bookedRows
      .filter((r) => String(r.date || "").replace(/^'/, "") === ymd)
      .sort((a, b) => String(a.startTime || "").localeCompare(String(b.startTime || "")));

    const totalMonthEl = document.getElementById("dashTotalMonth");
    const totalTodayEl = document.getElementById("dashTotalToday");
    const totalInterpreterEl = document.getElementById("dashTotalInterpreter");
    const monthLabelEl = document.getElementById("dashMonthLabel");
    const todayLabelEl = document.getElementById("dashTodayLabel");
    if (totalMonthEl) totalMonthEl.textContent = String(monthRows.length);
    if (totalTodayEl) totalTodayEl.textContent = String(todayRows.length);
    if (totalInterpreterEl) totalInterpreterEl.textContent = String(DASH_INTERPRETERS.length);
    if (monthLabelEl) monthLabelEl.textContent = ym;
    if (todayLabelEl) todayLabelEl.textContent = ymd;

    // Render cards immediately to avoid blocking dashboard first paint.
    renderDashboardInterpreterCards(todayRows);

    initDashMonthPicker(ym);
    if (typeof Chart !== "undefined") {
      renderDashboardChartsForMonth(ym);
    } else {
      const ready = await ensureDashboardChartLibrary();
      if (ready) renderDashboardChartsForMonth(ym);
    }

    // Load Work at asynchronously after dashboard data is visible.
    getDashboardWorkAtByInterpreter(ymd)
      .then((workMap) => {
        renderDashboardInterpreterCards(todayRows, workMap);
      })
      .catch(() => {});
    dashboardNeedsRefresh = false;
  } catch (err) {
    dashLoaded = false;
    Swal.fire("Error", `Cannot load dashboard data: ${err.message}`, "error");
  } finally {
    hideLoader();
  }
}

// ================= MODAL CONTROL =================
function openModal(){ document.getElementById("myModal").style.display="block"; renderAllMyBookings(); }
function closeModal(){ document.getElementById("myModal").style.display="none"; }
function setNewBookingInputsDisabled(disabled) {
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const ids = ["interpreterId", "timeFrom", "timeTo", "title", "location", "locationSpecify"];
  ids.forEach((id) => {
    const el = form.querySelector(`#${id}`);
    if (el) {
      el.disabled = !!disabled;
      const label = form.querySelector(`label[for="${id}"]`);
      if (label) label.classList.toggle("field-disabled", !!disabled);
    }
  });
  const submitBtn = form.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.disabled = !!disabled;
}

function getLocationSelectAndSpecify(form) {
  const f = form || document.getElementById("bookingForm");
  if (!f) return { select: null, specify: null };
  return {
    select: f.querySelector("#location"),
    specify: f.querySelector("#locationSpecify")
  };
}

function toggleLocationSpecifyInput(form, forceShow = null) {
  const { select, specify } = getLocationSelectAndSpecify(form);
  if (!select || !specify) return;
  const shouldShow = forceShow === null ? String(select.value) === "__SPECIFY__" : !!forceShow;
  specify.style.display = shouldShow ? "block" : "none";
  specify.required = shouldShow;
  if (!shouldShow) specify.value = "";
}

function getResolvedLocationValue(form) {
  const { select, specify } = getLocationSelectAndSpecify(form);
  if (!select) return "";
  if (String(select.value) !== "__SPECIFY__") return String(select.value || "").trim();
  return String((specify && specify.value) || "").trim();
}

function setLocationValueForForm(form, locationValue) {
  const { select, specify } = getLocationSelectAndSpecify(form);
  if (!select || !specify) return;
  const raw = String(locationValue || "").trim();
  if (!raw) {
    select.value = "";
    toggleLocationSpecifyInput(form, false);
    return;
  }
  const exists = Array.from(select.options).some((opt) => String(opt.value || opt.text || "").trim() === raw);
  if (exists) {
    select.value = raw;
    toggleLocationSpecifyInput(form, false);
  } else {
    select.value = "__SPECIFY__";
    toggleLocationSpecifyInput(form, true);
    specify.value = raw;
  }
}

function getInterpreterStatusBadgeInfo(rawWorkAt) {
  const raw = String(rawWorkAt || "").trim().toUpperCase();
  const compact = raw.replace(/\s+/g, "");
  if (raw === "LEAVE") {
    return { label: "Leave", badgeClass: "leave" };
  }
  if (raw === "CHP") {
    return { label: "CHP (All day)", badgeClass: "chp" };
  }
  if (raw === "G1P") {
    return { label: "G1P (All day)", badgeClass: "g1p" };
  }
  if (compact === "CHP|G1P") {
    return { label: "CHP (Morning), G1P (Afternoon)", badgeClass: "split-chp-g1p" };
  }
  if (compact === "G1P|CHP") {
    return { label: "G1P (Morning), CHP (Afternoon)", badgeClass: "split-g1p-chp" };
  }
  return { label: "Not set", badgeClass: "unset" };
}

function renderInterpreterOptionsForNewBooking(workAtMap = {}, selectedId = "") {
  const select = document.getElementById("interpreterId");
  if (!select) return;
  const selected = String(selectedId || "").trim();
  const hasDate = Object.keys(workAtMap || {}).length > 0;
  const firstLabel = hasDate ? "Select Interpreter" : "Select date first";
  const firstSelected = selected ? "" : "selected";
  const optionHtml = NEW_BOOKING_INTERPRETERS.map((iid) => {
    const name = getInterpreterName(iid);
    const workAt = String((workAtMap && workAtMap[iid]) || "").trim();
    const statusText = getInterpreterStatusBadgeInfo(workAt).label;
    const label = `${name} [Work at: ${statusText}]`;
    const selectedAttr = selected === iid ? "selected" : "";
    return `<option value="${iid}" ${selectedAttr}>${escapeHtml(label)}</option>`;
  }).join("");
  select.innerHTML = `<option value="" disabled ${firstSelected}>${firstLabel}</option>${optionHtml}`;
}

function getCachedWorkAtByInterpreter(ymd) {
  const dateStr = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const monthKey = dateStr.slice(0, 7);
  const monthMap = calendarWorkAtCacheByMonth[monthKey];
  if (!monthMap || typeof monthMap !== "object") return null;
  const dayMap = monthMap[dateStr];
  if (!dayMap || typeof dayMap !== "object") return null;
  const out = {};
  NEW_BOOKING_INTERPRETERS.forEach((iid) => {
    const raw = String(dayMap[iid] || "Not set").trim();
    out[iid] = raw || "Not set";
  });
  return out;
}

async function getLeaveInterpreterIdsByDate(ymd) {
  const dateStr = String(ymd || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Set();
  const monthKey = dateStr.slice(0, 7);
  if (!leaveInterpreterCacheByMonth[monthKey]) {
    try {
      const res = await fetch(`${API_URL}?page=listBookings`);
      const rows = await res.json();
      const monthMap = {};
      (Array.isArray(rows) ? rows : []).forEach((r) => {
        const iid = String(r && r.interpreterId ? r.interpreterId : "").trim();
        const d = String(r && r.date ? r.date : "").trim();
        const title = String(r && r.title ? r.title : "").trim().toLowerCase();
        const status = String(r && r.status ? r.status : "").trim().toUpperCase();
        if (!NEW_BOOKING_INTERPRETERS.includes(iid)) return;
        if (!d.startsWith(`${monthKey}-`)) return;
        if (title !== "take leave") return;
        if (status === "CANCELED" || status === "CANCELLED") return;
        if (!monthMap[d]) monthMap[d] = new Set();
        monthMap[d].add(iid);
      });
      leaveInterpreterCacheByMonth[monthKey] = monthMap;
    } catch (_) {
      leaveInterpreterCacheByMonth[monthKey] = {};
    }
  }
  const setRef = leaveInterpreterCacheByMonth[monthKey][dateStr];
  return setRef instanceof Set ? setRef : new Set();
}

function getFactoryCodeFromLocation(locationValue) {
  const raw = String(locationValue || "").trim().toUpperCase();
  if (raw.startsWith("CHP-")) return "CHP";
  if (raw.startsWith("G1P-")) return "G1P";
  return "";
}

function resolveFactoryByStartTime(workAtValue, startTime) {
  const raw = String(workAtValue || "").trim().toUpperCase();
  if (raw === "CHP" || raw === "G1P") return raw;
  if (raw !== "CHP | G1P" && raw !== "G1P | CHP") return "";
  const parts = raw.split("|").map((v) => String(v || "").trim());
  const amFactory = parts[0] || "";
  const pmFactory = parts[1] || "";
  const m = String(startTime || "").match(/^(\d{1,2}):(\d{2})/);
  const hh = m ? Number(m[1]) : 0;
  const mm = m ? Number(m[2]) : 0;
  const mins = (hh * 60) + mm;
  return mins < 12 * 60 ? amFactory : pmFactory;
}

async function validateInterpreterFactoryBeforeSubmit(dateVal, interpreterId, locationVal, startTimeVal) {
  const locationFactory = getFactoryCodeFromLocation(locationVal);
  if (!locationFactory || !interpreterId) return true;

  const ymd = String(dateVal || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return true;

  let workAt = String(newBookingWorkAtByInterpreter[interpreterId] || "").toUpperCase().trim();
  if (!workAt || (workAt !== "CHP" && workAt !== "G1P" && workAt !== "CHP | G1P" && workAt !== "G1P | CHP")) {
    try {
      const map = await getDashboardWorkAtByInterpreter(ymd);
      workAt = String(map[interpreterId] || "").toUpperCase().trim();
    } catch (_) {
      workAt = "";
    }
  }
  const effectiveFactory = resolveFactoryByStartTime(workAt, startTimeVal);
  if (effectiveFactory !== "CHP" && effectiveFactory !== "G1P") return true;
  if (effectiveFactory === locationFactory) return true;

  await Swal.fire({
    icon: "warning",
    title: "Factory mismatch",
    text: `This interpreter is assigned to a different factory. Please select another interpreter or change the location to MS Team.`,
    confirmButtonText: "OK",
    allowOutsideClick: true
  });
  return false;
}

async function updateNewBookingInterpreterByDate(dateStr, selectedId = "") {
  const ymd = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    renderInterpreterOptionsForNewBooking({}, "");
    setNewBookingInputsDisabled(true);
    return;
  }
  const cached = getCachedWorkAtByInterpreter(ymd);
  if (cached) {
    newBookingWorkAtByInterpreter = { ...cached };
    renderInterpreterOptionsForNewBooking(cached, selectedId);
    setNewBookingInputsDisabled(false);
    return;
  }
  renderInterpreterOptionsForNewBooking({}, "");
  const select = document.getElementById("interpreterId");
  if (select) {
    select.innerHTML = `<option value="" disabled selected>Loading interpreters...</option>`;
  }
  try {
    const workAtMap = await getDashboardWorkAtByInterpreter(ymd);
    const leaveIds = await getLeaveInterpreterIdsByDate(ymd);
    leaveIds.forEach((iid) => { workAtMap[iid] = "Leave"; });
    newBookingWorkAtByInterpreter = { ...workAtMap };
    renderInterpreterOptionsForNewBooking(workAtMap, selectedId);
  } catch (_) {
    newBookingWorkAtByInterpreter = {};
    renderInterpreterOptionsForNewBooking({}, selectedId);
  }
  setNewBookingInputsDisabled(false);
}

function openNewBookingModal(){ 
  const modal = document.getElementById("newBookingModal");
  const header = modal.querySelector(".modal-header");
  const title = header.querySelector("h3");
  const form = document.getElementById("bookingForm");

  // ✅ รีเซ็ตฟอร์มและโหมด
  form.reset();
  form.setAttribute("data-mode", "new");
  form.removeAttribute("data-id");

  // ✅ ลบปุ่ม Save/Edit ออกถ้ามี
  const oldButtons = document.getElementById("editButtons");
  if (oldButtons) oldButtons.remove();

  // New mode style
  modal.classList.remove("is-edit");
  title.innerText = "New Booking";
  newBookingWorkAtByInterpreter = {};
  setNewBookingInputsDisabled(true);
  const dateInput = form.querySelector("#date");
  if (dateInput) dateInput.disabled = false;
  renderInterpreterOptionsForNewBooking({}, "");
  toggleLocationSpecifyInput(form, false);

  modal.style.display = "block";
}
  
function closeNewBookingModal(){ 
  const modal = document.getElementById("newBookingModal");
  const header = modal.querySelector(".modal-header");
  const title = header.querySelector("h3");
  const submitBtn = modal.querySelector("button[type='submit']");

  // Reset to new mode style
  modal.classList.remove("is-edit");
  title.innerText = "New Booking";

  // ✅ แสดงปุ่ม Submit กลับมา
  if (submitBtn) submitBtn.style.display = "inline-block";

  // ✅ ลบปุ่ม edit ด้านล่างถ้ามี
  const oldButtons = document.getElementById("editButtons");
  if (oldButtons) oldButtons.remove();

  modal.style.display = "none"; 
}

// ================= LOAD MY BOOKINGS =================
async function loadMyBookings(){
  const user=JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user){
    Swal.fire("กรุณา Login ก่อน","","warning").then(()=>window.location.href="index.html");
    return;
  }
  renderHeaderUserInfo();

  try{
    showLoader();
    const res=await fetch(API_URL+"?page=listBookings");
    const bookings=await res.json();
    hideLoader();

    const today=new Date().toISOString().split("T")[0];
    const myBookings=bookings
      .filter(b=>b.userId===user.id&&b.date===today&&b.status!=="CANCELED")
      .sort((a,b)=>{
        const [ah,am]=a.startTime.split(":").map(Number);
        const [bh,bm]=b.startTime.split(":").map(Number);
        return ah*60+am-(bh*60+bm);
      });
    renderMyBookings(myBookings);
    window.allMyBookings=bookings.filter(b=>b.userId===user.id);
  }catch(err){
    hideLoader();
    Swal.fire("Error",err.message,"error");
  }
}
  
let viewMode = "today"; // "today" หรือ "monthly"

function changeViewMode() {
  viewMode = "today";
  goToday();
}

  
// ================= TIME FORMAT =================
function parseDatePart(dateVal){
  if (!dateVal) return null;
  const s = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y,m,d] = s.split('-').map(Number);
    return new Date(y, m-1, d);
  }
  const d = new Date(s);
  return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseTimePart(timeVal){
  if (!timeVal) return null;
  const s = String(timeVal).trim();
  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) return { hh: parseInt(m[1],10), mm: parseInt(m[2],10) };
  const d = new Date(s);
  if (!isNaN(d)) return { hh: d.getHours(), mm: d.getMinutes() };
  return null;
}

function formatRange(dateVal, startTime, endTime){
  const d  = parseDatePart(dateVal);
  const st = parseTimePart(startTime);
  const et = parseTimePart(endTime);
  if (!d || !st || !et) return `${dateVal} ${startTime} - ${endTime}`;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), st.hh, st.mm);
  const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), et.hh, et.mm);
  const dateStr  = start.toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  const startStr = start.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", hour12:false });
  const endStr   = end.toLocaleTimeString("en-GB",   { hour:"2-digit", minute:"2-digit", hour12:false });
  return `${dateStr}, ${startStr} - ${endStr}`;
}

// ================= INTERPRETER MAP =================
const INTERPRETERS = {
  i001: { name: "SOM SAN",  email: "teeraporn.sanyaprachasakul.xijqx@resonac.com" },
  i002: { name: "GOOK SAN", email: "boonnak.songnok.xijmk@resonac.com" },
  i003: { name: "POOKY SAN",email: "waraporn.yokao.xlbmb@resonac.com" },
  i004: { name: "L SAN",    email: "prataksara.poolsawad.xmpuh@resonac.com" }
};
function getInterpreterEmail(id){ return (INTERPRETERS[id] && INTERPRETERS[id].email) || ""; }
function getInterpreterName(id){ return (INTERPRETERS[id] && INTERPRETERS[id].name) || id; }
const CALENDAR_SLOT_KEYS = [
  "0700_0730","0730_0800","0800_0830","0830_0900","0900_0930","0930_1000",
  "1000_1030","1030_1100","1100_1130","1130_1200","1200_1230","1230_1300",
  "1300_1330","1330_1400","1400_1430","1430_1500","1500_1530","1530_1600",
  "1600_1630","1630_1700","1700_1730","1730_1800","1800_1830","1830_1900",
  "1900_1930","1930_2000"
];
const SLOT_STARTS = CALENDAR_SLOT_KEYS.map((k) => k.split("_")[0]);
const SLOT_INDEX_BY_START = Object.fromEntries(SLOT_STARTS.map((s, i) => [s, i]));
const CALENDAR_COLUMNS = [
  { id: "i001", label: "SOM SAN" },
  { id: "i003", label: "POOKY SAN" },
  { id: "i004", label: "L SAN" }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function openCalendarDetailsSwal(dateStr, events, workAtByInterpreter = null) {
  const formatDisplayDate = (raw) => {
    const s = String(raw || "").trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const monthIndex = Number(m[2]) - 1;
      const mon = months[monthIndex] || m[2];
      return `${m[3]}-${mon}-${m[1]}`;
    }
    return s;
  };
  const safeDate = escapeHtml(formatDisplayDate(dateStr));
  const list = Array.isArray(events) ? events : [];
  const normalizeHeaderWorkAt = (raw) => {
    const v = String(raw || "").trim().toUpperCase();
    if (v === "CHP") return "CHP";
    if (v === "G1P") return "G1P";
    if (v === "CHP | G1P") return "CHP | G1P";
    if (v === "G1P | CHP") return "G1P | CHP";
    if (v === "LEAVE") return "Leave";
    return "Not set";
  };
  const workAt = workAtByInterpreter && typeof workAtByInterpreter === "object" ? workAtByInterpreter : {};
  const headerWorkAt = {
    i001: normalizeHeaderWorkAt(workAt.i001),
    i003: normalizeHeaderWorkAt(workAt.i003),
    i004: normalizeHeaderWorkAt(workAt.i004)
  };
  const slotMap = {};
  CALENDAR_SLOT_KEYS.forEach((slot) => {
    slotMap[slot] = { i001: [], i003: [], i004: [] };
  });

  const normalizeHHMM = (t) => String(t || "").slice(0, 5).replace(":", "");
  const incrementBy30 = (hhmm) => {
    let h = parseInt(hhmm.slice(0, 2), 10);
    let m = parseInt(hhmm.slice(2, 4), 10);
    m += 30;
    if (m >= 60) {
      m = 0;
      h += 1;
    }
    return `${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}`;
  };

  list.forEach((e) => {
    const status = String(e.status || "").toUpperCase();
    if (status !== "BOOKED" && status !== "UNAVAILABLE") return;

    const start = normalizeHHMM(e.startTime);
    const end = normalizeHHMM(e.endTime);
    if (!SLOT_INDEX_BY_START.hasOwnProperty(start)) return;

    const col = String(e.interpreterId || "");
    if (!slotMap[CALENDAR_SLOT_KEYS[0]].hasOwnProperty(col)) return;

    // Keep the same slot-fill behavior as calendar.js:
    // fill slot while (timeFrom < timeTo), stepping 30 minutes.
    let cursor = start;
    while (cursor < end) {
      const idx = SLOT_INDEX_BY_START[cursor];
      if (idx === undefined) break;
      const slot = CALENDAR_SLOT_KEYS[idx];
      slotMap[slot][col].push({
        title: e.title || "Not set",
        location: e.location || "Not set",
        user: e.userEmail || "Not set",
        status
      });
      cursor = incrementBy30(cursor);
    }
  });

  const hasAnyData = CALENDAR_SLOT_KEYS.some((slot) =>
    CALENDAR_COLUMNS.some((c) => slotMap[slot][c.id].length > 0)
  );

  const dotHtml = (item) => {
    const statusClass = item.status === "UNAVAILABLE" ? "unavailable" : "booked";
    const tip = escapeHtml(`Title: ${item.title}\nLocation: ${item.location}\nUser: ${item.user}`);
    return `<span class="swal-dot ${statusClass}" title="${tip}"></span>`;
  };

  const bodyHtml = hasAnyData
    ? CALENDAR_SLOT_KEYS.map((slot) => {
      const [start, end] = slot.split("_");
      const format = (t) => `${t.slice(0, 2)}:${t.slice(2)}`;
      const cells = CALENDAR_COLUMNS.map((c) => {
        const items = slotMap[slot][c.id];
        return `<td>${items.map(dotHtml).join("")}</td>`;
      }).join("");
      return `<tr><td class="swal-time-cell">${format(start)} - ${format(end)}</td>${cells}</tr>`;
    }).join("")
    : `<tr><td colspan="4" class="swal-empty">No booking details for this date.</td></tr>`;

  Swal.fire({
    title: `Details for ${safeDate}`,
    width: 980,
    showConfirmButton: false,
    showCloseButton: true,
    customClass: {
      popup: "swal-calendar-popup",
      closeButton: "swal-calendar-x-btn"
    },
    html: `
      <div class="swal-calendar-meta">
        <span class="swal-calendar-legend-item"><span class="swal-dot swal-legend-dot booked"></span>Booked</span>
      </div>
      <div class="swal-calendar-wrap">
        <table class="swal-calendar-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>SOM SAN [${escapeHtml(headerWorkAt.i001)}]</th>
              <th>POOKY SAN [${escapeHtml(headerWorkAt.i003)}]</th>
              <th>L SAN [${escapeHtml(headerWorkAt.i004)}]</th>
            </tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    `
  });
}

function bindCalendarBridge() {
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || !data.type) return;
    if (data.type === "calendar-month-workat") {
      const ym = String(data.yearMonth || "").trim();
      const map = data.workAtByDate && typeof data.workAtByDate === "object" ? data.workAtByDate : {};
      if (/^\d{4}-\d{2}$/.test(ym)) {
        calendarWorkAtCacheByMonth[ym] = map;
      }
      return;
    }
    if (data.type !== "calendar-day-details") return;
    openCalendarDetailsSwal(data.date, data.events, data.workAtByInterpreter);
  });
}

// ================= RENDER =================
function renderMyBookings(list){
  const c = document.getElementById("myBookingList");
  c.innerHTML = "";
if (list.length === 0) {
  const title = viewMode === "monthly" ? "No bookings this month" : "No bookings today";
  const desc = viewMode === "monthly"
    ? "No booking records found for this month."
    : "You have no booking schedule for today.";
  c.innerHTML = `
    <div class="booking-empty">
      <div class="booking-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3.5" y="4.5" width="17" height="16" rx="3" stroke="currentColor" stroke-width="1.6"></rect>
          <path d="M7.5 2.8V6.2M16.5 2.8V6.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>
          <path d="M3.8 9H20.2" stroke="currentColor" stroke-width="1.6"></path>
          <path d="M8 12.2H8.01M12 12.2H12.01M16 12.2H16.01M8 15.6H8.01M12 15.6H12.01M16 15.6H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
        </svg>
      </div>
      <div class="booking-empty-title">${title}</div>
      <div class="booking-empty-desc">${desc}</div>
    </div>
  `;
  return;
}

  list.forEach(b => {
    const badgeClass = b.status === "BOOKED" ? "booked" : "canceled";
    c.innerHTML += `
      <div class="booking-item booking-item-row">
        <div>
          <div class="booking-title">${b.title}</div>
          <div><b>Time:</b> ${formatRange(b.date, b.startTime, addOneMinute(b.endTime))}</div>

          <div><b>Interpreter:</b> ${getInterpreterName(b.interpreterId)}</div>
          <div><b>Location:</b> ${b.location}</div>
          <div><b>Status:</b> <span class="status-badge ${badgeClass}">${b.status}</span></div>
        </div>
        <div class="booking-actions">
          <button class="action-btn edit-btn"
            onclick="openEditBooking('${b.bookingId}')"
            title="Edit booking"
            aria-label="Edit booking">
            <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 20H8L18.1 9.9C18.6 9.4 18.6 8.6 18.1 8.1L15.9 5.9C15.4 5.4 14.6 5.4 14.1 5.9L4 16V20Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13 7L17 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="action-btn cancel-btn-small"
            onclick="cancelBooking('${b.bookingId}')"
            title="Cancel booking"
            aria-label="Cancel booking">
            <svg class="action-btn-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 7H18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M9.5 7V5.8C9.5 5.36 9.86 5 10.3 5H13.7C14.14 5 14.5 5.36 14.5 5.8V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M8 7L8.8 18.2C8.84 18.66 9.22 19 9.68 19H14.32C14.78 19 15.16 18.66 15.2 18.2L16 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M10.5 10.2V15.8M13.5 10.2V15.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>`;
  });
}


function renderAllMyBookings(){
  const tbody=document.querySelector("#myBookingTable tbody");
  tbody.innerHTML="";
  if(!window.allMyBookings||window.allMyBookings.length===0){
    tbody.innerHTML="<tr><td colspan='6'>No bookings</td></tr>";return;
  }
  window.allMyBookings.forEach(b=>{
    const badgeClass=b.status==="BOOKED"?"booked":"canceled";
    tbody.innerHTML+=`
      <tr>
        <td>${b.title||"-"}</td>
        <td>${formatRange(b.date, b.startTime, b.endTime)}</td>
        <td>${getInterpreterName(b.interpreterId)}</td>
        <td>${b.location||""}</td>
        <td><span class="status-badge ${badgeClass}">${b.status}</span></td>
        <td><button class="cancel-btn" onclick="cancelBooking('${b.bookingId}')">Cancel</button></td>
      </tr>`;
  });
}

// ---------------------- 🔹 NAVIGATION DATE CONTROL 🔹 ----------------------
let currentViewDate = new Date();
let myPickerMonth = currentViewDate.getMonth();
let myPickerYear = currentViewDate.getFullYear();

function updateBookingHeader() {
  const h = document.getElementById("myBookingTitle");
  h.textContent = "My Bookings";
  updateMyDateButton();
}

function prevDate() {
  currentViewDate.setDate(currentViewDate.getDate() - 1);
  updateBookingHeader();
  syncMyPickerToCurrentDate();
  loadMyBookingsForDate(currentViewDate);
}

function nextDate() {
  currentViewDate.setDate(currentViewDate.getDate() + 1);
  updateBookingHeader();
  syncMyPickerToCurrentDate();
  loadMyBookingsForDate(currentViewDate);
}

function goToday() {
  currentViewDate = new Date();
  updateBookingHeader();
  syncMyPickerToCurrentDate();
  loadMyBookingsForDate(currentViewDate);
}

function toYmdLocal(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function loadMyBookingsForDate(dateObj){
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user) return;

  try {
    showLoader();
    const res = await fetch(API_URL+"?page=listBookings");
    const bookings = await res.json();
    hideLoader();

    let filtered = [];
    if (viewMode === "monthly") {
      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      filtered = bookings.filter((b) => {
        if (b.userId !== user.id || b.status === "CANCELED") return false;
        const [y, m] = String(b.date || "").split("-").map(Number);
        return y === year && m === month;
      });
    } else {
      const dateStr = toYmdLocal(dateObj);
      filtered = bookings.filter(
        b => b.userId === user.id && b.date === dateStr && b.status !== "CANCELED"
      );
    }

    // เรียงเวลา
    filtered.sort((a,b)=>{
      const [ah,am]=a.startTime.split(":").map(Number);
      const [bh,bm]=b.startTime.split(":").map(Number);
      return ah*60+am - (bh*60+bm);
    });

    renderMyBookings(filtered);
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  }
}

updateBookingHeader(); // ✅ เรียกตอนโหลด

function updateMyDateButton() {
  if (!myDateBtn) return;
  if (viewMode === "monthly") {
    myDateBtn.textContent = "All this month";
    return;
  }
  myDateBtn.textContent = currentViewDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function syncMyPickerToCurrentDate() {
  myPickerMonth = currentViewDate.getMonth();
  myPickerYear = currentViewDate.getFullYear();
  renderMyDatePicker();
}

function toggleMyDatePicker(forceOpen = null) {
  if (!myDatePickerPopover) return;
  const willOpen = forceOpen === null ? !myDatePickerPopover.classList.contains("open") : !!forceOpen;
  myDatePickerPopover.classList.toggle("open", willOpen);
  myDatePickerPopover.setAttribute("aria-hidden", String(!willOpen));
}

function renderMyDatePicker() {
  if (!myDateGrid || !myDatePickerMonthYear) return;
  myDatePickerMonthYear.textContent = new Date(myPickerYear, myPickerMonth, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric"
  });
  myDateGrid.innerHTML = "";

  const firstDay = new Date(myPickerYear, myPickerMonth, 1).getDay();
  const daysInMonth = new Date(myPickerYear, myPickerMonth + 1, 0).getDate();
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("button");
    blank.type = "button";
    blank.className = "my-date-day empty";
    blank.disabled = true;
    myDateGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "my-date-day";
    btn.textContent = String(d);
    if (myPickerYear === todayY && myPickerMonth === todayM && d === todayD) btn.classList.add("today");
    if (
      myPickerYear === currentViewDate.getFullYear() &&
      myPickerMonth === currentViewDate.getMonth() &&
      d === currentViewDate.getDate()
    ) btn.classList.add("active");

    btn.addEventListener("click", () => {
      viewMode = "today";
      currentViewDate = new Date(myPickerYear, myPickerMonth, d);
      updateBookingHeader();
      loadMyBookingsForDate(currentViewDate);
      toggleMyDatePicker(false);
    });
    myDateGrid.appendChild(btn);
  }
}

function bindMyDatePicker() {
  if (myDateBtn) {
    myDateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      renderMyDatePicker();
      toggleMyDatePicker();
    });
  }
  if (myDateMonthPrev) {
    myDateMonthPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      myPickerMonth -= 1;
      if (myPickerMonth < 0) {
        myPickerMonth = 11;
        myPickerYear -= 1;
      }
      renderMyDatePicker();
    });
  }
  if (myDateMonthNext) {
    myDateMonthNext.addEventListener("click", (e) => {
      e.stopPropagation();
      myPickerMonth += 1;
      if (myPickerMonth > 11) {
        myPickerMonth = 0;
        myPickerYear += 1;
      }
      renderMyDatePicker();
    });
  }
  if (myDateAllMonthBtn) {
    myDateAllMonthBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      viewMode = "monthly";
      currentViewDate = new Date(myPickerYear, myPickerMonth, 1);
      updateBookingHeader();
      loadMyBookingsForDate(currentViewDate);
      toggleMyDatePicker(false);
    });
  }
  document.addEventListener("click", (event) => {
    if (myDatePickerWrap && !myDatePickerWrap.contains(event.target)) {
      toggleMyDatePicker(false);
    }
  });
  updateMyDateButton();
  syncMyPickerToCurrentDate();
}

async function openEditBooking(id){
  const data = window.allMyBookings.find(x => x.bookingId === id);
  if(!data) return;

  const modal = document.getElementById("newBookingModal");
  const header = modal.querySelector(".modal-header");
  const title = header.querySelector("h3");
  const f = document.getElementById("bookingForm");

  // ✅ ลบปุ่มเดิมก่อนเพิ่มใหม่
  const oldButtons = document.getElementById("editButtons");
  if (oldButtons) oldButtons.remove();

  // Edit mode style
  modal.classList.add("is-edit");
  title.innerText = "Edit Booking";

  // ✅ ซ่อนปุ่ม Submit ตอนเป็นโหมด Edit
  const submitBtn = f.querySelector("button[type='submit']");
  if (submitBtn) submitBtn.style.display = "none";

  // ✅ ใส่ค่าเดิมในช่อง
  f.setAttribute("data-mode","edit");
  f.setAttribute("data-id", id);
  f.date.value = data.date;
  const dateInput = f.querySelector("#date");
  if (dateInput) dateInput.disabled = false;
  await updateNewBookingInterpreterByDate(data.date, data.interpreterId);
  f.timeFrom.value = data.startTime;
  f.timeTo.value = data.endTime;
  f.title.value = data.title;
  setLocationValueForForm(f, data.location);

  // ✅ เพิ่มเฉพาะปุ่ม Save Edit เท่านั้น
  const div = document.createElement("div");
  div.id = "editButtons";
  div.className = "edit-actions";
  div.innerHTML = `
    <button id="saveEditBtn" class="save-edit-btn">
      Save Edit
    </button>
  `;
  f.appendChild(div);

  document.getElementById("saveEditBtn").onclick = () => saveEditBooking(id);

  modal.style.display = "block";
}

// ✅ ล้าง email ไม่ให้มี ' หรือช่องว่าง
function sanitizeEmail(email) {
  if (!email) return "";
  return String(email).replace(/^'/, "").replace(/'$/, "").trim();
}

// ---------------------- 🔹 SAVE EDIT (Final Clean Version) 🔹 ----------------------
async function saveEditBooking(bookingId){
  const f = document.getElementById("bookingForm");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if(!user) return;

  const saveBtn = document.getElementById("saveEditBtn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.style.background = "#999";
    saveBtn.style.cursor = "not-allowed";
    saveBtn.innerText = "Saving...";
  }

  // ✅ ตรวจสอบค่าว่าง
  const dateVal = f.date.value;
  const interpreterVal = f.interpreterId.value;
  const startVal = f.timeFrom.value;
  const endVal = f.timeTo.value;
  const titleVal = f.title.value.trim();
  const locationVal = getResolvedLocationValue(f);

  if(!dateVal || !interpreterVal || !startVal || !endVal || !titleVal || !locationVal){
    Swal.fire("⚠️ Warning","Please fill in all required fields.","warning");
    resetSaveButton();
    return;
  }

  const okFactory = await validateInterpreterFactoryBeforeSubmit(dateVal, interpreterVal, locationVal, startVal);
  if (!okFactory) {
    resetSaveButton();
    return;
  }

  // ✅ ตรวจสอบเวลาเริ่ม < เวลาสิ้นสุด
  const startMins = parseInt(startVal.split(":")[0]) * 60 + parseInt(startVal.split(":")[1]);
  const endMins   = parseInt(endVal.split(":")[0]) * 60 + parseInt(endVal.split(":")[1]);
  if (startMins >= endMins) {
    Swal.fire("⚠️ Warning", "Start time must be less than end time", "warning");
    resetSaveButton();
    return;
  }

  // ✅ เตรียมข้อมูลส่งแก้ไข
  const form = new URLSearchParams();
  form.append("page","editBooking");
  form.append("bookingId", bookingId);
  form.append("userId", user.id);
  form.append("userEmail", sanitizeEmail(user.email));
  form.append("interpreterId", interpreterVal);
  form.append("interpreterEmail", sanitizeEmail(getInterpreterEmail(interpreterVal)));
  form.append("date", dateVal);
  form.append("startTime", startVal);
  form.append("endTime", endVal);
  form.append("title", titleVal);
  form.append("location", locationVal);

  try {
    showLoader();
    const res = await fetch(API_URL, { method:"POST", body:form });
    const data = await res.json();
    hideLoader();

    if(data.success){
      dashboardNeedsRefresh = true;
      Swal.fire("Updated","Booking updated successfully!","success").then(()=>{
        closeNewBookingModal();
        loadMyBookings();
        const iframe=document.getElementById("calendarFrame");
        if(iframe) iframe.src="calendar.html";
      });
    } else if (data.message && data.message.includes("Duplicate")) {
      Swal.fire({
        title: "Duplicate Booking",
        text: data.message,
        icon: "warning",
        didOpen: () => { document.querySelector('.swal2-container').style.zIndex = 30000; }
      });
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch(err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  } finally {
    resetSaveButton();
  }

  function resetSaveButton(){
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.background = "#ff9800";
      saveBtn.style.cursor = "pointer";
      saveBtn.innerText = "Save Edit";
    }
  }
}


// ---------------------- 🔹 SUBMIT NEW BOOKING (FINAL VERSION) 🔹 ----------------------
document.getElementById("bookingForm").addEventListener("submit", async function(e){ 
  e.preventDefault();
  const mode = this.getAttribute("data-mode");
  if(mode === "edit") return;

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const submitBtn = this.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.style.background = "#999";   // ✅ เปลี่ยนเป็นเทา
  submitBtn.style.cursor = "not-allowed";
  submitBtn.innerText = "Submitting...";

  const startVal = this.timeFrom.value;
  const endVal   = this.timeTo.value;
  const dateVal = this.date.value;
  const interpreterVal = this.interpreterId.value;
  const locationVal = getResolvedLocationValue(this);

  // ✅ ตรวจสอบเวลา
  if (!startVal || !endVal){
    Swal.fire("Warning","Please select time range","warning");
    submitBtn.disabled=false;
    submitBtn.style.background="#28a745";
    submitBtn.style.cursor="pointer";
    submitBtn.innerText="Submit";
    return;
  }
  const startMins = parseInt(startVal.split(":")[0])*60+parseInt(startVal.split(":")[1]);
  const endMins = parseInt(endVal.split(":")[0])*60+parseInt(endVal.split(":")[1]);
  if(startMins>=endMins){
    Swal.fire("Warning","Start time must be less than end time","warning");
    submitBtn.disabled=false;
    submitBtn.style.background="#28a745";
    submitBtn.style.cursor="pointer";
    submitBtn.innerText="Submit";
    return;
  }

  const okFactory = await validateInterpreterFactoryBeforeSubmit(dateVal, interpreterVal, locationVal, startVal);
  if (!okFactory) {
    submitBtn.disabled=false;
    submitBtn.style.background="#28a745";
    submitBtn.style.cursor="pointer";
    submitBtn.innerText="Submit";
    return;
  }

  // ✅ เตรียมข้อมูลส่งไป backend
  const form = new URLSearchParams();
  form.append("page","newBooking");
  form.append("userId", user.id);
  form.append("userEmail", user.email);
  form.append("interpreterId", interpreterVal);
  form.append("interpreterEmail", getInterpreterEmail(interpreterVal));
  form.append("date", dateVal);
  form.append("startTime", startVal);
  form.append("endTime", endVal);
  form.append("title", this.title.value);
  form.append("location", locationVal);
  form.append("status", "BOOKED");
  form.append("createdAt", new Date().toISOString());

  try {
    showLoader();
    const res = await fetch(API_URL, { method:"POST", body:form });
    const data = await res.json();
    hideLoader();

    // ✅ ตรวจสอบผลลัพธ์จาก backend
    if (data.success){
      dashboardNeedsRefresh = true;
      // ✅ คืนค่าปุ่มกลับก่อนปิด modal
      submitBtn.disabled = false;
      submitBtn.style.background = "#28a745";
      submitBtn.style.cursor = "pointer";
      submitBtn.innerText = "Submit";

      closeNewBookingModal();
      this.reset();
      Swal.fire("Success", data.message,"success").then(()=>{
        loadMyBookings();
        const iframe=document.getElementById("calendarFrame");
        if(iframe) iframe.src="calendar.html";
      });

    } else if (data.message && data.message.includes("Duplicate")) {
      // ⚠️ กรณี Booking ซ้ำ
      Swal.fire({
        title: "Duplicate Booking",
        text: data.message,
        icon: "warning",
        didOpen: () => { document.querySelector('.swal2-container').style.zIndex = 30000; }
      });

    } else {
      // ❌ กรณี Error อื่น ๆ
      Swal.fire("Error", data.message,"error");
    }

  } catch(err) {
    hideLoader();
    Swal.fire("Error", err.message,"error");

  } finally {
    // ✅ คืนปุ่มกลับสู่สถานะปกติ (กันกรณี error หรือ modal ปิดก่อน)
    submitBtn.disabled = false;
    submitBtn.style.background = "#28a745";
    submitBtn.style.cursor = "pointer";
    submitBtn.innerText = "Submit";
  }
});

const newBookingDateInput = document.getElementById("date");
if (newBookingDateInput) {
  newBookingDateInput.addEventListener("change", async (e) => {
    const form = document.getElementById("bookingForm");
    if (!form) return;
    const mode = form.getAttribute("data-mode") || "new";
    if (mode !== "new") return;
    await updateNewBookingInterpreterByDate(e.target.value || "");
  });
}
const locationSelect = document.getElementById("location");
if (locationSelect) {
  locationSelect.addEventListener("change", () => {
    const form = document.getElementById("bookingForm");
    toggleLocationSpecifyInput(form);
  });
}

function addOneMinute(timeStr) {
  const [h,m] = timeStr.split(":").map(Number);
  let total = h * 60 + m + 1;
  const hh = String(Math.floor(total / 60)).padStart(2,"0");
  const mm = String(total % 60).padStart(2,"0");
  return `${hh}:${mm}`;
}

// ---------------------- 🔹 CANCEL BOOKING 🔹 ----------------------
async function cancelBooking(bookingId) {
  const confirmResult = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to cancel this booking?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, cancel it",
    cancelButtonText: "No, keep it"
  });
  if (!confirmResult.isConfirmed) return;

  const form = new URLSearchParams();
  form.append("page", "cancelBooking");
  form.append("bookingId", bookingId);

  try {
    showLoader();
    const res = await fetch(API_URL, { method: "POST", body: form });
    const data = await res.json();
    hideLoader();

    if (data.success) {
      dashboardNeedsRefresh = true;
      Swal.fire("Canceled", data.message, "success").then(() => {
        loadMyBookings();
        renderAllMyBookings();
        const iframe = document.getElementById("calendarFrame");
        if (iframe) iframe.src = "calendar.html";
        document.getElementById("myModal").style.display = "none";
        closeNewBookingModal();
      });
    } else {
      Swal.fire("Error", data.message, "error");
    }
  } catch (err) {
    hideLoader();
    Swal.fire("Error", err.message, "error");
  }
}

bindCalendarBridge();
renderHeaderUserInfo();
bindUserMenu();
bindWorkspaceSidebar();
bindMyDatePicker();
switchWorkspaceView("dashboard");
console.log("✅ Booking System Loaded:", new Date().toLocaleString());






