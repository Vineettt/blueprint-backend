import nodemailer, { Transporter } from 'nodemailer';
import { config } from '@blueprint/config';

export function createSesTransporter(): Transporter {
  try {
    const { SESClient } = require('@aws-sdk/client-ses');

    const ses = new SESClient({
      region: config.email.ses.region,
      credentials: {
        accessKeyId: config.email.ses.accessKeyId,
        secretAccessKey: config.email.ses.secretAccessKey,
      },
    });

    return nodemailer.createTransport({
      SES: { ses },
    } as unknown as Transporter);
  } catch {
    throw new Error('AWS SDK not installed. Run: npm install @aws-sdk/client-ses');
  }
}
