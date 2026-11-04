import express from "express";
import { Task } from "../types/task.types";
import { taskSchema } from "../schemas/task.schema";

const router = express.Router();

// Temporary in-memory storage
let tasks: Task[] = [];
let nextId = 1;
// POST /tasks - Create a new task
router.post("/", (req, res) => {

    // Validate incoming data
    const result = taskSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues
        });
    }

    // Create new task
    const newTask: Task = {
        id: nextId++,
        ...result.data
    };

    // Store task in memory
    tasks.push(newTask);

    return res.status(201).json({
        message: "Task created successfully",
        data: newTask
    });
});
// GET /tasks - Get all tasks
router.get("/", (req, res) => {

    return res.status(200).json({
        message: "Tasks fetched successfully",
        data: tasks
    });

});
// GET /tasks/:id - Get task by ID
router.get("/:id", (req, res) => {

    const id = Number(req.params.id);

    const task = tasks.find((task) => task.id === id);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    return res.status(200).json({
        message: "Task fetched successfully",
        data: task
    });
});
// PUT /tasks/:id - Update an existing task
router.put("/:id", (req, res) => {

    const id = Number(req.params.id);

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    const result = taskSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues
        });
    }

    tasks[taskIndex] = {
        id,
        ...result.data
    };

    return res.status(200).json({
        message: "Task updated successfully",
        data: tasks[taskIndex]
    });
});
// DELETE /tasks/:id - Delete a task
router.delete("/:id", (req, res) => {

    const id = Number(req.params.id);

    const taskIndex = tasks.findIndex((task) => task.id === id);

    if (taskIndex === -1) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    tasks.splice(taskIndex, 1);

    return res.status(200).json({
        message: "Task deleted successfully"
    });
});
export default router;