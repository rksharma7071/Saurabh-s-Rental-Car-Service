import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in backend/.env (see .env.example)."
    );
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: parseInt(SMTP_PORT, 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}


export async function sendReceiptEmail({ to, subject, text, pdfBuffer, pdfFilename }) {
  const t = getTransporter();
  const fromAddress = process.env.FROM_EMAIL || process.env.SMTP_USER;
  const fromName = process.env.BUSINESS_NAME || "Saurabh's Rental Car Service";

  return t.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject,
    text,
    attachments: pdfBuffer
      ? [{ filename: pdfFilename || "receipt.pdf", content: pdfBuffer, contentType: "application/pdf" }]
      : [],
  });
}
