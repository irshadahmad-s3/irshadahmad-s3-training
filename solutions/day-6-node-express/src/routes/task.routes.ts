import express from "express";
import { taskSchema } from "../schemas/task.schema";

import {
    addTask,
    fetchAllTasks,
    fetchTaskById,
    modifyTask,
    removeTask
} from "../services/task.service";

const router = express.Router();

// POST /tasks - Create Task
router.post("/", (req, res) => {

    const result = taskSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues
        });
    }

    const newTask = addTask(result.data);

    return res.status(201).json({
        message: "Task created successfully",
        data: newTask
    });
});

// GET /tasks - Get All Tasks
router.get("/", (req, res) => {

    const tasks = fetchAllTasks();

    return res.status(200).json({
        message: "Tasks fetched successfully",
        data: tasks
    });
});

// GET /tasks/:id - Get Task By ID
router.get("/:id", (req, res) => {

    const id = Number(req.params.id);

    const task = fetchTaskById(id);

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

// PUT /tasks/:id - Update Task
router.put("/:id", (req, res) => {

    const id = Number(req.params.id);

    const result = taskSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: result.error.issues
        });
    }

    const updatedTask = modifyTask(id, result.data);

    if (!updatedTask) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    return res.status(200).json({
        message: "Task updated successfully",
        data: updatedTask
    });
});

// DELETE /tasks/:id - Delete Task
router.delete("/:id", (req, res) => {

    const id = Number(req.params.id);

    const deleted = removeTask(id);

    if (!deleted) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    return res.status(200).json({
        message: "Task deleted successfully"
    });
});

export default router;