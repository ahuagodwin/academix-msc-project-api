


import { SMTP_MAIL_ID, SMTP_MAIL_PASSWORD } from "../config/env";
import { MailData } from "@/types/types";
import nodemailer from "nodemailer";
// import sgMail from "@sendgrid/mail";

// Nodemailer configuration
export const sendMail = async (data: MailData) => {
    // Extracting mail data from the request body
    const { to, subject, message, html }: MailData = data;

    // Create a transporter to send emails via SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: SMTP_MAIL_ID,
        pass: SMTP_MAIL_PASSWORD,
      },
    });
  
    try {
      // Send the email using Nodemailer
      const mailOption = await transporter.sendMail({
        from: `ACADEMIX <${SMTP_MAIL_ID}>`,
        to,
        subject,
        text: message,
        html, 
      });
  
      console.log("Message sent: %s", mailOption.messageId);
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(mailOption));
  

    } catch (error: any) {
        console.error("error",error);
    }
  };

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