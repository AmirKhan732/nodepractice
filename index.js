import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
