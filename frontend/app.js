let allTasks = [];
let currentFilter = "all";

// ================= SIGNUP =================
async function signup() {
  try {
    const name = document.getElementById("sname").value;
    const email = document.getElementById("semail").value;
    const password = document.getElementById("spassword").value;

    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.msg || "Signup failed");

    alert("Registered successfully");
    showLogin();

  } catch (err) {
    console.log(err);
  }
}


// ================= LOGIN =================
async function login() {
  try {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.msg || "Login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.user._id);
    localStorage.setItem("role", data.user.role);

    window.location.href = "dashboard.html";

  } catch (err) {
    console.log(err);
  }
}


// ================= TOKEN =================
function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };
}


// ================= DASHBOARD =================
async function loadDashboard() {
  const userId = localStorage.getItem("userId");

  const res = await fetch(
    `http://localhost:5000/api/task/dashboard/${userId}`,
    { headers: getAuthHeaders() }
  );

  const data = await res.json();

  document.getElementById("total").innerText = data.total || 0;
  document.getElementById("completed").innerText = data.completed || 0;
  document.getElementById("pending").innerText = data.pending || 0;
  document.getElementById("overdue").innerText = data.overdue || 0;
}


// ================= PROJECTS =================
async function loadProjects() {
  const container = document.getElementById("projectContainer");
  const select = document.getElementById("projectSelect");

  if (!container) return;

  const userId = localStorage.getItem("userId");

  const res = await fetch(
    `http://localhost:5000/api/project/user/${userId}`,
    { headers: getAuthHeaders() }
  );

  const projects = await res.json();

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
}

async function createProject() {
  const projectName = document.getElementById("projectName").value;

  if (!projectName) return alert("Enter project name");

  await fetch("http://localhost:5000/api/project/create", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ projectName })
  });

  loadProjects();
}


// ================= LOAD TASKS =================
async function loadTasks() {
  const userId = localStorage.getItem("userId");
  const projectId = localStorage.getItem("currentProject");

  const res = await fetch(
    `http://localhost:5000/api/task/user/${userId}`,
    { headers: getAuthHeaders() }
  );

  let tasks = await res.json();

  if (projectId) {
    tasks = tasks.filter(t => t.projectId === projectId);
  }

  allTasks = tasks;

  applyFilters();
  renderKanban(tasks);
}


// ================= ROLE CHECK (FRONTEND SAFETY) =================
function isAdmin() {
  return localStorage.getItem("role") === "admin";
}


// ================= CREATE TASK =================
async function createTask() {

  // ❗ FRONTEND BLOCK (extra safety)
  if (!isAdmin()) {
    alert("Only admin can create tasks");
    return;
  }

  const task = {
    title: document.getElementById("title").value,
    description: document.getElementById("desc").value,
    projectId: document.getElementById("projectSelect")?.value || "",
    priority: document.getElementById("priority").value,
    dueDate: document.getElementById("date").value,
    assignedTo: localStorage.getItem("userId")
  };

  if (!task.projectId) return alert("Select project");

  await fetch("http://localhost:5000/api/task/create", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });

  loadTasks();
  loadDashboard();
}


// ================= UPDATE TASK =================
async function updateTask(taskId, status) {
  await fetch(`http://localhost:5000/api/task/update/${taskId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status })
  });

  loadTasks();
  loadDashboard();
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


// ================= DRAG DROP =================
function drag(event, id) {
  event.dataTransfer.setData("taskId", id);
}

function allowDrop(event) {
  event.preventDefault();
}

async function drop(event, status) {
  event.preventDefault();
  const id = event.dataTransfer.getData("taskId");
  await updateTask(id, status);
}


// ================= PROJECT SELECT =================
function selectProject(id) {
  localStorage.setItem("currentProject", id);
  loadTasks();
}


// ================= INIT =================
window.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadProjects();
  loadTasks();
});


// ================= LOGOUT =================
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function checkRoleUI() {
  const role = localStorage.getItem("role");

  if (role === "member") {
    document.getElementById("create").style.display = "none";
    document.getElementById("projects").style.display = "none";
  }
}