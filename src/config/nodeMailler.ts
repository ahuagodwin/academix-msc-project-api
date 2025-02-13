

import nodemailer from "nodemailer";
// import sgMail from "@sendgrid/mail";

interface MailData {
    to: string;
    subject: string;
    message?: string;
    html?: string;
}

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
        user: process.env.MAIL_ID,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  
    try {
      // Send the email using Nodemailer
      const mailOption = await transporter.sendMail({
        from: `ACADEMIX <${process.env.MAIL_ID}>`,
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


  
  // Utility to generate a 6-digit OTP
  export const generateOTP = (length: number = 6): string => {
    const min = Math.pow(10, length - 1); // Minimum value based on OTP length
    const max = Math.pow(10, length) - 1; // Maximum value based on OTP length
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;
    
    // Ensure OTP is always the correct length, even with leading zeros
    return otp.toString().padStart(length, '0');
  };
  