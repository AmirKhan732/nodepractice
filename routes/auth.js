import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { otpStore } from "./otpStore.js";

const router = express.Router();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }, 
});

// create otp to create user
router.post("/create-otp", async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ error: "Email and phone are required" });
    }

    // Check if already registered
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ error: "Phone already in use" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    await transporter.sendMail({
      from: `"node-practice" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1b1a1aff;border-radius: 25px;">
      <h2 style="color: #4CAF50;">Welcome to Node-Practice </h2>
      <p style="color: #fff;">Hello,</p>
      <p style="color: #fff;">We received a request to register your account. Please use the following One-Time Password (OTP) to complete your registration:</p>
      <p style="font-size: 22px; font-weight: bold; color: #fff; letter-spacing: 3px; text-align: center;">
        ${otp}
      </p>
      <p style="color: #fff;">This code will <b>expire in 10 minutes</b>. If you did not request this, you can safely ignore this email.</p>
      <br/>
      <p style="font-size: 12px; color: #777;">Thank you,<br/>The Node-Practice Team</p>
    </div>
  `,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create OTP" });
  }
});

// verify otp and create user
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !phone || !password || !otp) {
      return res.status(400).json({ error: "All fields and OTP are required" });
    }

    // Get OTP data first
    const otpData = otpStore[email];
    console.log("Stored OTP:", otpData?.otp, "Provided OTP:", otp);

    if (!otpData) return res.status(400).json({ error: "OTP not found" });

    if (otpData.expiresAt < Date.now()) {
      delete otpStore[email];
      return res.status(400).json({ error: "OTP expired" });
    }

    if (otpData.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, phone, password: hashedPassword },
    });

    // ✅ Remove OTP after success
    delete otpStore[email];

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error("Register error:", err);

    // Prisma unique constraint error
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0]; // which field is duplicate
      return res.status(400).json({
        error: `${field} is already in use`,
      });
    }

    // Validation errors
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors,
      });
    }

    // Default error
    return res.status(500).json({
      error: "Failed to register user",
      details: err.message,
    });
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

export default router;
