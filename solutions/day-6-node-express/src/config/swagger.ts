import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Task Management API",
            description: "API for checking service health and managing tasks.",
            version: "1.0.0"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development server"
            }
        ],
        tags: [
            { name: "General", description: "Service information" },
            { name: "Tasks", description: "Task management operations" }
        ],
        components: {
            schemas: {
                Task: {
                    type: "object",
                    required: ["id", "title", "notes", "status", "dueDate", "owner"],
                    properties: {
                        id: { type: "integer", example: 1 },
                        title: { type: "string", minLength: 1, example: "Prepare report" },
                        notes: { type: "string", example: "Quarterly summary" },
                        status: {
                            type: "string",
                            enum: ["pending", "in-progress", "completed"],
                            example: "pending"
                        },
                        dueDate: { type: "string", minLength: 1, example: "2026-12-01" },
                        owner: { type: "string", minLength: 1, example: "Irshad" }
                    }
                },
                TaskInput: {
                    type: "object",
                    required: ["title", "notes", "status", "dueDate", "owner"],
                    properties: {
                        title: { type: "string", minLength: 1, example: "Prepare report" },
                        notes: { type: "string", example: "Quarterly summary" },
                        status: {
                            type: "string",
                            enum: ["pending", "in-progress", "completed"],
                            example: "pending"
                        },
                        dueDate: { type: "string", minLength: 1, example: "2026-12-01" },
                        owner: { type: "string", minLength: 1, example: "Irshad" }
                    }
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string", example: "Task not found" }
                    }
                },
                ValidationError: {
                    type: "object",
                    required: ["message", "errors"],
                    properties: {
                        message: { type: "string", example: "Validation failed" },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    code: { type: "string", example: "too_small" },
                                    message: { type: "string", example: "Title is required" },
                                    path: { type: "array", items: { type: "string" }, example: ["title"] }
                                },
                                additionalProperties: true
                            }
                        }
                    },
                    example: {
                        message: "Validation failed",
                        errors: [{ code: "too_small", message: "Title is required", path: ["title"] }]
                    }
                }
            }
        },
        paths: {
            "/health": {
                get: {
                    tags: ["General"],
                    summary: "Check service health",
                    description: "Returns the current health status.",
                    responses: {
                        "200": {
                            description: "Service is healthy",
                            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", example: "OK" } }, example: { status: "OK" } } } }
                        },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                }
            },
            "/hello": {
                get: {
                    tags: ["General"],
                    summary: "Get a greeting",
                    description: "Returns a greeting for the supplied name, or Guest when omitted.",
                    parameters: [{ in: "query", name: "name", required: false, schema: { type: "string" }, example: "Irshad", description: "Name to greet" }],
                    responses: {
                        "200": { description: "Greeting returned", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Hello Irshad" } } }, examples: { named: { value: { message: "Hello Irshad" } }, default: { value: { message: "Hello Guest" } } } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                }
            },
            "/tasks": {
                post: {
                    tags: ["Tasks"], summary: "Create a task", description: "Creates a task after validating all required fields.",
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TaskInput" }, example: { title: "Prepare report", notes: "Quarterly summary", status: "pending", dueDate: "2026-12-01", owner: "Irshad" } } } },
                    responses: {
                        "201": { description: "Task created", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } }, example: { message: "Task created successfully", data: { id: 1, title: "Prepare report", notes: "Quarterly summary", status: "pending", dueDate: "2026-12-01", owner: "Irshad" } } } } },
                        "400": { description: "Request body failed Zod validation", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                },
                get: {
                    tags: ["Tasks"], summary: "List tasks", description: "Returns all tasks currently in memory.",
                    responses: {
                        "200": { description: "Tasks returned", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, data: { type: "array", items: { $ref: "#/components/schemas/Task" } } } }, example: { message: "Tasks fetched successfully", data: [{ id: 1, title: "Prepare report", notes: "Quarterly summary", status: "pending", dueDate: "2026-12-01", owner: "Irshad" }] } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                }
            },
            "/tasks/{id}": {
                parameters: [{ in: "path", name: "id", required: true, description: "Numeric task ID", schema: { type: "integer", minimum: 1 }, example: 1 }],
                get: {
                    tags: ["Tasks"], summary: "Get a task", description: "Returns the task with the specified ID.",
                    responses: {
                        "200": { description: "Task returned", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } }, example: { message: "Task fetched successfully", data: { id: 1, title: "Prepare report", notes: "Quarterly summary", status: "pending", dueDate: "2026-12-01", owner: "Irshad" } } } } },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Task not found" } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                },
                put: {
                    tags: ["Tasks"], summary: "Update a task", description: "Replaces the task fields after validating all required fields.",
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TaskInput" }, example: { title: "Prepare final report", notes: "Include summary", status: "in-progress", dueDate: "2026-12-02", owner: "Irshad" } } } },
                    responses: {
                        "200": { description: "Task updated", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string" }, data: { $ref: "#/components/schemas/Task" } } }, example: { message: "Task updated successfully", data: { id: 1, title: "Prepare final report", notes: "Include summary", status: "in-progress", dueDate: "2026-12-02", owner: "Irshad" } } } } },
                        "400": { description: "Request body failed Zod validation", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Task not found" } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                },
                delete: {
                    tags: ["Tasks"], summary: "Delete a task", description: "Deletes the task with the specified ID.",
                    responses: {
                        "200": { description: "Task deleted", content: { "application/json": { schema: { type: "object", properties: { message: { type: "string", example: "Task deleted successfully" } } }, example: { message: "Task deleted successfully" } } } },
                        "404": { description: "Task not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { message: "Task not found" } } } },
                        "500": { description: "Internal server error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" }, example: { success: false, message: "Internal Server Error" } } } }
                    }
                }
            }
        }
    },
    apis: []
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
