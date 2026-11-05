import express from "express";
import taskRoutes from "./routes/task.routes";
import errorMiddleware from "./middleware/error.middleware";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

const app = express();

// Middleware
app.use(express.json());

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Task Routes
app.use("/tasks", taskRoutes);

// GET /health
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK"
    });
});

// GET /hello?name=Irshad
app.get("/hello", (req, res) => {
    const name = req.query.name || "Guest";

    res.status(200).json({
        message: `Hello ${name}`
    });
});

app.use(errorMiddleware);
export default app;
