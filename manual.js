function openManualDialog() {
  const manualLang = {
    th: {
      title: "คู่มือการใช้งานระบบ",
      note: "หมายเหตุ: คู่มือนี้อ้างอิงหน้าจอ Dashboard เวอร์ชันปัจจุบัน",
      pages: [
        {
          key: "dashboard",
          heading: "Dashboard",
          image: "images/dashboard-shot.jpg",
          items: [
            ["1) Header: Manual และเมนูผู้ใช้", "ปุ่ม Manual ใช้เปิดคู่มือนี้ และเมนูชื่อผู้ใช้ใช้สำหรับ Change Password และ Logout"],
            ["2) แถบนำทางด้านซ้าย (Sidebar)", "ไอคอนบนใช้เข้า Dashboard และไอคอนล่างใช้เข้า My Bookings"],
            ["3) Summary Cards", "แสดงจำนวนงานรวมของเดือน, จำนวนงานวันนี้ และจำนวนล่ามที่ active"],
            ["4) Today's Interpreter Jobs", "แสดงข้อมูลล่ามแต่ละคน ได้แก่ชื่อ, Job Total และ Work at (CHP/G1P/Leave/Not set)"],
            ["5) กราฟ Bookings per Day", "ดูแนวโน้มจำนวน booking รายวันของแต่ละล่ามในเดือนที่เลือก"],
            ["6) กราฟ Summary Bookings by Interpreter", "สรุปจำนวนงานรวมรายล่ามในเดือนเดียวกันแบบกราฟแท่ง"]
          ]
        },
        {
          key: "new-booking",
          heading: "New Booking",
          image: "images/Booking-shot.jpg",
          items: [
            ["1) สร้างรายการจอง (New Booking)", "กดปุ่ม + เพื่อสร้างรายการจอง, ต้องเลือกวันที่ก่อน จึงสามารถเลือก Interpreter, Time, Title และ Location ได้"],
            ["2) ระบุข้อมูลจองล่าม", "ต้องเลือกวันที่ก่อน จึงสามารถเลือก Interpreter, Time, Title และ Location ได้<br>หมายเหตุ:<br>1. ระบบตรวจเวลาเริ่ม/สิ้นสุด และตรวจเงื่อนไข Work at เทียบกับโรงงาน<br>2. ในช่อง Location ,รายการ Specify... สามารถกรอกสถานที่เองได้"]
          ]
        },
        {
          key: "edit-delete-booking",
          heading: "Edit / Delete Booking",
          image: "images/EditDelete-shot.jpg",
          items: [
            ["1) แก้ไขรายการจอง (Edit)", "ใน My Bookings กดไอคอนแก้ไขเพื่อปรับ Interpreter, Time, Title หรือ Location แล้วกดบันทึก"],
            ["2) ยกเลิกรายการจอง (Delete)", "ใน My Bookings กดไอคอนลบเพื่อยกเลิกรายการ ระบบจะให้ยืนยันก่อนบันทึกสถานะเป็น CANCELED"]
          ]
        },
        {
          key: "calendar",
          heading: "View Calendar",
          image: "images/Calendar-shot.jpg",
          items: [
            ["1) ดูรายละเอียดรายวัน", "คลิกวันที่ใน Calendar เพื่อเปิดตาราง Details ของวันนั้น"],
            ["2) สถานะในหัวคอลัมน์", "หัวคอลัมน์จะแสดง [CHP], [G1P], [Leave] หรือ [Not set] ของแต่ละล่าม"],
            ["3) Tooltip", "เมื่อชี้จุดสีฟ้าที่มีงาน จะแสดงชื่อประชุม สถานที่ประชุม และคนที่จอง ของล่ามคนนั้นในวันนั้น"]
          ]
        }
      ]
    },
    en: {
      title: "System User Manual",
      note: "Note: This manual is based on the current Dashboard screen.",
      pages: [
        {
          key: "dashboard",
          heading: "Dashboard",
          image: "images/dashboard-shot.jpg",
          items: [
            ["1) Header: Manual and User Menu", "Use Manual to open this guide. User menu provides Change Password and Logout."],
            ["2) Left Sidebar Navigation", "Top icon opens Dashboard. Bottom icon opens My Bookings."],
            ["3) Summary Cards", "Shows total bookings this month, bookings today, and active interpreter count."],
            ["4) Today's Interpreter Jobs", "Displays each interpreter's name, Job Total, and Work at (CHP/G1P/Leave/Not set)."],
            ["5) Bookings per Day Chart", "Shows daily booking trend by interpreter for the selected month."],
            ["6) Summary Bookings by Interpreter", "Bar chart summary of monthly booking totals per interpreter."]
          ]
        },
        {
          key: "new-booking",
          heading: "New Booking",
          image: "images/Booking-shot.jpg",
          items: [
            ["1) Create Booking (New Booking)", "Click + to create a new booking, select date first, then fill Interpreter, Time, Title, and Location."],
            ["2) Enter Interpreter Booking Details", "You must select the date first before you can choose Interpreter, Time, Title, and Location.<br>Note:<br>1. The system validates start/end time and checks Work at conditions against factory location.<br>2. In the Location field, the Specify... option allows custom location input."]
          ]
        },
        {
          key: "edit-delete-booking",
          heading: "Edit / Delete Booking",
          image: "images/EditDelete-shot.jpg",
          items: [
            ["1) Edit Booking", "In My Bookings, click the Edit icon to update Interpreter, Time, Title, or Location, then save changes."],
            ["2) Delete Booking", "In My Bookings, click the Delete icon to cancel the booking. The system asks for confirmation and updates status to CANCELED."]
          ]
        },
        {
          key: "calendar",
          heading: "View Calendar",
          image: "images/Calendar-shot.jpg",
          items: [
            ["1) Daily detail", "Click a date in Calendar to open daily detail table."],
            ["2) Column header status", "Column headers show [CHP], [G1P], [Leave], or [Not set] for each interpreter."],
            ["3) Tooltip", "Hover over the blue booked dot to view meeting title, meeting location, and booking requester for that interpreter on that day."]
          ]
        }
      ]
    },
    jp: {
      title: "システム利用マニュアル",
      note: "注: このマニュアルは現在のDashboard画面を基準にしています。",
      pages: [
        {
          key: "dashboard",
          heading: "Dashboard",
          image: "images/dashboard-shot.jpg",
          items: [
            ["1) ヘッダー: Manual とユーザーメニュー", "Manualボタンでこのガイドを開きます。ユーザーメニューではChange PasswordとLogoutができます。"],
            ["2) 左サイドバー", "上のアイコンはDashboard、下のアイコンはMy Bookingsを開きます。"],
            ["3) Summary Cards", "今月の予約件数、本日の予約件数、稼働中通訳者数を表示します。"],
            ["4) Today's Interpreter Jobs", "各通訳者の名前、Job Total、Work at（CHP/G1P/Leave/Not set）を表示します。"],
            ["5) Bookings per Day グラフ", "選択月の日別予約推移を表示します。"],
            ["6) Summary Bookings by Interpreter", "通訳者ごとの月間予約件数を棒グラフで表示します。"]
          ]
        },
        {
          key: "new-booking",
          heading: "New Booking",
          image: "images/Booking-shot.jpg",
          items: [
            ["1) 新規予約 (New Booking)", "＋ボタンを押して予約を作成し、先に日付を選択してから Interpreter、Time、Title、Location を入力します。"],
            ["2) 通訳予約情報の入力", "先に日付を選択してから、Interpreter、Time、Title、Location を選択・入力できます。<br>注:<br>1. システムは開始/終了時刻を検証し、Work at 条件を工場ロケーションと照合します。<br>2. Location 欄の Specify... を選ぶと、場所を自由入力できます。"]
          ]
        },
        {
          key: "edit-delete-booking",
          heading: "Edit / Delete Booking",
          image: "images/EditDelete-shot.jpg",
          items: [
            ["1) 予約の編集 (Edit)", "My Bookings で Edit アイコンを押すと、Interpreter・Time・Title・Location を更新して保存できます。"],
            ["2) 予約の削除 (Delete)", "My Bookings で Delete アイコンを押すと予約をキャンセルできます。確認後、ステータスは CANCELED に更新されます。"]
          ]
        },
        {
          key: "calendar",
          heading: "View Calendar",
          image: "images/Calendar-shot.jpg",
          items: [
            ["1) 日別詳細", "Calendarの日付をクリックすると日別詳細テーブルを表示します。"],
            ["2) ヘッダー状態", "各通訳者ヘッダーに [CHP]/[G1P]/[Leave]/[Not set] を表示します。"],
            ["3) Tooltip", "青い予約ドットにホバーすると、その通訳者の当日の会議名・会議場所・予約者を表示します。"]
          ]
        }
      ]
    }
  };

  const state = { lang: "th", pageIndex: 0 };

  const renderPagePanel = (langKey, pageIndex, directionClass = "slide-in-right") => {
    const langData = manualLang[langKey] || manualLang.th;
    const pages = Array.isArray(langData.pages) ? langData.pages : [];
    const safeIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
    const page = pages[safeIndex] || pages[0];
    const itemsHtml = (page.items || []).map(([h, p]) => `<h4>${h}</h4><p>${p}</p>`).join("");

    return `
      <div class="manual-panel ${directionClass}">
        <div class="manual-layout">
          <div class="manual-left-pane">
            <div class="manual-left-page-title">${page.heading}</div>
            <img src="${page.image}" class="manual-hero-img" alt="${page.heading}">
          </div>
          <div class="manual-right-pane">
            <div class="manual-section">
              ${itemsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderManualBody = (directionClass = "slide-in-right") => {
    const langData = manualLang[state.lang] || manualLang.th;
    const maxPage = (langData.pages || []).length - 1;
    const prevDisabled = state.pageIndex <= 0 ? "disabled" : "";
    const nextDisabled = state.pageIndex >= maxPage ? "disabled" : "";

    return `
      <div class="manual-topbar">
        <div class="manual-topbar-left">
          <div class="manual-topbar-title">${langData.title}</div>
          <div class="manual-topbar-note">${langData.note}</div>
        </div>
        <div class="manual-topbar-right">
          <div class="manual-lang-switch">
            <button type="button" class="manual-lang-btn ${state.lang === "th" ? "active" : ""}" data-lang="th" title="Thai" aria-label="Thai"><span class="manual-flag manual-flag-th" aria-hidden="true"></span></button>
            <button type="button" class="manual-lang-btn ${state.lang === "en" ? "active" : ""}" data-lang="en" title="English" aria-label="English"><span class="manual-flag manual-flag-gb" aria-hidden="true"></span></button>
            <button type="button" class="manual-lang-btn ${state.lang === "jp" ? "active" : ""}" data-lang="jp" title="Japanese" aria-label="Japanese"><span class="manual-flag manual-flag-jp" aria-hidden="true"></span></button>
          </div>
          <button type="button" class="manual-close-x" id="manualCloseBtn" aria-label="Close">&times;</button>
        </div>
      </div>
      <div class="manual-carousel">
        <button type="button" class="manual-nav-edge manual-nav-left" id="manualPrevBtn" ${prevDisabled} aria-label="Previous">&#10094;</button>
        <div id="manualPanelWrap">${renderPagePanel(state.lang, state.pageIndex, directionClass)}</div>
        <button type="button" class="manual-nav-edge manual-nav-right" id="manualNextBtn" ${nextDisabled} aria-label="Next">&#10095;</button>
      </div>
    `;
  };

  Swal.fire({
    title: "",
    width: 1240,
    showConfirmButton: false,
    showCloseButton: false,
    customClass: {
      popup: "swal-manual-popup",
      htmlContainer: "swal-manual-content"
    },
    html: `<div id="manualBody">${renderManualBody("slide-in-right")}</div>`,
    didOpen: () => {
      const bindEvents = () => {
        const body = document.getElementById("manualBody");
        if (!body) return;

        const closeBtn = body.querySelector("#manualCloseBtn");
        const prevBtn = body.querySelector("#manualPrevBtn");
        const nextBtn = body.querySelector("#manualNextBtn");

        const rerenderBody = (directionClass) => {
          body.innerHTML = renderManualBody(directionClass || "slide-in-right");
          bindEvents();
        };

        if (closeBtn) closeBtn.addEventListener("click", () => Swal.close());

        if (prevBtn) {
          prevBtn.addEventListener("click", () => {
            if (state.pageIndex <= 0) return;
            state.pageIndex = Math.max(0, state.pageIndex - 1);
            rerenderBody("slide-in-left");
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener("click", () => {
            const langData = manualLang[state.lang] || manualLang.th;
            const maxPage = (langData.pages || []).length - 1;
            if (state.pageIndex >= maxPage) return;
            state.pageIndex = Math.min(maxPage, state.pageIndex + 1);
            rerenderBody("slide-in-right");
          });
        }

        body.querySelectorAll(".manual-lang-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const lang = String(btn.getAttribute("data-lang") || "th");
            const prevIndex = state.pageIndex;
            state.lang = manualLang[lang] ? lang : "th";
            const pages = (manualLang[state.lang] && Array.isArray(manualLang[state.lang].pages))
              ? manualLang[state.lang].pages
              : [];
            state.pageIndex = Math.max(0, Math.min(prevIndex, Math.max(0, pages.length - 1)));
            rerenderBody("slide-in-right");
          });
        });
      };

      bindEvents();
    }
  });
}

function bindManualButton() {
  const manualBtn = document.getElementById("manualBtn");
  if (!manualBtn) return;

  manualBtn.addEventListener("click", () => {
    if (typeof toggleUserMenu === "function") toggleUserMenu(false);
    openManualDialog();
  });
}

bindManualButton();


