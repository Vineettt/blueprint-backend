export interface EmailTemplateOptions {
  resetUrl?: string;
  email?: string;
  activationUrl?: string;
  name?: string;
}

export class EmailTemplates {
  static getPasswordResetTemplate(options: EmailTemplateOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>blueprint - Password Reset</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 500;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 blueprint</div>
              <h1>Password Reset</h1>
            </div>
            <p>Hello${options.name ? `, ${options.name}` : ''},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${options.resetUrl}" class="button">Reset Password</a>
            </div>
            <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
            <p>This link will expire in <strong>10 minutes</strong>.</p>
            <p style="margin-top: 20px;">If button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${options.resetUrl}" class="link">${options.resetUrl}</a></p>
            <div class="footer">
              <p>© 2024 blueprint. All rights reserved.</p>
              <p>This is an automated message. Please don't reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getAccountActivationTemplate(options: EmailTemplateOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>blueprint - Account Activation</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-weight: 500;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 blueprint</div>
              <h1>Account Activation</h1>
            </div>
            <p>Hello${options.name ? `, ${options.name}` : ''},</p>
            <p>Welcome to blueprint! Click the button below to activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${options.activationUrl}" class="button">Activate Account</a>
            </div>
            <p style="margin-top: 20px;">This link will expire in <strong>24 hours</strong>.</p>
            <p style="margin-top: 20px;">If you didn't create an account, please ignore this email.</p>
            <p style="margin-top: 20px;">If button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${options.activationUrl}" class="link">${options.activationUrl}</a></p>
            <div class="footer">
              <p>© 2024 blueprint. All rights reserved.</p>
              <p>This is an automated message. Please don't reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  static getWelcomeTemplate(options: EmailTemplateOptions): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>blueprint - Welcome</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8f9fa;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
            }
            .welcome-text {
              font-size: 18px;
              color: #28a745;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 blueprint</div>
              <h1>Welcome to blueprint!</h1>
            </div>
            <div class="welcome-text">
              <p>Hi${options.name ? `, ${options.name}` : ''},</p>
              <p>Your account has been successfully created and is ready to use.</p>
              <p>We're excited to have you join our platform!</p>
            </div>
            <div class="footer">
              <p>© 2024 blueprint. All rights reserved.</p>
              <p>This is an automated message. Please don't reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
