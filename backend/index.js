// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const { PrismaClient } = require("@prisma/client");

// dotenv.config();

// const app = express();
// const prisma = new PrismaClient();

// app.use(cors());
// app.use(express.json());

// // Connect to database on startup
// async function connectDB() {
//   try {
//     await prisma.$connect();
//     console.log("✅ Database connected successfully!");
//   } catch (error) {
//     console.error("❌ Database connection failed:", error.message);
//     process.exit(1); // Stop app if DB is not connected
//   }
// }
// connectDB();

// // test route
// app.get("/", (req, res) => {
//   res.send("this is a node backend");
// });

// // create a user
// app.post("/api/users", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await prisma.user.create({
//       data: { email, password },
//     });
//     res.json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // get all users
// app.get("/api/users", async (req, res) => {
//   const users = await prisma.user.findMany();
//   res.json(users);
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () =>
//   console.log(`backend id running on http://localhost:${PORT}`)
// );

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API running on http://localhost:${PORT}`)
);
