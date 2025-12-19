import express from "express";
import {
  sendOTP,
  submitEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/enquiryController.js";

const router = express.Router();

// OTP routes
router.post("/send-otp", sendOTP);
router.post("/submit", submitEnquiry);

// Dashboard routes
router.get("/", getEnquiries);
router.get("/:id", getEnquiryById);
router.put("/:id", updateEnquiry);
router.delete("/:id", deleteEnquiry);

export default router;
