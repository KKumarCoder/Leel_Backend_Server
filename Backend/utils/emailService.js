import nodemailer from "nodemailer";

// Lazy initialization of transporter
let transporter = null;
let emailConfigValid = false;

const getTransporter = () => {
  if (!transporter) {
    // Check if email credentials are properly configured
    const hasValidCredentials =
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SENDER_EMAIL;

    if (!hasValidCredentials) {
      console.log(
        "⚠️ Email credentials not configured, using development mode"
      );
      emailConfigValid = false;
      return null;
    }

    try {
      // Debug: Log environment variables when transporter is created
      console.log("🔍 Email Transporter Creation Debug:");
      console.log("SMTP_HOST:", process.env.SMTP_HOST);
      console.log("SMTP_PORT:", process.env.SMTP_PORT);
      console.log("SMTP_USER:", process.env.SMTP_USER);
      console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***" : "Not set");
      console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Test email configuration asynchronously but don't wait for it
      transporter.verify((error, success) => {
        if (error) {
          console.error("❌ Email configuration error:", error.message);
          emailConfigValid = false;
        } else {
          console.log("✅ Email server is ready to send messages");
          emailConfigValid = true;
        }
      });

      emailConfigValid = true;
    } catch (error) {
      console.error("❌ Failed to create email transporter:", error.message);
      emailConfigValid = false;
      transporter = null;
    }
  }
  return transporter;
};

// Send thank you email to user
export const sendThankYouEmail = async (userEmail, userName) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(
        `📧 [ERROR] Email transporter not available for: ${userEmail}`
      );
      return false; // Return false to indicate failure
    }

    const mailOptions = {
      from: `"Leela Micro Controller" <${process.env.SENDER_EMAIL}>`,
      to: userEmail,
      subject: "Thank You for Your Enquiry - Leela Micro Controller",
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Thank You for Your Enquiry</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .highlight { background: #e8f4fd; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Thank You, ${userName}!</h1>
                        <p>We've received your enquiry</p>
                    </div>
                    <div class="content">
                        <p>Dear ${userName},</p>
                        <p>Thank you for submitting your enquiry to <strong>Leela Micro Controller</strong>.</p>
                        
                        <div class="highlight">
                            <p>Our support team has been notified and will review your enquiry shortly.</p>
                            <p>We aim to respond to all enquiries within <strong>24-48 hours</strong>.</p>
                        </div>
                        
                        <p>If you have any additional information to share or questions in the meantime, feel free to reply to this email.</p>
                        
                        <p>For urgent enquiries, you can also contact us directly at:</p>
                        <ul>
                            <li>📞 Phone: +91-XXXXXXXXXX</li>
                            <li>📧 Email: support@leelamicro.com</li>
                        </ul>
                        
                        <p>Best Regards,</p>
                        <p><strong>The Leela Micro Controller Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} Leela Micro Controller. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Thank you email sent to: ${userEmail}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending thank you email:", error.message);
    console.error("❌ Email details:", error);
    return false; // Return false to indicate failure
  }
};

// Send notification email to manager
export const sendManagerNotification = async (enquiryData) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(
        `📧 [ERROR] Email transporter not available for manager notification`
      );
      return false; // Return false to indicate failure
    }

    const mailOptions = {
      from: `"Leela Enquiry System" <${process.env.SENDER_EMAIL}>`,
      to: process.env.MANAGER_EMAIL,
      subject: `📢 NEW ENQUIRY: ${enquiryData.subject.substring(0, 50)}...`,
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Enquiry Alert</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px; }
                        .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }
                        .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .info-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; }
                        .info-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
                        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
                        .button { display: inline-block; padding: 12px 25px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
                        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>🚨 NEW CUSTOMER ENQUIRY RECEIVED</h2>
                        <p>Action Required: Please review and respond</p>
                    </div>
                    <div class="content">
                        <div class="highlight">
                            <p><strong>⏰ Time Received:</strong> ${new Date().toLocaleString()}</p>
                            <p><strong>🔢 Status:</strong> <span style="color: #dc3545; font-weight: bold;">NEW - Pending Response</span></p>
                        </div>
                        
                        <h3>Customer Details:</h3>
                        <table class="info-table">
                            <tr>
                                <th>Name</th>
                                <td>${enquiryData.name}</td>
                            </tr>
                            <tr>
                                <th>Email</th>
                                <td><a href="mailto:${enquiryData.email}">${
        enquiryData.email
      }</a></td>
                            </tr>
                            <tr>
                                <th>Phone</th>
                                <td><a href="tel:${enquiryData.phone}">${
        enquiryData.phone
      }</a></td>
                            </tr>
                            <tr>
                                <th>Subject</th>
                                <td><strong>${enquiryData.subject}</strong></td>
                            </tr>
                            <tr>
                                <th>Message</th>
                                <td>${enquiryData.message}</td>
                            </tr>
                        </table>
                        
                        <h3>📋 Quick Actions:</h3>
                        <p>
                            <a href="mailto:${enquiryData.email}?subject=Re: ${
        enquiryData.subject
      }" class="button">📧 Reply to Customer</a>
                            <a href="tel:${
                              enquiryData.phone
                            }" class="button" style="background: #17a2b8;">📞 Call Customer</a>
                            <a href="http://localhost:5173/dashboard" class="button" style="background: #6f42c1;">📊 View in Dashboard</a>
                        </p>
                        
                        <h3>📝 Notes:</h3>
                        <ul>
                            <li>Please respond within 24 hours</li>
                            <li>Update status in dashboard after contacting</li>
                            <li>Add notes for any follow-up required</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from Leela Micro Controller Enquiry System</p>
                        <p>Generated at: ${new Date().toLocaleString()}</p>
                    </div>
                </body>
                </html>
            `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Manager notification email sent");
    return true;
  } catch (error) {
    console.error("❌ Error sending manager notification:", error.message);
    console.error("❌ Email details:", error);
    return false; // Return false to indicate failure
  }
};
