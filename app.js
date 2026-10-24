
const COMPANY_KEY = "hcm_company";
const USERS_KEY = "hcm_users";
const SESSION_KEY = "hcm_session";
const ATTENDANCE_KEY = "hcm_attendance";
const LEAVES_KEY = "hcm_leaves";

const setupForm = document.getElementById("setup-form");
const loginForm = document.getElementById("login-form");
const messageBox = document.getElementById("message");

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function showMessage(message, type = "error") {
  messageBox.textContent = message;
  messageBox.className = "message " + type;
  messageBox.hidden = false;
}

function clearMessage() {
  messageBox.hidden = true;
  messageBox.textContent = "";
}

function showSetup() {
  document.getElementById("form-title").textContent =
    "Set up your company";
  document.getElementById("form-description").textContent =
    "Create your company and your first Admin account.";

  setupForm.hidden = false;
  loginForm.hidden = true;
  clearMessage();
}

function showLogin() {
  document.getElementById("form-title").textContent = "Welcome back";
  document.getElementById("form-description").textContent =
    "Sign in to continue to your workspace.";

  setupForm.hidden = true;
  loginForm.hidden = false;
  clearMessage();
}

function makeId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// First-time company and Admin setup
setupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  clearMessage();

  const companyName = document.getElementById("company-name").value.trim();
  const name = document.getElementById("setup-name").value.trim();
  const email = document.getElementById("setup-email").value.trim().toLowerCase();
  const password = document.getElementById("setup-password").value;

  if (!companyName || !name || !email || !password) {
    showMessage("Bhai, saari fields fill karo.");
    return;
  }

  if (password.length < 6) {
    showMessage("Password kam az kam 6 characters ka hona chahiye.");
    return;
  }

  if (!document.getElementById("setup-email").checkValidity()) {
    showMessage("Valid email address enter karo.");
    return;
  }

  if (localStorage.getItem(COMPANY_KEY)) {
    showMessage("Company pehle se setup hai. Login karo.");
    showLogin();
    return;
  }

  const company = {
    name: companyName,
    officeStart: "09:00",
    graceMinutes: 15,
    leaveQuota: 12,
    workingDays: [1, 2, 3, 4, 5]
  };

  const admin = {
    id: makeId(),
    name,
    email,
    password,
    role: "admin",
    department: "Administration",
    salary: 0
  };

  try {
    saveData(COMPANY_KEY, company);
    saveData(USERS_KEY, [admin]);
    saveData(ATTENDANCE_KEY, []);
    saveData(LEAVES_KEY, []);
    saveData(SESSION_KEY, { userId: admin.id });

    renderDashboard(admin);
  } catch {
    showMessage("Data save nahi ho saka. Browser storage check karo.");
  }
});

// Login
loginForm.addEventListener("submit", function (event) {
  event.preventDefault();
  clearMessage();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;

  const users = readData(USERS_KEY, []);
  const user = users.find(item =>
    item.email.toLowerCase() === email && item.password === password
  );

  if (!user) {
    showMessage("Email ya password ghalat hai.");
    return;
  }

  try {
    saveData(SESSION_KEY, { userId: user.id });
    renderDashboard(user);
  } catch {
    showMessage("Login session save nahi ho saka.");
  }
});

// Show/hide password
document.getElementById("toggle-password").addEventListener("click", function () {
  const passwordInput = document.getElementById("login-password");
  const isHidden = passwordInput.type === "password";

  passwordInput.type = isHidden ? "text" : "password";
  this.textContent = isHidden ? "Hide" : "Show";
});

