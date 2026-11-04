export interface Task {
    id: number;
    title: string;
    notes: string;
    status: "pending" | "in-progress" | "completed";
    dueDate: string;
    owner: string;
}