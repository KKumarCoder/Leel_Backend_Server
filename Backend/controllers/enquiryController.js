import Enquiry from "../models/Enquiry.js";
import OTP from "../models/OTP.js";
import { generateOTP, sendOTPviaSMS } from "../utils/otpService.js";
import {
  sendThankYouEmail,
  sendManagerNotification,
} from "../utils/emailService.js";

// Send OTP to phone number
export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: "Phone number is required",
      });
    }

    // Clean phone number format
    const cleanPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
    );

    // Save OTP to database
    await OTP.create({
      phone: cleanPhone,
      otp: otp,
      expiresAt: expiresAt,
    });

    console.log(`✅ OTP generated for ${cleanPhone}: ${otp}`);

    // Send OTP via SMS
    const smsSent = await sendOTPviaSMS(cleanPhone, otp);

    if (!smsSent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your phone number",
    });
  } catch (error) {
    console.error("❌ Error in sendOTP:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Verify OTP and submit enquiry
export const submitEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message, otp } = req.body;

    // Validate all fields
    if (!name || !email || !phone || !subject || !message || !otp) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Clean phone number
    const cleanPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    // Verify OTP
    const otpRecord = await OTP.findOne({
      phone: cleanPhone,
      otp: otp,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired OTP",
      });
    }

    // Check if enquiry already exists (prevent duplicates)
    const existingEnquiry = await Enquiry.findOne({
      email: email.toLowerCase(),
      phone: cleanPhone,
      subject: subject,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    });

    if (existingEnquiry) {
      return res.status(400).json({
        success: false,
        error: "Similar enquiry already submitted recently",
      });
    }

    // Create new enquiry
    const enquiry = await Enquiry.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: cleanPhone,
      subject: subject.trim(),
      message: message.trim(),
      otpVerified: true,
      status: "New",
    });

    // Remove used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send email notifications (don't block if emails fail)
    const emailResults = await Promise.allSettled([
      sendThankYouEmail(email, name),
      sendManagerNotification({
        name: name,
        email: email,
        phone: cleanPhone,
        subject: subject,
        message: message,
      }),
    ]);

    // Log email results
    if (emailResults[0].status === "fulfilled" && emailResults[0].value) {
      console.log("✅ Thank you email sent successfully");
    } else {
      console.log("⚠️ Thank you email failed to send");
    }

    if (emailResults[1].status === "fulfilled" && emailResults[1].value) {
      console.log("✅ Manager notification sent successfully");
    } else {
      console.log("⚠️ Manager notification failed to send");
    }

    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: {
        id: enquiry._id,
        name: enquiry.name,
        email: enquiry.email,
        subject: enquiry.subject,
        status: enquiry.status,
        createdAt: enquiry.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in submitEnquiry:", error);

    // Check for validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(", "),
      });
    }

    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate enquiry detected",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get all enquiries for dashboard
export const getEnquiries = async (req, res) => {
  try {
    const {
      status,
      search,
      sort = "-createdAt",
      page = 1,
      limit = 50,
    } = req.query;

    // Build filter
    let filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get enquiries with filters
    const enquiries = await Enquiry.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Get total count for pagination
    const total = await Enquiry.countDocuments(filter);

    // Get counts by status
    const statusCounts = {
      New: await Enquiry.countDocuments({ status: "New" }),
      Contacted: await Enquiry.countDocuments({ status: "Contacted" }),
      "In Progress": await Enquiry.countDocuments({ status: "In Progress" }),
      Resolved: await Enquiry.countDocuments({ status: "Resolved" }),
      Total: total,
    };

    res.status(200).json({
      success: true,
      count: enquiries.length,
      total: total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      statusCounts: statusCounts,
      data: enquiries,
    });
  } catch (error) {
    console.error("❌ Error in getEnquiries:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get single enquiry by ID
export const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: "Enquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error("❌ Error in getEnquiryById:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Update enquiry (status, notes, etc.)
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    // Find enquiry
    const enquiry = await Enquiry.findById(id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: "Enquiry not found",
      });
    }

    // Update status if provided
    if (
      status &&
      ["New", "Contacted", "In Progress", "Resolved"].includes(status)
    ) {
      enquiry.status = status;
    }

    // Add note if provided
    if (note && note.trim()) {
      enquiry.notes.push({
        note: note.trim(),
        createdAt: new Date(),
      });
    }

    // Save changes
    await enquiry.save();

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: enquiry,
    });
  } catch (error) {
    console.error("❌ Error in updateEnquiry:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Delete enquiry (optional)
export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        error: "Enquiry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error in deleteEnquiry:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
