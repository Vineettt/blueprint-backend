import { Transporter } from 'nodemailer';
import { createSmtpTransporter } from './providers/smtp.provider';
import { config } from '@blueprint/config';

export type EmailProvider = 'smtp' | 'ses';

export function createTransporter(): Transporter {
  const provider = config.email.provider;

  switch (provider) {
    case 'ses': {
      try {
        const { createSesTransporter } = require('./providers/ses.provider');
        return createSesTransporter();
      } catch {
        throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-ses');
      }
    }

    case 'smtp':
    default:
      return createSmtpTransporter();
  }
}
