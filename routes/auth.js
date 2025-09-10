import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto"; // you forgot to import this
import transporter from "../utils/email.js";
import nodemailer from "nodemailer";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Basic validation
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Check if phone exists
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Phone number already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    console.error(err);

    // Prisma unique constraint error handling
    if (err.code === "P2002") {
      return res.status(400).json({
        error: `Duplicate field: ${err.meta?.target?.join(", ")}`,
      });
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/getAll", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get User by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete User
router.delete("/:id", async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update User
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        email,
        phone,
        password,
      },
    });

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// login
router.post("/login", async (req, res) => {
  console.log(req.body);
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res
        .status(400)
        .json({ error: "Email or Phone and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// forget password
router.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save token in DB
    await prisma.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry },
    });

    // Create reset link
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: "Password reset email sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
