import { Task } from "../types/task.types";

// In-memory storage
let tasks: Task[] = [];
let nextId = 1;

// Create a new task
export const createTask = (taskData: Omit<Task, "id">): Task => {

    const newTask: Task = {
        id: nextId++,
        ...taskData
    };

    tasks.push(newTask);

    return newTask;
};

// Get all tasks
export const getAllTasks = (): Task[] => {
    return tasks;
};

// Get task by ID
export const getTaskById = (id: number): Task | undefined => {

    return tasks.find(task => task.id === id);
};

// Update task
export const updateTask = (
    id: number,
    taskData: Omit<Task, "id">
): Task | undefined => {

    const index = tasks.findIndex(task => task.id === id);

    if (index === -1) {
        return undefined;
    }

    tasks[index] = {
        id,
        ...taskData
    };

    return tasks[index];
};

// Delete task
export const deleteTask = (id: number): boolean => {

    const index = tasks.findIndex(task => task.id === id);

    if (index === -1) {
        return false;
    }

    tasks.splice(index, 1);

    return true;
};