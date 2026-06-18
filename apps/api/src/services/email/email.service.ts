import { injectable } from 'tsyringe';
import { logger } from '@blueprint/logger';
import { EmailTemplates } from './templates';
import { Transporter } from 'nodemailer';
import { config } from '@blueprint/config';
import { IEmailService, EmailOptions } from '@interfaces/services/email.service.interface';
import { createTransporter } from './transport.factory';

@injectable()
export class EmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = this.createDefaultTransporter();
  }

  private createDefaultTransporter(): Transporter {
    return createTransporter();
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    if (!config.email.enabled) {
      logger.warn('Email sending disabled', {
        to: options.to,
        subject: options.subject,
      });
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      logger.info('Email sent successfully', {
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.email.frontendUrl}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: email,
      subject: 'blueprint - Password Reset',
      html: EmailTemplates.getPasswordResetTemplate({ resetUrl, email }),
    });
  }

  async sendAccountActivationEmail(email: string, activationToken: string): Promise<void> {
    const activationUrl = `${config.email.frontendUrl}/activate-account?token=${activationToken}`;

    await this.sendEmail({
      to: email,
      subject: 'blueprint - Account Activation',
      html: EmailTemplates.getAccountActivationTemplate({ activationUrl, email }),
    });
  }

  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'blueprint - Welcome',
      html: EmailTemplates.getWelcomeTemplate({ name, email }),
    });
  }
}
