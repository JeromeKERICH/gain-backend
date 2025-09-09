const express = require("express");
const { Resend } = require("resend");

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

// Admin notification template
const adminEmailTemplate = (name, email, company, subject, message) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #143E37 0%, #0A1F44 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-item {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .detail-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        .label {
            font-weight: 600;
            color: #143E37;
            display: block;
            margin-bottom: 5px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
        }
        .message-box {
            background-color: #f8f9fa;
            border-left: 4px solid #143E37;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">GAIN Summit</div>
            <h1>New Contact Form Submission</h1>
        </div>
        
        <div class="content">
            <p>You have received a new message through the GAIN Summit contact form:</p>
            
            <div class="details">
                <div class="detail-item">
                    <span class="label">Subject</span>
                    <span>${subject}</span>
                </div>
                <div class="detail-item">
                    <span class="label">From</span>
                    <span>${name} &lt;${email}&gt;</span>
                </div>
                <div class="detail-item">
                    <span class="label">Company</span>
                    <span>${company || "Not provided"}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Date</span>
                    <span>${new Date().toLocaleString()}</span>
                </div>
            </div>
            
            <div>
                <span class="label">Message</span>
                <div class="message-box">
                    ${message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <p>Please respond to this inquiry within 24-48 hours.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the GAIN Summit contact form system.</p>
            <p>© ${new Date().getFullYear()} GAIN Summit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

// Auto-reply template
const autoReplyTemplate = (name) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We've Received Your Message</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #143E37 0%, #0A1F44 100%);
            padding: 30px 20px;
            text-align: center;
            color: white;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .thank-you {
            text-align: center;
            margin-bottom: 30px;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .next-steps {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        .step-number {
            
            color: white;
            
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            flex-shrink: 0;
            font-weight: bold;
        }
        .contact-info {
            background-color: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">GAIN Summit</div>
            <h1>Thank You for Contacting Us</h1>
        </div>
        
        <div class="content">
            <div class="thank-you">
            
                <h2>Hello ${name},</h2>
                <p>We've successfully received your message and will get back to you shortly.</p>
            </div>
            
            <div class="next-steps">
                <h3>What happens next?</h3>
                
                <div class="step">
                    <div class="step-number">1</div>
                    <div>
                        <strong>Review</strong>
                        <p>Our team will review your inquiry and route it to the appropriate department.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">2</div>
                    <div>
                        <strong>Response</strong>
                        <p>You'll receive a personalized response from our team within 24-48 hours.</p>
                    </div>
                </div>
                
                <div class="step">
                    <div class="step-number">3</div>
                    <div>
                        <strong>Follow-up</strong>
                        <p>If needed, we'll schedule a call or meeting to discuss your inquiry in detail.</p>
                    </div>
                </div>
            </div>
            
            <div class="contact-info">
                <h3>Need immediate assistance?</h3>
                <p>For urgent matters, you can reach us directly:</p>
                <p><strong>Phone:</strong> +971 58 100 9603</p>
                <p><strong>Email:</strong> contact@gulfafricanexus.com</p>
            </div>
            
            <p>We appreciate your interest in the GAIN Summit and look forward to assisting you.</p>
        </div>
        
        <div class="footer">
            <p>This is an automated response. Please do not reply to this email.</p>
            <p>© ${new Date().getFullYear()} GAIN Summit. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

router.post("/", async (req, res) => {
  const { name, email, company, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Send email to admin
    await resend.emails.send({
      from: `GAIN Summit <${process.env.RESEND_SENDER_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Contact Form: ${subject}`,
      html: adminEmailTemplate(name, email, company, subject, message),
    });

    // Auto-reply to the sender
    await resend.emails.send({
      from: `GAIN Summit <${process.env.RESEND_SENDER_EMAIL}>`,
      to: email,
      subject: "We've received your message - GAIN Summit",
      html: autoReplyTemplate(name),
    });

    res.json({ success: true, message: "Message sent successfully!" });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;