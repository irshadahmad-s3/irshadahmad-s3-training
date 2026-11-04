import { z } from "zod";

export const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    notes: z.string(),
    status: z.enum(["pending", "in-progress", "completed"]),
    dueDate: z.string().min(1, "Due date is required"),
    owner: z.string().min(1, "Owner is required")
});