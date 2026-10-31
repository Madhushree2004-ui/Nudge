
/* =====================================
   NUDGE - TASK MANAGEMENT APPLICATION
===================================== */

// 1. SELECT HTML ELEMENTS

const taskForm = document.getElementById("taskForm");
const taskModal = document.getElementById("taskModal");

const openTaskModal = document.getElementById("openTaskModal");
const closeTaskModal = document.getElementById("closeTaskModal");

const taskList = document.getElementById("taskList");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const sortTasks = document.getElementById("sortTasks");

const taskSectionTitle = document.getElementById("taskSectionTitle");

const totalTasks = document.getElementById("totalTasks");
const pendingTasks = document.getElementById("pendingTasks");
const completedTasks = document.getElementById("completedTasks");
const overdueTasks = document.getElementById("overdueTasks");


// 2. APPLICATION DATA

const STORAGE_KEY = "nudge_tasks";

let tasks = loadTasks();

let currentFilter = "all";
let currentCategory = null;


// 3. GET LOCAL DATE

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// 4. LOAD TASKS FROM LOCAL STORAGE

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem(STORAGE_KEY);

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        return Array.isArray(parsedTasks) ? parsedTasks : [];

    } catch (error) {
        console.error("Unable to load tasks:", error);
        return [];
    }
}


// 5. SAVE TASKS TO LOCAL STORAGE

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Your tasks could not be saved in this browser.");
    }
}


// 6. ESCAPE USER INPUT BEFORE DISPLAYING HTML

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}


// 7. OPEN AND CLOSE TASK MODAL

function showModal() {
    taskModal.classList.add("show");
    document.getElementById("taskTitle").focus();
}

function hideModal() {
    taskModal.classList.remove("show");
    taskForm.reset();
}

openTaskModal.addEventListener("click", showModal);

closeTaskModal.addEventListener("click", hideModal);

taskModal.addEventListener("click", function(event) {
    if (event.target === taskModal) {
        hideModal();
    }
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        hideModal();
    }
});


// 8. ADD A NEW TASK

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();

    const description = document.getElementById("taskDescription").value.trim();

    const date = document.getElementById("taskDate").value;

    const time = document.getElementById("taskTime").value;

    const category = document.getElementById("taskCategory").value;

    const priority = document.getElementById("taskPriority").value;

    const reminder = Number(document.getElementById("reminderTime").value);

    if (!title || !date) {
        alert("Please enter a task name and deadline.");
        return;
    }

    if (date < getToday()) {
        alert("Please choose today or a future date.");
        return;
    }

    if (!["Study", "Personal", "Work"].includes(category) ||
        !["Low", "Medium", "High"].includes(priority) ||
        ![0, 1440, 2880, 4320, 10080].includes(reminder)) {
        alert("Please select valid task options.");
        return;
    }

    const newTask = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,

        title: title,
        description: description,
        date: date,
        time: time,
        category: category,
        priority: priority,
        reminder: reminder,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);

    saveTasks();

    renderTasks();

    updateDashboard();

    hideModal();

});


// 9. CHECK WHETHER A TASK IS OVERDUE

function isOverdue(task) {

    if (task.completed) {
        return false;
    }

    const deadline = new Date(
        `${task.date}T${task.time || "23:59"}`
    );

    return deadline.getTime() < Date.now();
}


// 10. FORMAT DEADLINE FOR DISPLAY

function formatDeadline(task) {

    const [year, month, day] = task.date.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    const formattedDate = date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    if (!task.time) {
        return formattedDate;
    }

    const [hours, minutes] = task.time.split(":").map(Number);

    const formattedTime = new Date(
        2000, 0, 1, hours, minutes
    ).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit"
    });

    return `${formattedDate} · ${formattedTime}`;
}


// 11. DISPLAY TASKS