// Main dashboard
function renderDashboard(user) {
  const company = readData(COMPANY_KEY, { name: "HCM Lite" });
  const users = readData(USERS_KEY, []);
  const attendance = readData(ATTENDANCE_KEY, []);
  const leaves = readData(LEAVES_KEY, []);

  const isAdmin = user.role === "admin";
  const today = getToday();

  const todaysRecords = attendance.filter(record => record.date === today);
  const todaysLeaves = leaves.filter(leave =>
    leave.status === "Approved" &&
    leave.from <= today &&
    leave.to >= today
  );

  const ownToday = attendance.find(record =>
    record.userId === user.id && record.date === today
  );

  const main = document.querySelector(".main-container");

  main.innerHTML = `
    <section class="dashboard">
      <header class="dash-header">
        <div>
          <span class="eyebrow">${isAdmin ? "ADMIN WORKSPACE" : "EMPLOYEE WORKSPACE"}</span>
          <h1>Good day, ${escapeHTML(user.name.split(" ")[0])} 👋</h1>
          <p>${escapeHTML(company.name)} · ${today}</p>
        </div>
        <button class="logout-button" id="logout-button">Log out ↗</button>
      </header>

      <div class="dash-welcome">
        <div>
          <span class="dash-small">YOUR WORKSPACE</span>
          <h2>${isAdmin ? "People are your greatest asset." : "Ready for a productive day?"}</h2>
          <p>${isAdmin
            ? "Manage your team, review attendance and keep HR work organized."
            : "Track your workday, check your attendance and submit leave requests."}</p>
        </div>
        <div class="welcome-art">H<span>+</span></div>
      </div>

      <div class="stat-grid">
        ${isAdmin ? `
          <article class="stat-card">
            <span class="stat-symbol blue-symbol">♙</span>
            <p>Total employees</p><h3>${users.filter(item => item.role === "employee").length}</h3>
            <small>Registered team members</small>
          </article>
          <article class="stat-card">
            <span class="stat-symbol green-symbol">✓</span>
            <p>Checked in today</p><h3>${new Set(todaysRecords.map(item => item.userId)).size}</h3>
            <small>Employees with attendance</small>
          </article>
          <article class="stat-card">
            <span class="stat-symbol orange-symbol">◷</span>
            <p>Pending leaves</p><h3>${leaves.filter(item => item.status === "Pending").length}</h3>
            <small>Requests awaiting review</small>
          </article>
        ` : `
          <article class="stat-card">
            <span class="stat-symbol blue-symbol">◷</span>
            <p>Today's check-in</p><h3>${ownToday?.checkIn || "--:--"}</h3>
            <small>${ownToday ? ownToday.status : "Not checked in yet"}</small>
          </article>
          <article class="stat-card">
            <span class="stat-symbol green-symbol">✓</span>
            <p>Check-out</p><h3>${ownToday?.checkOut || "--:--"}</h3>
            <small>${ownToday?.checkOut ? "Workday completed" : "Not checked out yet"}</small>
          </article>
          <article class="stat-card">
            <span class="stat-symbol orange-symbol">▤</span>
            <p>Leave balance</p><h3>${getLeaveBalance(user.id)}</h3>
            <small>Working days remaining</small>
          </article>
        `}
      </div>

      <div class="content-grid">
        <section class="dash-panel">
          <div class="panel-heading">
            <div><h2>${isAdmin ? "Quick actions" : "My attendance"}</h2>
            <p>${isAdmin ? "Manage your workplace" : "Your daily check-in and check-out"}</p></div>
          </div>
          ${isAdmin ? `
            <form id="employee-form" class="employee-form">
              <h3>Add an employee</h3>
              <div class="form-grid">
                <div><label for="emp-name">Full name</label><input id="emp-name" required maxlength="80" placeholder="Employee name"></div>
                <div><label for="emp-email">Email</label><input id="emp-email" type="email" required placeholder="employee@email.com"></div>
                <div><label for="emp-password">Temporary password</label><input id="emp-password" type="password" minlength="6" required placeholder="At least 6 characters"></div>
                <div><label for="emp-department">Department</label><input id="emp-department" required maxlength="60" placeholder="e.g. IT"></div>
                <div><label for="emp-salary">Monthly salary</label><input id="emp-salary" type="number" min="1" step="0.01" required placeholder="e.g. 35000"></div>
              </div>
              <button class="primary-button" type="submit">Create employee login +</button>
              <div id="employee-message" class="message" hidden></div>
            </form>

            <div class="panel-heading employee-list-heading">
              <div><h2>Employee directory</h2><p>Employee accounts saved in this browser</p></div>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Department</th><th>Email</th></tr></thead>
                <tbody>
                  ${users.filter(item => item.role === "employee").map(item => `
                    <tr>
                      <td>${escapeHTML(item.name)}</td>
                      <td>${escapeHTML(item.department)}</td>
                      <td>${escapeHTML(item.email)}</td>
                    </tr>`).join("") || `<tr><td colspan="3">No employees yet. Add your first employee above.</td></tr>`}
                </tbody>
              </table>
            </div>

            <div class="panel-heading employee-list-heading">
              <div><h2>Leave requests</h2><p>Review employee applications</p></div>
            </div>
            ${renderAdminLeaves(leaves, users)}
          ` : `
            <div class="attendance-actions">
              <p>Check in when your workday starts. Check out when you finish.</p>
              <div class="attendance-times">
                <div><span>Check-in</span><strong>${ownToday?.checkIn || "--:--"}</strong></div>
                <div><span>Check-out</span><strong>${ownToday?.checkOut || "--:--"}</strong></div>
              </div>
              <div class="action-buttons">
                <button id="check-in-button" class="primary-button" ${ownToday?.checkIn ? "disabled" : ""}>Check in</button>
                <button id="check-out-button" class="secondary-button" ${!ownToday?.checkIn || ownToday?.checkOut ? "disabled" : ""}>Check out</button>
              </div>
              <div id="attendance-message" class="message" hidden></div>
            </div>

            <form id="leave-form" class="employee-form">
              <h3>Apply for leave</h3>
              <label for="leave-type">Leave type</label>
              <select id="leave-type" required><option value="Casual">Casual</option><option value="Sick">Sick</option></select>
              <div class="form-grid">
                <div><label for="leave-from">From</label><input type="date" id="leave-from" required></div>
                <div><label for="leave-to">To</label><input type="date" id="leave-to" required></div>
              </div>
              <label for="leave-reason">Reason</label>
              <textarea id="leave-reason" rows="3" maxlength="300" required placeholder="Briefly explain your request"></textarea>
              <button class="primary-button" type="submit">Submit leave request</button>
              <div id="leave-message" class="message" hidden></div>
            </form>
            <div class="panel-heading employee-list-heading"><div><h2>My leave requests</h2></div></div>
            ${renderOwnLeaves(leaves, user.id)}
          `}
        </section>

        <aside class="dash-panel helper-panel">
          <div class="panel-heading">
            <div><h2>Smart helper ✦</h2><p>Ask about your HR data</p></div>
          </div>
          <div class="helper-intro">Hello ${escapeHTML(user.name.split(" ")[0])}! Ask me about ${isAdmin ? "your employees, attendance or pending leaves." : "your attendance or remaining leave balance."}</div>
          <div id="chat-messages" class="chat-messages" aria-live="polite">
            <div class="chat-bubble bot-bubble">Hi! I'm your HCM helper. What would you like to know?</div>
          </div>
          <form id="helper-form" class="helper-form">
            <input id="helper-input" aria-label="Ask the HR helper" placeholder="Ask a question..." required maxlength="250">
            <button type="submit" aria-label="Send question">➤</button>
          </form>
          <p class="helper-disclaimer">Answers use the saved data in this browser.</p>
        </aside>
      </div>
      <footer class="dash-footer">HCM Lite · ${escapeHTML(company.name)} · Beginner Track</footer>
    </section>
  `;

  document.getElementById("logout-button").addEventListener("click", logout);

  if (isAdmin) {
    document.getElementById("employee-form").addEventListener("submit", addEmployee);
    document.querySelectorAll("[data-leave-action]").forEach(button => {
      button.addEventListener("click", () => updateLeave(button.dataset.id, button.dataset.leaveAction));
    });
  } else {
    document.getElementById("check-in-button").addEventListener("click", () => checkIn(user));
    document.getElementById("check-out-button").addEventListener("click", () => checkOut(user));
    document.getElementById("leave-form").addEventListener("submit", event => applyLeave(event, user));
  }

  document.getElementById("helper-form").addEventListener("submit", event => {
    event.preventDefault();
    askHelper(user);
  });
}

