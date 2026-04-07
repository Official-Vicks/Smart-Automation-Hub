let lastLogs = [];

const API_BASE = "https://smart-automation-hub.onrender.com";

// 🔒 Locks to prevent overlapping requests
let isFetchingLogs = false;
let isFetchingStatus = false;

// ⏱️ Fetch with timeout (prevents hanging)
function fetchWithTimeout(url, options = {}, timeout = 7000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
}

async function startOrganizer(event) {
  const btn = event.target;
  btn.innerText = "Starting...";
  btn.disabled = true;
  const directory = document.getElementById("directory").value;

  if (!directory) {
    alert("Please enter a directory");
    btn.innerText = "Start";
    btn.disabled = false;
    return;
  }

  try {
    const res = await fetchWithTimeout(`${API_BASE}/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ directory }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Failed to start");
    }

    showToast("Organizer started", "success");
    addLog(data.message);
    getStatus();
  } catch (err) {
    showToast(err.message, "error");
  }

  btn.innerText = "Start";
  btn.disabled = false;
}

async function stopOrganizer(event) {
  const btn = event.target;
  btn.innerText = "Stopping...";
  btn.disabled = true;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/stop`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Failed to stop");
    }

    showToast("Organizer stopped", "info");
    addLog(data.message);
    getStatus();
  } catch (err) {
    showToast(err.message, "error");
  }

  btn.innerText = "Stop";
  btn.disabled = false;
}

async function getStatus() {
  if (isFetchingStatus) return;
  isFetchingStatus = true;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/status`);
    const data = await res.json();

    updateStatusUI(data.running);
  } catch (err) {
    console.log("Status error:", err);
  } finally {
    isFetchingStatus = false;
  }
}

function updateStatusUI(isRunning) {
  const status = document.getElementById("status");

  if (isRunning) {
    status.className = "px-4 py-2 rounded-full bg-green-500 text-sm";
    status.innerText = "🟢 Running";
  } else {
    status.className = "px-4 py-2 rounded-full bg-red-500 text-sm";
    status.innerText = "🔴 Stopped";
  }
}

async function fetchLogs() {
  if (isFetchingLogs) return;
  isFetchingLogs = true;

  try {
    const res = await fetchWithTimeout(`${API_BASE}/logs`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }

    const logsContainer = document.getElementById("logs");

    logsContainer.innerHTML = "";

    if (!data.logs || data.logs.length === 0) {
      showEmptyLogs();
      lastLogs = [];
      return;
    }

    data.logs.forEach((message) => {
      const logItem = document.createElement("div");
      logItem.className = "bg-gray-800 px-3 py-2 rounded-lg animate-fade-in";
      logItem.innerText = message;
      logsContainer.appendChild(logItem);
    });

    lastLogs = data.logs;
    logsContainer.scrollTop = logsContainer.scrollHeight;
  } catch (err) {
    console.log("Fetch logs error:", err);
    showEmptyLogs();
  } finally {
    isFetchingLogs = false;
  }
}

function addLog(message) {
  const logs = document.getElementById("logs");

  if (lastLogs.includes(message)) return;

  const logItem = document.createElement("div");
  logItem.className =
    "bg-gray-800 px-3 py-2 rounded-lg animate-fade-in text-sm";
  logItem.innerText = message;

  logs.appendChild(logItem);

  lastLogs.push(message);
  logs.scrollTop = logs.scrollHeight;
}

async function addTask(event) {
  const btn = event.target;
  btn.innerText = "Adding...";
  btn.disabled = true;

  const task = document.getElementById("task").value;
  const description = document.getElementById("description").value;
  const time = document.getElementById("time").value;

  if (!task || !time || !description) {
    alert("Please fill all fields");
    btn.innerText = "Add Task";
    btn.disabled = false;
    return;
  }

  try {
    const formattedTime = formatDateTime(time);

    const res = await fetchWithTimeout(`${API_BASE}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: task,
        description: description,
        due_time: formattedTime,
      }),
    });

    const data = await res.json();

    showToast("Task added successfully", "success");
    addLog(data.message || `Task added: ${task}`);
  } catch (err) {
    showToast(err.message, "error");
  }

  document.getElementById("task").value = "";
  document.getElementById("description").value = "";
  document.getElementById("time").value = "";

  btn.innerText = "Add Task";
  btn.disabled = false;
}

function formatDateTime(value) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");

  let [hour, minute] = time.split(":");

  let period = "AM";

  if (hour >= 12) {
    period = "PM";
    if (hour > 12) hour -= 12;
  }

  if (hour == 0) hour = 12;

  const shortYear = year.slice(2);

  return `${day}/${month}/${shortYear} ${hour}:${minute} ${period}`;
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");

  const styles = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  toast.className = `${styles[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in`;

  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-x-5");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function showEmptyLogs() {
  const logs = document.getElementById("logs");

  logs.innerHTML = `
    <div class="text-gray-400 text-center mt-10">
      No activity yet...
    </div>
  `;
}

function init() {
  showEmptyLogs();
  getStatus();
  fetchLogs();
}

// 👇 Wake app when user returns to tab
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    fetchLogs();
    getStatus();
  }
});

init();

// ⏱️ Reduced frequency to prevent overload
setInterval(fetchLogs, 80000);
setInterval(getStatus, 100000);
