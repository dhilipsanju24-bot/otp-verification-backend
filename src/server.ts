import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import axios from "axios";
import { db } from "./firebase";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const API_KEY = process.env.TWOFACTOR_API_KEY;
console.log("2Factor API key loaded:", !!API_KEY);

// Test route
app.get("/", (req, res) => {
  res.send("OTP Backend is running!");
});

// Send OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone number are required",
      });
    }

    if (!API_KEY) {
      return res.status(500).json({
        message: "2Factor API key is not configured",
      });
    }

    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN/OTP1`
    );

    if (response.data.Status === "Success") {
      return res.status(200).json({
        message: "OTP sent successfully",
        sessionId: response.data.Details,
      });
    }

    return res.status(400).json({
      message: "Failed to send OTP",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error while sending OTP",
    });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { name, phone, otp, sessionId } = req.body;

    if (!name || !phone || !otp || !sessionId) {
      return res.status(400).json({
        message: "Name, phone, OTP and session ID are required",
      });
    }

    const response = await axios.get(
      `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`
    );

    if (response.data.Status === "Success") {
      await db.collection("users").doc(phone).set({
        name: name,
        phone: phone,
        verifiedAt: new Date().toISOString(),
      });
      return res.status(200).json({
        message: "OTP verified successfully",
      });
    }

    return res.status(400).json({
      message: "Invalid OTP",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error while verifying OTP",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