// Create an Employee login
function addEmployee(event) {
  event.preventDefault();

  const name = document.getElementById("emp-name").value.trim();
  const email = document.getElementById("emp-email").value.trim().toLowerCase();
  const password = document.getElementById("emp-password").value;
  const department = document.getElementById("emp-department").value.trim();
  const salary = Number(document.getElementById("emp-salary").value);
  const users = readData(USERS_KEY, []);

  if (!name || !email || !department || !password) {
    return employeeMessage("Saari fields fill karo.", "error");
  }

  if (!document.getElementById("emp-email").checkValidity()) {
    return employeeMessage("Valid email enter karo.", "error");
  }

  if (password.length < 6) {
    return employeeMessage("Password kam az kam 6 characters ka hona chahiye.", "error");
  }

  if (users.some(item => item.email.toLowerCase() === email)) {
    return employeeMessage("Ye email pehle se registered hai.", "error");
  }

  if (!Number.isFinite(salary) || salary <= 0) {
    return employeeMessage("Salary zero se zyada honi chahiye.", "error");
  }

  users.push({
    id: makeId(),
    name,
    email,
    password,
    role: "employee",
    department,
    salary
  });

  try {
    saveData(USERS_KEY, users);
    const session = readData(SESSION_KEY, null);
    const admin = users.find(item => item.id === session?.userId);

    renderDashboard(admin);
  } catch {
    employeeMessage("Employee save nahi ho saka.", "error");
  }
}

function employeeMessage(message, type) {
  const box = document.getElementById("employee-message");
  box.textContent = message;
  box.className = "message " + type;
  box.hidden = false;
}

// Attendance
function checkIn(user) {
  const attendance = readData(ATTENDANCE_KEY, []);
  const today = getToday();

  if (attendance.some(item => item.userId === user.id && item.date === today)) {
    return;
  }

  const company = readData(COMPANY_KEY, {});
  const checkInTime = getTime();
  const [startHour, startMinute] = (company.officeStart || "09:00").split(":").map(Number);
  const allowedMinutes = startHour * 60 + startMinute + Number(company.graceMinutes || 0);
  const [hour, minute] = checkInTime.split(":").map(Number);
  const status = hour * 60 + minute > allowedMinutes ? "Late" : "Present";

  attendance.push({
    id: makeId(),
    userId: user.id,
    date: today,
    checkIn: checkInTime,
    checkOut: "",
    status
  });

  saveData(ATTENDANCE_KEY, attendance);
  renderDashboard(user);
}

function checkOut(user) {
  const attendance = readData(ATTENDANCE_KEY, []);
  const record = attendance.find(item => item.userId === user.id && item.date === getToday());

  if (!record || !record.checkIn || record.checkOut) return;

  record.checkOut = getTime();

  const [inHour, inMinute] = record.checkIn.split(":").map(Number);
  const [outHour, outMinute] = record.checkOut.split(":").map(Number);
  const hoursWorked = (outHour * 60 + outMinute - inHour * 60 - inMinute) / 60;

  if (hoursWorked < 5) {
    record.status = "Half Day";
  }

  saveData(ATTENDANCE_KEY, attendance);
  renderDashboard(user);
}

