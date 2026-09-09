import { transporter } from "../config/email.config,.js";
import { env } from "../config/env.js";

interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static async send(options: IEmailOptions): Promise<void> {
    const mailOptions = {
      from: `Vendora - Multi-Tenant : ${env.SMTP_Username}`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
    await transporter.sendMail(mailOptions);
  }

  static async registerInitUser(
    toEmail: string,
    token: string,
    username: string,
  ): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/register/verify?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #4f46e5; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Vendora</h1>
                    <p style="color: #c7d2fe; margin: 5px 0 0 0; font-size: 14px;">Multi-Tenant E-Commerce Engine</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Welcome aboard, ${username}! 👋</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      Thank you for starting your journey with <strong>Vendora</strong>. To complete your account setup and secure your access, please verify your email address by clicking the button below:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                          <a href="${verificationUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; display: inline-block; font-weight: 600;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                      If the button doesn't work, copy and paste this link into your web browser:
                    </p>
                    <p style="margin: 0 0 30px 0; word-break: break-all;">
                      <a href="${verificationUrl}" style="color: #4f46e5; font-size: 13px; text-decoration: underline;">${verificationUrl}</a>
                    </p>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      If you did not create an account with Vendora, please ignore this email. This link will expire in 24 hours.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Vendora Platform. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.send({
      to: toEmail,
      subject: "Verify Your Email to Join Vendora Now",
      html: html,
    });
  }

  static async registerInitOwner(
    toEmail: string,
    token: string,
    username: string,
    tenantName: string,
  ): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/register/verify?token=${token}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Store Owner Account</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #0f172a; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Vendora</h1>
                    <p style="color: #38bdf8; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Store Merchant Onboarding</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">Welcome, ${username}! 🚀</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                      You are one step away from launching your store <strong style="color: #0f172a;">${tenantName}</strong> on Vendora.
                    </p>

                    <!-- Store Info Badge -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #38bdf8; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                      <p style="margin: 0; color: #334155; font-size: 14px;">
                        <strong>Store Name:</strong> ${tenantName}<br>
                        <strong>Role:</strong> Tenant Owner (Full Management Access)
                      </p>
                    </div>

                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      Please verify your email address to initialize your store workspace and access your dashboard:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #0f172a;">
                          <a href="${verificationUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; display: inline-block; font-weight: 600;">
                            Verify & Launch Store
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                      If the button above does not work, paste this URL into your browser:
                    </p>
                    <p style="margin: 0 0 30px 0; word-break: break-all;">
                      <a href="${verificationUrl}" style="color: #0284c7; font-size: 13px; text-decoration: underline;">${verificationUrl}</a>
                    </p>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      If you didn't initiate this store setup, you can safely ignore this email. Link expires in 24 hours.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Vendora Multi-Tenant E-Commerce.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    await this.send({
      to: toEmail,
      html: html,
      subject: "Verify Your Email , Join Vendora Now",
    });
  }

  static async inviteUser(
    email: string,
    token: string,
    tenantId: string,
    role?: string,
    tenantName?: string,
  ): Promise<void> {
    const acceptUrl = `${env.CLIENT_URL}/accept-invitation?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You have been invited to join a store</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #4f46e5; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Vendora</h1>
                    <p style="color: #c7d2fe; margin: 5px 0 0 0; font-size: 14px;">Store Team Invitation</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">You're Invited! 🎉</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                      You have been invited to join <strong>${tenantName || "a store"}</strong> on the Vendora E-Commerce platform.
                    </p>

                    <!-- Invitation Info Card -->
                    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                      <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">
                        <strong>Store ID:</strong> ${tenantId}<br>
                        ${role ? `<strong>Assigned Role:</strong> ${role}` : ""}
                      </p>
                    </div>

                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      Click the button below to accept your invitation, complete your profile, and set up your access credentials:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #4f46e5;">
                          <a href="${acceptUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; display: inline-block; font-weight: 600;">
                            Accept Invitation
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                      If the button doesn't work, copy and paste this link into your web browser:
                    </p>
                    <p style="margin: 0 0 30px 0; word-break: break-all;">
                      <a href="${acceptUrl}" style="color: #4f46e5; font-size: 13px; text-decoration: underline;">${acceptUrl}</a>
                    </p>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      This invitation link is valid for 48 hours. If you were not expecting this invitation, you can ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Vendora Platform. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `You have been invited to join a store on Vendora!\n\nPlease accept your invitation by visiting the link below:\n${acceptUrl}\n\nNote: This link will expire in 48 hours.`;

    await this.send({
      to: email,
      subject: `Invitation to Join ${tenantName || "Store"} on Vendora`,
      html,
      text,
    });
  }

  static async sendResetPasswordEmail(
    toEmail: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f8; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #dc2626; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px;">Vendora</h1>
                    <p style="color: #fca5a5; margin: 5px 0 0 0; font-size: 14px;">Password Reset Request</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Reset Your Password 🔐</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                      We received a request to reset the password for your <strong>Vendora</strong> account. Click the button below to choose a new password:
                    </p>

                    <!-- CTA Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center" style="border-radius: 8px; background-color: #dc2626;">
                          <a href="${resetUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; display: inline-block; font-weight: 600;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
                      If the button doesn't work, copy and paste this link into your web browser:
                    </p>
                    <p style="margin: 0 0 30px 0; word-break: break-all;">
                      <a href="${resetUrl}" style="color: #dc2626; font-size: 13px; text-decoration: underline;">${resetUrl}</a>
                    </p>

                    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      If you did not request a password reset, please ignore this email or contact support if you have concerns. This link will expire in 15 minutes.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #f1f5f9;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${new Date().getFullYear()} Vendora Platform. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `Reset Your Vendora Password\n\nPlease reset your password by visiting the link below:\n${resetUrl}\n\nNote: This link will expire in 15 minutes. If you did not request this, please ignore this email.`;

    await this.send({
      to: toEmail,
      subject: "Reset Your Vendora Account Password",
      html,
      text,
    });
  }
}
