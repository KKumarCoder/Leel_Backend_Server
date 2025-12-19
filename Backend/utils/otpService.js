import dotenv from "dotenv";
dotenv.config();

import twilio from "twilio";

// Initialize Twilio client
let client;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log("✅ Twilio client initialized");
  } else {
    console.log("⚠️ Twilio credentials missing, using development mode");
  }
} catch (error) {
  console.log("⚠️ Twilio initialization failed:", error.message);
}

// Generate OTP
export const generateOTP = () => {
  // Always generate random OTP for security
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS
export const sendOTPviaSMS = async (phone, otp) => {
  try {
    // Check if Twilio client is initialized
    if (!client) {
      // Development mode: Log OTP to console
      console.log("🔧 DEVELOPMENT MODE: Twilio not configured");
      console.log(`📱 OTP for ${phone}: ${otp}`);
      console.log("📱 In production, this would be sent via SMS");
      console.log(
        "🔧 To enable SMS: Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env"
      );
      return true;
    }

    console.log(`📱 Sending OTP via Twilio to: ${phone}`);

    const message = await client.messages.create({
      body: `Your Leela Micro Controller verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`✅ SMS sent successfully! Message SID: ${message.sid}`);
    console.log(`📱 Status: ${message.status}`);
    console.log(`📱 Price: ${message.price || "N/A"}`);

    return true;
  } catch (error) {
    console.error("❌ SMS sending failed:", error.message);
    console.error("❌ Error details:", error);

    // Don't throw error - let the controller handle it
    return false;
  }
};

// Send OTP via WhatsApp (alternative)
export const sendOTPviaWhatsApp = async (phone, otp) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`📱 [DEV WhatsApp] OTP for ${phone}: ${otp}`);
      return true;
    }

    const message = await client.messages.create({
      body: `Your Leela Micro Controller verification code is: ${otp}. Valid for 10 minutes.`,
      from: "whatsapp:+14155238886", // Twilio WhatsApp sandbox
      to: `whatsapp:${phone}`,
    });

    console.log(`✅ WhatsApp message sent! SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error("❌ WhatsApp sending failed:", error.message);
    return false;
  }
};
