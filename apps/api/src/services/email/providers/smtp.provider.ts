import nodemailer, { Transporter } from 'nodemailer';
import { config } from '@blueprint/config';

export function createSmtpTransporter(): Transporter {
  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
    pool: true,
  });
}
