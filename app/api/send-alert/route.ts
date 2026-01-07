import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, type, message } = await request.json();

    // Configure the transporter
    // NOTE: Use environment variables for these in production!
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "YOUR_GMAIL_ADDRESS@gmail.com",
        pass: "YOUR_GMAIL_APP_PASSWORD", // Generate this in Google Account > Security > App Passwords
      },
    });

    const mailOptions = {
      from: '"SmartDB Alert" <noreply@smartdb.com>',
      to: email,
      subject: `URGENT: ${type} Alert`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px;">
          <h2 style="color: #e11d48;">Smart Distribution Board Alert</h2>
          <p><strong>Alert Type:</strong> ${type}</p>
          <p>${message}</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">Please check your dashboard immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
