import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { WorkspaceInviteEmail } from "../emails/WorkspaceInvite"; 
import { DocumentInviteEmail } from "../emails/DocumentInvite";
import { WelcomeEmail } from "../emails/WelcomeEmail";
import React from "react";


console.log("--- CHECKING EMAIL CREDENTIALS ---");
console.log("User:", process.env.SMTP_USER);
console.log("Pass is present:", !!process.env.SMTP_PASS);
console.log("----------------------------------");




// Configure your SMTP server (You will put these in your .env file)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Use an "App Password" if using Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendInviteEmail = async (to: string, inviterName: string, workspaceName: string, token: string) => {
  // The magic link they will click!
  const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/invite?token=${token}`;

  // 🟢 1. Render the React component into an HTML string
  const emailHtml = await render(
    React.createElement(WorkspaceInviteEmail, {
      inviterName,
      workspaceName,
      inviteLink,
    })
  );

  const mailOptions = {
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: `You've been invited to join ${workspaceName} on TaskFlow`,
    html: emailHtml, // 🟢 2. Pass the compiled HTML to Nodemailer!
  };

  await transporter.sendMail(mailOptions);
};





// 🟢 THE NEW DOCUMENT INVITE SERVICE
export const sendDocumentInviteEmail = async (
  to: string,
  inviterName: string,
  documentTitle: string,
  workspaceId: string,
  docId: string,
  accessLevel: string,
  isNewUser: boolean
) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  
  // If they are new, send them to signup. If existing, send them straight to the doc!
  const actionLink = isNewUser 
    ? `${baseUrl}/signup` 
    : `${baseUrl}/dashboard/${workspaceId}/docs/${docId}`;

  const subject = isNewUser 
    ? `${inviterName} invited you to join TaskFlow` 
    : `${inviterName} shared a document with you`;

  const emailHtml = await render(
    React.createElement(DocumentInviteEmail, {
      inviterName,
      documentTitle,
      accessLevel,
      isNewUser,
      actionLink,
    })
  );

  // 3. Send it!
  const mailOptions = {
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: emailHtml, 
  };

  await transporter.sendMail(mailOptions);
};


export const sendWelcomeEmail = async (to: string, userName: string) => {
  const dashboardLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`;

  const emailHtml = await render(
    React.createElement(WelcomeEmail, {
      userName,
      dashboardLink,
    })
  );

  const mailOptions = {
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to TaskFlow! 🎉",
    html: emailHtml,
  };

  await transporter.sendMail(mailOptions);
};