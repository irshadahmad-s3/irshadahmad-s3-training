import { Task } from "../types/task.types";

import {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
} from "../repositories/task.repository";

// Create Task
export const addTask = (taskData: Omit<Task, "id">): Task => {
    return createTask(taskData);
};

// Get All Tasks
export const fetchAllTasks = (): Task[] => {
    return getAllTasks();
};

// Get Task By ID
export const fetchTaskById = (id: number): Task | undefined => {
    return getTaskById(id);
};

// Update Task
export const modifyTask = (
    id: number,
    taskData: Omit<Task, "id">
): Task | undefined => {
    return updateTask(id, taskData);
};

// Delete Task
export const removeTask = (id: number): boolean => {
    return deleteTask(id);
};