function renderTasks() {

    let filteredTasks = [...tasks];

    const searchText = searchInput.value.toLowerCase().trim();

    // Filter by status

    if (currentFilter === "today") {

        filteredTasks = filteredTasks.filter(task =>
            task.date === getToday() && !task.completed
        );

    } else if (currentFilter === "upcoming") {

        filteredTasks = filteredTasks.filter(task =>
            task.date > getToday() && !task.completed
        );

    } else if (currentFilter === "completed") {

        filteredTasks = filteredTasks.filter(task =>
            task.completed
        );

    }

    // Filter by category

    if (currentCategory) {

        filteredTasks = filteredTasks.filter(task =>
            task.category === currentCategory
        );

    }

    // Search tasks

    if (searchText) {

        filteredTasks = filteredTasks.filter(task => {

            const searchableText =
                `${task.title} ${task.description} ${task.category}`.toLowerCase();

            return searchableText.includes(searchText);

        });

    }

    // Filter by priority

    if (priorityFilter.value !== "all") {

        filteredTasks = filteredTasks.filter(task =>
            task.priority === priorityFilter.value
        );

    }

    // Sort tasks

    if (sortTasks.value === "date") {

        filteredTasks.sort((a, b) =>
            new Date(`${a.date}T${a.time || "23:59"}`) -
            new Date(`${b.date}T${b.time || "23:59"}`)
        );

    } else if (sortTasks.value === "priority") {

        const priorityOrder = {
            High: 1,
            Medium: 2,
            Low: 3
        };

        filteredTasks.sort((a, b) =>
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );

    } else if (sortTasks.value === "newest") {

        filteredTasks.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

    }


    // Show empty message

    if (filteredTasks.length === 0) {

        taskList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✦</div>
                <h3>Nothing here for now!</h3>
                <p>Your task space is looking peaceful.</p>
            </div>
        `;

        return;
    }


    // Create task cards

    taskList.innerHTML = filteredTasks.map(task => {

        const priorityClass = `priority-${task.priority.toLowerCase()}`;

        const overdueLabel = isOverdue(task)
            ? `<span class="task-badge priority-high">Overdue</span>`
            : "";

        return `

            <div class="task-card ${task.completed ? "completed" : ""}">

                <div class="task-left">

                    <input
                        type="checkbox"
                        class="task-checkbox"
                        data-id="${escapeHTML(task.id)}"
                        ${task.completed ? "checked" : ""}
                        aria-label="Mark ${escapeHTML(task.title)} as completed"
                    >

                    <div class="task-info">

                        <h3>${escapeHTML(task.title)}</h3>

                        <p>
                            ${escapeHTML(task.category)}
                            ·
                            ${escapeHTML(task.description || "No description")}
                        </p>

                    </div>

                </div>


                <div class="task-right">

                    <span class="task-date">
                        ${escapeHTML(formatDeadline(task))}
                    </span>

                    <span class="task-badge ${priorityClass}">
                        ${escapeHTML(task.priority)}
                    </span>

                    ${overdueLabel}

                    <button
                        class="delete-btn"
                        data-delete-id="${escapeHTML(task.id)}"
                        aria-label="Delete task"
                        title="Delete task"
                    >
                        ×
                    </button>

                </div>

            </div>

        `;

    }).join("");

}


// 12. COMPLETE OR UNCOMPLETE TASKS

taskList.addEventListener("change", function(event) {

    if (!event.target.classList.contains("task-checkbox")) {
        return;
    }

    const taskId = event.target.dataset.id;

    const task = tasks.find(item => item.id === taskId);

    if (task) {

        task.completed = event.target.checked;

        saveTasks();

        renderTasks();

        updateDashboard();

    }

});


// 13. DELETE TASKS

taskList.addEventListener("click", function(event) {

    const deleteButton = event.target.closest("[data-delete-id]");

    if (!deleteButton) {
        return;
    }

    const taskId = deleteButton.dataset.deleteId;

    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter(task => task.id !== taskId);

    saveTasks();

    renderTasks();

    updateDashboard();

});


// 14. UPDATE DASHBOARD NUMBERS

function updateDashboard() {

    const total = tasks.length;

    const completed = tasks.filter(task =>
        task.completed
    ).length;

    const pending = tasks.filter(task =>
        !task.completed
    ).length;

    const overdue = tasks.filter(task =>
        isOverdue(task)
    ).length;

    totalTasks.textContent = total;

    pendingTasks.textContent = pending;

    completedTasks.textContent = completed;

    overdueTasks.textContent = overdue;

}


// 15. SIDEBAR NAVIGATION

document.querySelectorAll("[data-filter]").forEach(button => {

    button.addEventListener("click", function() {

        currentFilter = button.dataset.filter;

        currentCategory = null;

        updateActiveNavigation(button);

        const titles = {
            all: "All Tasks",
            today: "Today's Tasks",
            upcoming: "Upcoming Tasks",
            completed: "Completed Tasks"
        };

        taskSectionTitle.textContent = titles[currentFilter];

        renderTasks();

    });

});


// 16. CATEGORY NAVIGATION

document.querySelectorAll("[data-category]").forEach(button => {

    button.addEventListener("click", function() {

        currentCategory = button.dataset.category;

        currentFilter = "all";

        updateActiveNavigation(button);

        taskSectionTitle.textContent = `${currentCategory} Tasks`;

        renderTasks();

    });

});


// 17. UPDATE ACTIVE SIDEBAR BUTTON

function updateActiveNavigation(activeButton) {

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");
    });

    activeButton.classList.add("active");

}


// 18. SEARCH AND FILTER EVENTS

searchInput.addEventListener("input", renderTasks);

priorityFilter.addEventListener("change", renderTasks);

sortTasks.addEventListener("change", renderTasks);


// 19. INITIALISE APPLICATION

function initialiseApp() {

    document.getElementById("taskDate").min = getToday();

    updateDashboard();

    renderTasks();

}

initialiseApp();
