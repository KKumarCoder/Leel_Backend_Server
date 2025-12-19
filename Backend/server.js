import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import enquiryRoutes from "./routes/enquiryRoutes.js";

// Load environment variables FIRST, before any other imports
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:5000",
      "https://leel-backend-server.onrender.com/api/enquiries",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/enquiries", enquiryRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Leela Micro Controller API",
    version: "1.0.0",
    database: "Connected",
    environment: process.env.NODE_ENV || "development",
  });
});

// API documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Leela Micro Controller API",
    endpoints: {
      health: "GET /health",
      sendOTP: "POST /api/enquiries/send-otp",
      submitEnquiry: "POST /api/enquiries/submit",
      getEnquiries: "GET /api/enquiries",
      getEnquiry: "GET /api/enquiries/:id",
      updateEnquiry: "PUT /api/enquiries/:id",
      deleteEnquiry: "DELETE /api/enquiries/:id",
    },
    examples: {
      sendOTP: {
        method: "POST",
        url: "/api/enquiries/send-otp",
        body: { phone: "+918340202627" },
      },
      submitEnquiry: {
        method: "POST",
        url: "/api/enquiries/submit",
        body: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+918340202627",
          subject: "Product Inquiry",
          message: "Need details about your products",
          otp: "123456",
        },
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("\n🚀 =================================");
  console.log("🚀 Leela Micro Controller Backend");
  console.log("🚀 =================================");
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API Base: http://localhost:${PORT}/api/enquiries`);
  console.log(
    `✅ MongoDB: ${process.env.MONGODB_URI ? "Configured" : "Not configured"}`
  );
  console.log(
    `✅ Twilio: ${
      process.env.TWILIO_ACCOUNT_SID ? "Configured" : "Not configured"
    }`
  );
  console.log(
    `✅ Email: ${process.env.SMTP_USER ? "Configured" : "Not configured"}`
  );
  console.log("🚀 =================================\n");
});
