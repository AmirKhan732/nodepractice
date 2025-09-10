import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,  // ✅ from .env
    pass: process.env.EMAIL_PASS,  // ✅ from .env
  },
});

export default transporter;
