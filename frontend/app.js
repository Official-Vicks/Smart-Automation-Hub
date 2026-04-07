let lastLogs = [];

const API_BASE = "http://127.0.0.1:8000";

async function startOrganizer(event) {
  const btn = event.target;
  btn.innerText = "Starting...";
  btn.disabled = true;
  const directory = document.getElementById("directory").value;

  if (!directory) {
    alert("Please enter a directory");
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/start`, {
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
    getStatus(); // refresh UI;
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
    const res = await fetch(`${API_BASE}/stop`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Failed to stop");
    }
  } catch (err) {
    showToast(err.message, "error");
  }

  showToast("Organizer stopped", "info");
  addLog(data.message);
  getStatus();
  btn.innerText = "Stop";
  btn.disabled = false;
}

async function getStatus() {
  const res = await fetch(`${API_BASE}/status`);
  const data = await res.json();

  updateStatusUI(data.running);
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
  try {
    const res = await fetch(`${API_BASE}/logs`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Request failed");
    }

    const logsContainer = document.getElementById("logs");

    // Always clear first (important)
    logsContainer.innerHTML = "";

    // Handle empty logs properly
    if (!data.logs || data.logs.length === 0) {
      logsContainer.innerHTML = "";
      showEmptyLogs();
      lastLogs = [];
      return;
    }

    // Remove "No activity" message if logs exist
    if (logsContainer.innerText.includes("No activity yet")) {
      logsContainer.innerHTML = "";
    }

    data.logs.forEach((message) => {
      if (!lastLogs.includes(message)) {
        const logItem = document.createElement("div");
        logItem.className = "bg-gray-800 px-3 py-2 rounded-lg animate-fade-in";

        logItem.innerText = message;

        logsContainer.appendChild(logItem);
      }
    });

    lastLogs = data.logs;
    logsContainer.scrollTop = logsContainer.scrollHeight;
  } catch (err) {
    showToast(err.message, "error");
  }
}

function addLog(message) {
  const logs = document.getElementById("logs");

  // Prevent duplicates (same logic as fetchLogs)
  if (lastLogs.includes(message)) return;

  // Create log item
  const logItem = document.createElement("div");
  logItem.className =
    "bg-gray-800 px-3 py-2 rounded-lg animate-fade-in text-sm";
  logItem.innerText = message;

  // Append to UI
  logs.appendChild(logItem);

  // Update memory
  lastLogs.push(message);

  // Auto-scroll to bottom
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
    return;
  }

  const formattedTime = formatDateTime(time);
  const res = await fetch(`${API_BASE}/tasks`, {
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

  // Clear inputs
  document.getElementById("task").value = "";
  document.getElementById("description").value = "";
  document.getElementById("time").value = "";

  btn.innerText = "Add Task";
  btn.disabled = false;
}

function formatDateTime(value) {
  // value = "2026-04-05T14:00 AM/PM"

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

  toast.innerHTML = `
      <span>${message}</span>
  `;

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

init();
setInterval(fetchLogs, 50000);
