// Get HTML elements
const todoForm = document.getElementById("todo-form");
const taskTitle = document.getElementById("task-title");
const taskNotes = document.getElementById("task-notes");
const taskOwner = document.getElementById("task-owner");
const dueDate = document.getElementById("due-date");

const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

const totalCount = document.getElementById("total-count");
const completedCount = document.getElementById("completed-count");
const pendingCount = document.getElementById("pending-count");

const clearCompletedBtn = document.getElementById("clear-completed");
const filterButtons = document.querySelectorAll(".filter-btn");


// Task data
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentFilter = "all";


// Save tasks in localStorage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


// Add new task
todoForm.addEventListener("submit", function (event) {

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


// Display tasks
function renderTasks() {

    taskList.innerHTML = "";

    let filteredTasks = tasks.filter(function (task) {

        if (currentFilter === "pending") {
            return task.status === "pending";
        }

        if (currentFilter === "completed") {
            return task.status === "completed";
        }

        return true;
    });


    filteredTasks.forEach(function (task) {

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

        checkbox.addEventListener("change", function () {
            toggleTask(task.id);
        });


        // Task details
        const details = document.createElement("div");

        details.className = "task-details";

        const title = document.createElement("h3");
        title.textContent = task.title;

        details.appendChild(title);


        if (task.notes) {
            const notes = document.createElement("p");
            notes.textContent = task.notes;
            details.appendChild(notes);
        }


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


        // Delete button
        const actions = document.createElement("div");

        actions.className = "task-actions";

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function () {
            deleteTask(task.id);
        });


        actions.appendChild(deleteButton);


        // Add elements to task
        li.appendChild(checkbox);
        li.appendChild(details);
        li.appendChild(actions);

        taskList.appendChild(li);

    });


    // Empty message
    emptyMessage.style.display =
        filteredTasks.length === 0 ? "block" : "none";


    updateStats();
}


// Mark task as completed or pending
function toggleTask(id) {

    tasks = tasks.map(function (task) {

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


// Delete task
function deleteTask(id) {

    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });

    saveTasks();

    renderTasks();
}


// Update task counts
function updateStats() {

    const completed = tasks.filter(function (task) {
        return task.status === "completed";
    }).length;

    const pending = tasks.length - completed;

    totalCount.textContent = tasks.length + " Tasks";

    completedCount.textContent = completed + " Completed";

    pendingCount.textContent = pending + " Pending";
}


// Filter tasks
filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        filterButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentFilter = button.dataset.filter;

        renderTasks();
    });
});


// Clear all completed tasks
clearCompletedBtn.addEventListener("click", function () {

    tasks = tasks.filter(function (task) {
        return task.status !== "completed";
    });

    saveTasks();

    renderTasks();
});


// Load saved tasks when page opens
renderTasks();