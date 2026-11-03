// ======================================
// 1. TYPES AND INTERFACES
// ======================================

type TaskStatus = "pending" | "completed";

type TaskFilter = "all" | "pending" | "completed";

interface Todo {
    id: string;
    title: string;
    notes: string;
    status: TaskStatus;
    dueDate: string;
    owner: string;
}


// ======================================
// 2. DOM ELEMENTS
// ======================================

function getElement<T extends HTMLElement>(id: string): T {

    const element = document.getElementById(id);

    if (!element) {
        throw new Error(`Element ${id} not found`);
    }

    return element as T;
}

const todoForm = getElement<HTMLFormElement>("todo-form");

const taskTitle = getElement<HTMLInputElement>("task-title");

const taskNotes = getElement<HTMLTextAreaElement>("task-notes");

const taskOwner = getElement<HTMLInputElement>("task-owner");

const dueDate = getElement<HTMLInputElement>("due-date");

const taskList = getElement<HTMLUListElement>("task-list");

const emptyMessage = getElement<HTMLDivElement>("empty-message");

const totalCount = getElement<HTMLSpanElement>("total-count");

const completedCount = getElement<HTMLSpanElement>("completed-count");

const pendingCount = getElement<HTMLSpanElement>("pending-count");

const clearCompletedBtn =
    getElement<HTMLButtonElement>("clear-completed");

const filterButtons =
    document.querySelectorAll<HTMLButtonElement>(".filter-btn");


// ======================================
// 3. LOCAL STORAGE DATA VALIDATION
// ======================================

function isTodo(value: unknown): value is Todo {

    if (typeof value !== "object" || value === null) {
        return false;
    }

    const task = value as Record<string, unknown>;

    return (
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.notes === "string" &&
        (task.status === "pending" || task.status === "completed") &&
        typeof task.dueDate === "string" &&
        typeof task.owner === "string"
    );
}


// ======================================
// 4. TASK DATA
// ======================================

function loadTasks(): Todo[] {

    const savedTasks = localStorage.getItem("tasks");

    if (savedTasks === null) {
        return [];
    }

    try {

        const parsedData: unknown = JSON.parse(savedTasks);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData.filter(isTodo);

    } catch (error: unknown) {

        console.error("Error loading tasks:", error);

        return [];
    }
}

let tasks: Todo[] = loadTasks();

let currentFilter: TaskFilter = "all";


// ======================================
// 5. SAVE TASKS
// ======================================

function saveTasks(): void {

    localStorage.setItem("tasks", JSON.stringify(tasks));

}


// ======================================
// 6. ADD TASK
// ======================================

todoForm.addEventListener("submit", (event: SubmitEvent): void => {

    event.preventDefault();

    const title = taskTitle.value.trim();

    if (title === "") {
        return;
    }

    const newTask: Todo = {

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

function renderTasks(): void {

    taskList.innerHTML = "";

    const filteredTasks = tasks.filter((task: Todo): boolean => {

        if (currentFilter === "pending") {
            return task.status === "pending";
        }

        if (currentFilter === "completed") {
            return task.status === "completed";
        }

        return true;

    });


    filteredTasks.forEach((task: Todo): void => {

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

        checkbox.addEventListener("change", (): void => {

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

        const information: string[] = [];


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

        deleteButton.addEventListener("click", (): void => {

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

function toggleTask(id: string): void {

    tasks = tasks.map((task: Todo): Todo => {

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

function deleteTask(id: string): void {

    tasks = tasks.filter((task: Todo): boolean => {

        return task.id !== id;

    });

    saveTasks();

    renderTasks();

}


// ======================================
// 10. UPDATE STATISTICS
// ======================================

function updateStats(): void {

    const completed = tasks.filter((task: Todo): boolean => {

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

function isTaskFilter(value: string | undefined): value is TaskFilter {

    return (
        value === "all" ||
        value === "pending" ||
        value === "completed"
    );

}


filterButtons.forEach((button: HTMLButtonElement): void => {

    button.addEventListener("click", (): void => {

        filterButtons.forEach((btn: HTMLButtonElement): void => {

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

clearCompletedBtn.addEventListener("click", (): void => {

    tasks = tasks.filter((task: Todo): boolean => {

        return task.status !== "completed";

    });

    saveTasks();

    renderTasks();

});


// ======================================
// 13. INITIALIZE APPLICATION
// ======================================

renderTasks();