export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendAccountActivationEmail(email: string, activationToken: string): Promise<void>;
  sendWelcomeEmail(name: string, email: string): Promise<void>;
}
