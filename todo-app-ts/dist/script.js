"use strict";
// ======================================
// 1. TYPES AND INTERFACES
// ======================================
// ======================================
// 2. DOM ELEMENTS
// ======================================
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element ${id} not found`);
    }
    return element;
}
const todoForm = getElement("todo-form");
const taskTitle = getElement("task-title");
const taskNotes = getElement("task-notes");
const taskOwner = getElement("task-owner");
const dueDate = getElement("due-date");
const taskList = getElement("task-list");
const emptyMessage = getElement("empty-message");
const totalCount = getElement("total-count");
const completedCount = getElement("completed-count");
const pendingCount = getElement("pending-count");
const clearCompletedBtn = getElement("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");
// ======================================
// 3. LOCAL STORAGE DATA VALIDATION
// ======================================
function isTodo(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const task = value;
    return (typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.notes === "string" &&
        (task.status === "pending" || task.status === "completed") &&
        typeof task.dueDate === "string" &&
        typeof task.owner === "string");
}
// ======================================
// 4. TASK DATA
// ======================================
function loadTasks() {
    const savedTasks = localStorage.getItem("tasks");
    if (savedTasks === null) {
        return [];
    }
    try {
        const parsedData = JSON.parse(savedTasks);
        if (!Array.isArray(parsedData)) {
            return [];
        }
        return parsedData.filter(isTodo);
    }
    catch (error) {
        console.error("Error loading tasks:", error);
        return [];
    }
}
let tasks = loadTasks();
let currentFilter = "all";
// ======================================
// 5. SAVE TASKS
// ======================================
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}
// ======================================
// 6. ADD TASK
// ======================================
todoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = taskTitle.value.trim();
    if (title === "") {
        return;
    }
    const newTask = {
        id: Date.now().toString(),
        title: title,
        notes: taskNotes.value.trim(),
        status: "pending",
        dueDate: dueDate.value,
        owner: taskOwner.value.trim()
    };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    todoForm.reset();
});
// ======================================
// 7. DISPLAY TASKS
// ======================================
function renderTasks() {
    taskList.innerHTML = "";
    const filteredTasks = tasks.filter((task) => {
        if (currentFilter === "pending") {
            return task.status === "pending";
        }
        if (currentFilter === "completed") {
            return task.status === "completed";
        }
        return true;
    });
    filteredTasks.forEach((task) => {
        const li = document.createElement("li");
        li.className = "task-item";
        if (task.status === "completed") {
            li.classList.add("completed");
        }
        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.status === "completed";
        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });
        // Task Details
        const details = document.createElement("div");
        details.className = "task-details";
        const title = document.createElement("h3");
        title.textContent = task.title;
        details.appendChild(title);
        // Notes
        if (task.notes) {
            const notes = document.createElement("p");
            notes.textContent = task.notes;
            details.appendChild(notes);
        }
        // Metadata
        const metadata = document.createElement("small");
        const information = [];
        if (task.owner) {
            information.push("Owner: " + task.owner);
        }
        if (task.dueDate) {
            information.push("Due: " + task.dueDate);
        }
        metadata.textContent = information.join(" | ");
        if (information.length > 0) {
            details.appendChild(metadata);
        }
        // Delete Button
        const actions = document.createElement("div");
        actions.className = "task-actions";
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });
        actions.appendChild(deleteButton);
        // Append Elements
        li.appendChild(checkbox);
        li.appendChild(details);
        li.appendChild(actions);
        taskList.appendChild(li);
    });
    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";
    updateStats();
}
// ======================================
// 8. TOGGLE TASK STATUS
// ======================================
function toggleTask(id) {
    tasks = tasks.map((task) => {
        if (task.id === id) {
            return {
                ...task,
                status: task.status === "pending"
                    ? "completed"
                    : "pending"
            };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}
// ======================================
// 9. DELETE TASK
// ======================================
function deleteTask(id) {
    tasks = tasks.filter((task) => {
        return task.id !== id;
    });
    saveTasks();
    renderTasks();
}
// ======================================
// 10. UPDATE STATISTICS
// ======================================
function updateStats() {
    const completed = tasks.filter((task) => {
        return task.status === "completed";
    }).length;
    const pending = tasks.length - completed;
    totalCount.textContent = tasks.length + " Tasks";
    completedCount.textContent = completed + " Completed";
    pendingCount.textContent = pending + " Pending";
}
// ======================================
// 11. FILTER TASKS
// ======================================
function isTaskFilter(value) {
    return (value === "all" ||
        value === "pending" ||
        value === "completed");
}
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((btn) => {
            btn.classList.remove("active");
        });
        button.classList.add("active");
        const filter = button.dataset.filter;
        if (isTaskFilter(filter)) {
            currentFilter = filter;
        }
        renderTasks();
    });
});
// ======================================
// 12. CLEAR COMPLETED TASKS
// ======================================
clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter((task) => {
        return task.status !== "completed";
    });
    saveTasks();
    renderTasks();
});
// ======================================
// 13. INITIALIZE APPLICATION
// ======================================
renderTasks();
