import nodemailer from "nodemailer";


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

  const mailOptions = {
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to,
    subject: `You've been invited to join ${workspaceName} on TaskFlow`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaec; border-radius: 8px;">
        <h2 style="color: #333;">You've been invited!</h2>
        <p style="color: #555; line-height: 1.5;">
          <strong>${inviterName}</strong> has invited you to collaborate in the <strong>${workspaceName}</strong> workspace.
        </p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          This secure link will expire in 7 days. If you did not expect this invitation, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};