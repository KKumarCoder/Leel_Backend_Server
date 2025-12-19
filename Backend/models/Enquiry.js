import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "In Progress", "Resolved"],
    default: "New",
  },
  notes: [
    {
      note: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  otpVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Simple schema without problematic middleware
const Enquiry = mongoose.model("Enquiry", enquirySchema);
export default Enquiry;
