const API_BASE = "https://task-manager-app-production-aa3b.up.railway.app";

let allTasks = [];
let currentFilter = "all";


// ================= ERROR HANDLER =================
function handleError(res, data) {
  if (!res.ok) {
    throw new Error(data.msg || "Something went wrong");
  }
}


// ================= SIGNUP =================
async function signup() {
  try {
    const name = document.getElementById("sname").value;
    const email = document.getElementById("semail").value;
    const password = document.getElementById("spassword").value;

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.msg || "Signup failed");

    alert("Registered successfully");
    showLogin();

  } catch (err) {
    alert(err.message);
  }
}


// ================= LOGIN =================
async function login() {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.msg || "Login failed");

    // ✅ SAFE STORAGE
    localStorage.setItem("token", data.token);

    const userId = data.user?._id || data.user?.id;

    if (!userId) {
      alert("Login failed: userId not received");
      return;
    }

    localStorage.setItem("userId", userId);
    localStorage.setItem("role", data.user?.role || "member");

    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
}


// ================= AUTH HEADERS =================
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}


// ================= DASHBOARD =================
async function loadDashboard() {
  try {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.log("No userId found");
      return;
    }

    const res = await fetch(
      `${API_BASE}/api/task/dashboard/${userId}`,
      { headers: getAuthHeaders() }
    );

    const data = await res.json();
    handleError(res, data);

    document.getElementById("total").innerText = data.total || 0;
    document.getElementById("completed").innerText = data.completed || 0;
    document.getElementById("pending").innerText = data.pending || 0;
    document.getElementById("overdue").innerText = data.overdue || 0;

  } catch (err) {
    console.log(err.message);
  }
}


// ================= PROJECTS =================
async function loadProjects() {
  try {
    const container = document.getElementById("projectContainer");
    const select = document.getElementById("projectSelect");

    if (!container) return;

    const userId = localStorage.getItem("userId");

    const res = await fetch(
      `${API_BASE}/api/project/user/${userId}`,
      { headers: getAuthHeaders() }
    );

    const projects = await res.json();
    handleError(res, projects);

    container.innerHTML = "";

    if (select) {
      select.innerHTML = `<option value="">Select Project</option>`;
    }

    projects.forEach(p => {
      container.innerHTML += `
        <div class="project-card" onclick="selectProject('${p._id}')">
          📁 ${p.projectName}
        </div>
      `;

      if (select) {
        select.innerHTML += `<option value="${p._id}">${p.projectName}</option>`;
      }
    });

  } catch (err) {
    console.log(err.message);
  }
}


// ================= CREATE PROJECT =================
async function createProject() {
  try {
    const projectName = document.getElementById("projectName").value;

    if (!projectName) return alert("Enter project name");

    const res = await fetch(`${API_BASE}/api/project/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectName })
    });

    const data = await res.json();
    handleError(res, data);

    loadProjects();

  } catch (err) {
    alert(err.message);
  }
}


// ================= LOAD TASKS =================
async function loadTasks() {
  try {
    const userId = localStorage.getItem("userId");
    const projectId = localStorage.getItem("currentProject");

    if (!userId) return;

    const res = await fetch(
      `${API_BASE}/api/task/user/${userId}`,
      { headers: getAuthHeaders() }
    );

    let tasks = await res.json();
    handleError(res, tasks);

    if (projectId) {
      tasks = tasks.filter(t => t.projectId === projectId);
    }

    allTasks = tasks;

    applyFilters();
    renderKanban(tasks);

  } catch (err) {
    console.log(err.message);
  }
}


// ================= ROLE CHECK =================
function isAdmin() {
  return localStorage.getItem("role") === "admin";
}


// ================= CREATE TASK =================
async function createTask() {
  try {
    if (!isAdmin()) return alert("Only admin can create tasks");

    const task = {
      title: document.getElementById("title").value,
      description: document.getElementById("desc").value,
      projectId: document.getElementById("projectSelect")?.value || "",
      priority: document.getElementById("priority").value,
      dueDate: document.getElementById("date").value,
      assignedTo: localStorage.getItem("userId")
    };

    const res = await fetch(`${API_BASE}/api/task/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(task)
    });

    const data = await res.json();
    handleError(res, data);

    loadTasks();
    loadDashboard();

  } catch (err) {
    alert(err.message);
  }
}


// ================= UPDATE TASK =================
async function updateTask(taskId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/task/update/${taskId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    handleError(res, data);

    loadTasks();
    loadDashboard();

  } catch (err) {
    console.log(err.message);
  }
}


// ================= FILTER =================
function applyFilters() {
  let tasks = [...allTasks];

  const searchEl = document.getElementById("searchInput");
  const search = searchEl ? searchEl.value.toLowerCase() : "";

  if (search) {
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(search)
    );
  }

  if (currentFilter !== "all") {
    tasks = tasks.filter(t => t.status === currentFilter);
  }

  renderTasks(tasks);
}


// ================= TABLE =================
function renderTasks(tasks) {
  const tbody = document.getElementById("taskBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  tasks.forEach(task => {
    tbody.innerHTML += `
      <tr>
        <td>${task.title}</td>
        <td>${task.description}</td>
        <td>${task.status}</td>
        <td>${task.priority}</td>
        <td>${task.dueDate?.split("T")[0] || ""}</td>
        <td>
          <button onclick="updateTask('${task._id}','todo')">To Do</button>
          <button onclick="updateTask('${task._id}','inprogress')">Progress</button>
          <button onclick="updateTask('${task._id}','done')">Done</button>
        </td>
      </tr>
    `;
  });
}


// ================= KANBAN =================
function renderKanban(tasks) {
  const todo = document.getElementById("todoColumn");
  const progress = document.getElementById("progressColumn");
  const done = document.getElementById("doneColumn");

  if (!todo || !progress || !done) return;

  todo.innerHTML = "";
  progress.innerHTML = "";
  done.innerHTML = "";

  tasks.forEach(task => {
    const card = `
      <div class="task-card"
           draggable="true"
           ondragstart="drag(event,'${task._id}')">
        <b>${task.title}</b><br>
        <small>${task.priority}</small>
      </div>
    `;

    if (task.status === "todo") todo.innerHTML += card;
    else if (task.status === "inprogress") progress.innerHTML += card;
    else done.innerHTML += card;
  });
}


// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadProjects();
  loadTasks();
});