// Leave requests
function applyLeave(event, user) {
  event.preventDefault();

  const from = document.getElementById("leave-from").value;
  const to = document.getElementById("leave-to").value;
  const type = document.getElementById("leave-type").value;
  const reason = document.getElementById("leave-reason").value.trim();
  const leaves = readData(LEAVES_KEY, []);

  if (!from || !to || !reason || from > to) {
    return leaveMessage("Sahi dates aur reason enter karo.", "error");
  }

  if (from < getToday()) {
    return leaveMessage("Pichli date ke liye leave apply nahi kar sakte.", "error");
  }

  if (leaves.some(item =>
    item.userId === user.id &&
    item.status !== "Rejected" &&
    from <= item.to && to >= item.from
  )) {
    return leaveMessage("In dates mein pehle se leave request mojood hai.", "error");
  }

  const days = countWorkingDays(from, to);
  if (days < 1) {
    return leaveMessage("Selected dates mein working day nahi hai.", "error");
  }

  if (days > getLeaveBalance(user.id)) {
    return leaveMessage("Aapki remaining leave balance itni nahi hai.", "error");
  }

  leaves.push({
    id: makeId(),
    userId: user.id,
    type,
    from,
    to,
    days,
    reason,
    status: "Pending",
    comment: ""
  });

  saveData(LEAVES_KEY, leaves);
  renderDashboard(user);
}

function countWorkingDays(from, to) {
  const company = readData(COMPANY_KEY, {});
  const workingDays = company.workingDays || [1, 2, 3, 4, 5];
  let count = 0;
  const date = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");

  while (date <= end) {
    if (workingDays.includes(date.getDay())) count++;
    date.setDate(date.getDate() + 1);
  }

  return count;
}

function getLeaveBalance(userId) {
  const company = readData(COMPANY_KEY, {});
  const leaves = readData(LEAVES_KEY, []);
  const year = String(new Date().getFullYear());

  const used = leaves.filter(item =>
    item.userId === userId &&
    item.status === "Approved" &&
    item.from.startsWith(year)
  ).reduce((sum, item) => sum + item.days, 0);

  const pending = leaves.filter(item =>
    item.userId === userId &&
    item.status === "Pending" &&
    item.from.startsWith(year)
  ).reduce((sum, item) => sum + item.days, 0);

  return Math.max(0, Number(company.leaveQuota || 12) - used - pending);
}

function leaveMessage(message, type) {
  const box = document.getElementById("leave-message");
  box.textContent = message;
  box.className = "message " + type;
  box.hidden = false;
}

function renderOwnLeaves(leaves, userId) {
  const own = leaves.filter(item => item.userId === userId);

  if (!own.length) {
    return `<p class="empty-state">You have not submitted any leave requests.</p>`;
  }

  return `<div class="leave-list">${own.map(item => `
    <div class="leave-item">
      <div><strong>${escapeHTML(item.type)} leave</strong>
      <p>${escapeHTML(item.from)} to ${escapeHTML(item.to)} · ${item.days} working day(s)</p>
      <p>${escapeHTML(item.reason)}</p>
      ${item.comment ? `<p>Admin comment: ${escapeHTML(item.comment)}</p>` : ""}</div>
      <span class="leave-status status-${item.status.toLowerCase()}">${escapeHTML(item.status)}</span>
    </div>
  `).join("")}</div>`;
}

function renderAdminLeaves(leaves, users) {
  const pending = leaves.filter(item => item.status === "Pending");

  if (!pending.length) {
    return `<p class="empty-state">No pending leave requests.</p>`;
  }

  return `<div class="leave-list">${pending.map(item => {
    const employee = users.find(person => person.id === item.userId);

    return `<div class="leave-item">
      <div>
        <strong>${escapeHTML(employee?.name || "Unknown employee")} · ${escapeHTML(item.type)}</strong>
        <p>${escapeHTML(item.from)} to ${escapeHTML(item.to)} · ${item.days} working day(s)</p>
        <p>${escapeHTML(item.reason)}</p>
        <label for="comment-${escapeHTML(item.id)}">Admin comment</label>
        <input id="comment-${escapeHTML(item.id)}" maxlength="200" placeholder="Optional comment">
        <div class="action-buttons">
          <button class="small-action approve" data-leave-action="Approved" data-id="${escapeHTML(item.id)}">Approve</button>
          <button class="small-action reject" data-leave-action="Rejected" data-id="${escapeHTML(item.id)}">Reject</button>
        </div>
      </div>
    </div>`;
  }).join("")}</div>`;
}

