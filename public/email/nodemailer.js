"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const env_1 = require("../config/env");
const nodemailer_1 = __importDefault(require("nodemailer"));
// import sgMail from "@sendgrid/mail";
// Nodemailer configuration
const sendMail = async (data) => {
    // Extracting mail data from the request body
    const { to, subject, message, html } = data;
    // Create a transporter to send emails via SMTP
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: env_1.SMTP_MAIL_ID,
            pass: env_1.SMTP_MAIL_PASSWORD,
        },
    });
    try {
        // Send the email using Nodemailer
        const mailOption = await transporter.sendMail({
            from: `ACADEMIX <${env_1.SMTP_MAIL_ID}>`,
            to,
            subject,
            text: message,
            html,
        });
        console.log("Message sent: %s", mailOption.messageId);
        console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(mailOption));
    }
    catch (error) {
        console.error("error", error);
    }
};
exports.sendMail = sendMail;
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// export const sendMail = async (data: MailData) => {
//   const { to, subject, message, html }: MailData = data;
//   const msg = {
//     to,
//     from: `Your Name <${process.env.MAIL_ID}>`,
//     subject,
//     text: message,
//     html,
//   };
//   try {
//     await sgMail.send(msg);
//     console.log("Email sent successfully!");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };
