import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
    },
  });
};

export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email and message",
      });
    }

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `${name} <${email}>`,
      to: process.env.CONTACT_EMAIL_RECIPIENT,
      subject: subject,
      text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message:
        ${message}
      `,
      html: `
        <div>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject || "No Subject"}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        </div>
      `,
    });

    console.log("Message sent:", info.messageId);
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};

/**
 * Send newsletter subscription email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }

    const transporter = createTransporter();

    // Send confirmation email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Gaana Nritya Academy" <no-reply@gaananritya.com>',
      to: email,
      subject: "Newsletter Subscription Confirmation",
      text: `
        Thank you for subscribing to the Gaana Nritya Academy newsletter!

        You will now receive updates about our events, classes, and other news.

        If you did not request this subscription, please ignore this email.
      `,
      html: `
        <div>
          <h2>Thank you for subscribing!</h2>
          <p>You will now receive updates about our events, classes, and other news from Gaana Nritya Academy.</p>
          <p>If you did not request this subscription, please ignore this email.</p>
        </div>
      `,
    });

    console.log("Subscription confirmation sent:", info.messageId);
    return res.status(200).json({
      success: true,
      message: "Subscription successful",
    });
  } catch (error) {
    console.error("Error sending subscription email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process subscription",
      error: error.message,
    });
  }
};

/**
 * Legacy function for backward compatibility
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const submitContactForm = sendContactEmail;