function updateLeave(id, status) {
  const leaves = readData(LEAVES_KEY, []);
  const leave = leaves.find(item => item.id === id);

  if (!leave || leave.status !== "Pending") return;

  const commentInput = document.getElementById("comment-" + id);
  leave.comment = commentInput ? commentInput.value.trim() : "";
  leave.status = status;

  saveData(LEAVES_KEY, leaves);

  const session = readData(SESSION_KEY, null);
  const admin = readData(USERS_KEY, []).find(item => item.id === session?.userId);

  if (admin?.role === "admin") renderDashboard(admin);
}

// Smart helper: answers from saved app data, not an external AI
function askHelper(user) {
  const input = document.getElementById("helper-input");
  const question = input.value.trim().toLowerCase();
  if (!question) return;

  const chat = document.getElementById("chat-messages");
  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user-bubble";
  userBubble.textContent = input.value.trim();
  chat.appendChild(userBubble);

  const reply = getHelperReply(question, user);
  const botBubble = document.createElement("div");
  botBubble.className = "chat-bubble bot-bubble";
  botBubble.textContent = reply;
  chat.appendChild(botBubble);

  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}

function getHelperReply(question, user) {
  const users = readData(USERS_KEY, []);
  const attendance = readData(ATTENDANCE_KEY, []);
  const leaves = readData(LEAVES_KEY, []);
  const today = getToday();
  const isAdmin = user.role === "admin";

  if (question.includes("employee") || question.includes("team")) {
    if (!isAdmin) return "Aap sirf apne personal records dekh sakte hain.";

    return `Company mein ${users.filter(item => item.role === "employee").length} employees hain.`;
  }

  if (question.includes("leave") && (question.includes("today") || question.includes("on leave"))) {
    if (!isAdmin) return "Aap apni leave requests 'My leave requests' section mein dekh sakte hain.";

    const onLeave = leaves.filter(item =>
      item.status === "Approved" && item.from <= today && item.to >= today
    );

    return `Aaj ${onLeave.length} approved leave par hain.` +
      (onLeave.length ? " Employees: " + onLeave.map(item =>
        users.find(person => person.id === item.userId)?.name || "Unknown"
      ).join(", ") : "");
  }

  if (question.includes("late")) {
    const records = attendance.filter(item =>
      item.date === today && item.status === "Late" &&
      (isAdmin || item.userId === user.id)
    );

    return isAdmin
      ? `Aaj ${records.length} employees late hain.`
      : records.some(item => item.userId === user.id)
        ? "Aap aaj late check-in hue thay."
        : "Aaj aapke record mein late check-in nahi hai.";
  }

  if (question.includes("leave") && (question.includes("left") || question.includes("balance") || question.includes("remaining"))) {
    return `Aapki remaining leave balance ${getLeaveBalance(user.id)} working days hai.`;
  }

  if (question.includes("attendance") || question.includes("present") || question.includes("check in")) {
    if (!isAdmin) {
      const record = attendance.find(item => item.userId === user.id && item.date === today);
      return record
        ? `Aaj check-in: ${record.checkIn}, check-out: ${record.checkOut || "abhi nahi"}, status: ${record.status}.`
        : "Aaj aapne abhi check-in nahi kiya.";
    }

    const present = new Set(attendance.filter(item => item.date === today).map(item => item.userId)).size;
    return `Aaj ${present} employees ke attendance records hain.`;
  }

  if (question.includes("hour") || question.includes("work this week")) {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    const start = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;

    const records = attendance.filter(item =>
      item.userId === user.id && item.date >= start && item.date <= today && item.checkIn && item.checkOut
    );

    const minutes = records.reduce((sum, item) => {
      const [ih, im] = item.checkIn.split(":").map(Number);
      const [oh, om] = item.checkOut.split(":").map(Number);
      return sum + Math.max(0, oh * 60 + om - ih * 60 - im);
    }, 0);

    return `Is week aapke completed attendance records ke mutabiq ${Math.floor(minutes / 60)} hours aur ${minutes % 60} minutes hain.`;
  }

  return isAdmin
    ? "Aap employees ki tadaad, aaj ki attendance, late records aur approved leaves ke baare mein pooch sakte hain."
    : "Aap apni attendance, check-in status aur remaining leave balance ke baare mein pooch sakte hain.";
}

