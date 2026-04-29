import nodemailer from 'nodemailer';
import { config } from '../config';

const hasSmtp = !!(config.smtp.host && config.smtp.user && config.smtp.pass);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: { user: config.smtp.user, pass: config.smtp.pass }
    })
  : null;

export async function sendEmail(to: string, subject: string, text: string, attachments: any[] = []) {
  if (!transporter) {
    console.log('[EMAIL-DEV]', { to, subject, text, attachments: attachments.map((a) => a.filename) });
    return;
  }

  await transporter.sendMail({ from: config.smtp.from, to, subject, text, attachments });
}
