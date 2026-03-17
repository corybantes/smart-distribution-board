import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  // 1. SECURE THE ROUTE WITH YOUR API KEY
  // The cron job (triggerAlert) sends this exact key in the headers
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = process.env.SMART_DB_API_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    console.warn("Blocked unauthorized email attempt!");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, type, message } = await request.json();

    // 2. Validate inputs to prevent blank spam emails
    if (!email || !type || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 3. Configure the transporter using Environment Variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"EnerGenius Alert" <noreply@energenius.com>', // I updated this to match your project name!
      to: email,
      subject: `URGENT: ${type} Alert`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #e11d48; margin-top: 0;">Smart Distribution Board Alert</h2>
          <p><strong>Alert Type:</strong> <span style="text-transform: capitalize;">${type}</span></p>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
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
      { status: 500 },
    );
  }
}
