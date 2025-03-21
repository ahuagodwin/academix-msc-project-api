import { Types } from "mongoose";
import { NO_REPLY_EMAIL, SMTP_MAIL_ID, SMTP_MAIL_PASSWORD } from "../config/env";
import { Notification } from "../models/notification.model";
import { User } from "../models/user.model";
import nodemailer from "nodemailer";


/**
 * Type definition for mail data
 */
interface MailData {
  userId: Types.ObjectId | string;
  email?: string;
  subject: string;
  message: string;
  type: "general" | "group" | "share" | "permission" | "access"
}

/**
 * Function to send a notification to a user
 * @param data - Object containing userId, email, subject, and message
 */
export const sendNotification = async (data: MailData): Promise<void> => {
  const { userId, message, email } = data;

  try {
    // Save notification in the database
    const notification = new Notification({ user: userId, message });
    await notification.save();

    // Optionally send an email notification
    if (!email) {
      const user = await User.findById(userId);
      data.email = user?.email || "";
    }

    if (data.email) {
      await sendEmailNotification(data);
    }

    console.log(`Notification sent to user ${userId}: ${message}`);
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Function to send an email notification
 * @param data - Object containing email, subject, and message
 */
const sendEmailNotification = async (data: MailData): Promise<void> => {
  const { email, subject, message, type } = data;

  if (!email) {
    console.warn("No email provided. Skipping email notification.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: SMTP_MAIL_ID, 
        pass: SMTP_MAIL_PASSWORD,
      },
    });

    const emailHTML = getEmailTemplate(type, message);

    await transporter.sendMail({
      from: `"ACADEMIX" <${NO_REPLY_EMAIL}>`,
      to: email,
      subject,
      text: message,
      html: emailHTML,
    });

    console.log(`Email sent to ${email}: ${message}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};



const getEmailTemplate = (type: string, message: string): string => {
  switch (type) {
    case "group":
      return  `
      <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">ACADEMIX | Group</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: justify;">${message}</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="#" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
          This is an automated message. Please do not reply.
        </p>
      </div>
    `;

    case "share":
      return  `
      <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">ACADEMIX | Shared File</h2>
        <p style="font-size: 16px; line-height: 1.5; text-align: justify;">${message}</p>
        <div style="text-align: center; margin-top: 20px;">
          <a href="#" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
          This is an automated message. Please do not reply.
        </p>
      </div>
    `;

    case "forwarded_notification":
      return  `
      <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #007bff; text-align: center;">ACADEMIX | Forwarded Notification</h2>
        <blockquote style="background: #e9ecef; padding: 10px; border-left: 4px solid #6c757d; margin: 10px 0;">${message}</blockquote>
        <div style="text-align: center; margin-top: 20px;">
          <a href="#" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">View Details</a>
        </div>
        <p style="font-size: 14px; color: #888; text-align: center; margin-top: 20px;">
          Check the details in your notification panel.
        </p>
      </div>
    `;

    default:
      return `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; color: #333; background-color: #f8f9fa; border-radius: 8px;">
          <h2 style="color: #007bff; text-align: center;">Academix</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <p>Stay updated with the latest information.</p>
        </div>
      `;
  }
};