// Logout
function logout() {
  localStorage.removeItem(SESSION_KEY);
  showLogin();

  document.querySelector(".main-container").innerHTML = `
    <section class="welcome-panel">
      <span class="eyebrow">HUMAN CAPITAL MANAGEMENT</span>
      <h1>People first.<br><span>Work smarter.</span></h1>
      <p>One simple workspace to manage your team, attendance and everyday HR tasks.</p>
      <div class="feature-list">
        <div><span class="feature-check">✓</span> Simple employee management</div>
        <div><span class="feature-check">✓</span> Attendance and leave tracking</div>
        <div><span class="feature-check">✓</span> One place for your HR work</div>
      </div>
      <div class="welcome-bottom"><span class="status-dot"></span> Beginner Track · HTML, CSS & JavaScript</div>
    </section>
    <section class="auth-area">
      <div class="auth-card">
        <div class="card-heading">
          <div class="mini-icon">✦</div><h2 id="form-title">Welcome back</h2>
          <p id="form-description">Sign in to continue to your workspace.</p>
        </div>
        <div id="message" class="message" role="status" aria-live="polite" hidden></div>
        <form id="setup-form" hidden>
          <label for="company-name">Company name</label><input id="company-name" required>
          <label for="setup-name">Admin full name</label><input id="setup-name" required>
          <label for="setup-email">Email address</label><input id="setup-email" type="email" required>
          <label for="setup-password">Password</label><input id="setup-password" type="password" minlength="6" required>
          <button class="primary-button" type="submit">Create company & Admin →</button>
        </form>
        <form id="login-form">
          <label for="login-email">Email address</label><input id="login-email" type="email" required>
          <label for="login-password">Password</label>
          <div class="password-wrap"><input id="login-password" type="password" required><button id="toggle-password" class="password-toggle" type="button">Show</button></div>
          <button class="primary-button" type="submit">Sign in to workspace →</button>
        </form>
        <div class="secure-note">▣ Demo app · Data stays in this browser</div>
      </div>
      <p class="copyright">© 2026 HCM Lite · Saylani Hackathon</p>
    </section>`;

  // Reconnect the form handlers after rebuilding the login screen.
  initializeAuth();
}

function initializeAuth() {
  document.getElementById("setup-form").addEventListener("submit", setupHandler);
  document.getElementById("login-form").addEventListener("submit", loginHandler);
  document.getElementById("toggle-password").addEventListener("click", togglePassword);
}

// Separate handler references for reconnecting after logout
function setupHandler(event) {
  event.preventDefault();
  showMessage("Page reload karke setup form dobara open karo.");
}

function loginHandler(event) {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const users = readData(USERS_KEY, []);
  const user = users.find(item => item.email === email && item.password === password);

  if (!user) return showMessage("Email ya password ghalat hai.");

  saveData(SESSION_KEY, { userId: user.id });
  renderDashboard(user);
}

function togglePassword() {
  const passwordInput = document.getElementById("login-password");
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
}

// Start app
function startApp() {
  if (!localStorage.getItem(COMPANY_KEY)) {
    showSetup();
    return;
  }

  showLogin();

  const session = readData(SESSION_KEY, null);
  const users = readData(USERS_KEY, []);
  const user = users.find(item => item.id === session?.userId);

  if (user) {
    renderDashboard(user);
  }
}

startApp();
