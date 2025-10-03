import { supabase } from './supabase';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  /**
   * Send an email via Supabase Edge Function
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('User must be authenticated to send emails');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(options),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send interview invitation email
   */
  static async sendInterviewInvitation(params: {
    candidateEmail: string;
    candidateName: string;
    interviewTitle: string;
    scheduledAt: Date;
    duration: number;
    location?: string;
    meetingUrl?: string;
    jobTitle: string;
    companyName: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { candidateEmail, candidateName, interviewTitle, scheduledAt, duration, location, meetingUrl, jobTitle, companyName } = params;

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(scheduledAt);

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Interview Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Interview Invitation</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${candidateName},</p>

            <p>We are pleased to invite you for an interview regarding your application for the position of <strong>${jobTitle}</strong> at ${companyName}.</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h2 style="margin-top: 0; color: #3b82f6;">Interview Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Interview:</td>
                  <td style="padding: 8px 0;">${interviewTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
                  <td style="padding: 8px 0;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Duration:</td>
                  <td style="padding: 8px 0;">${duration} minutes</td>
                </tr>
                ${location ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Location:</td>
                  <td style="padding: 8px 0;">${location}</td>
                </tr>
                ` : ''}
                ${meetingUrl ? `
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Meeting Link:</td>
                  <td style="padding: 8px 0;"><a href="${meetingUrl}" style="color: #3b82f6; text-decoration: none;">${meetingUrl}</a></td>
                </tr>
                ` : ''}
              </table>
            </div>

            <p>Please confirm your attendance by replying to this email. If you need to reschedule, please let us know as soon as possible.</p>

            <p>We look forward to speaking with you!</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>${companyName} Recruitment Team</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from ${companyName} ATS. Please do not reply directly to this email.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: candidateEmail,
      subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
      html,
    });
  }

  /**
   * Send application status update email
   */
  static async sendApplicationStatusUpdate(params: {
    candidateEmail: string;
    candidateName: string;
    jobTitle: string;
    companyName: string;
    newStatus: string;
    message?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { candidateEmail, candidateName, jobTitle, companyName, newStatus, message } = params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Application Status Update</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear ${candidateName},</p>

            <p>We wanted to update you on the status of your application for the position of <strong>${jobTitle}</strong> at ${companyName}.</p>

            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h2 style="margin-top: 0; color: #3b82f6;">New Status: ${newStatus}</h2>
              ${message ? `<p>${message}</p>` : ''}
            </div>

            <p>Thank you for your continued interest in ${companyName}.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>${companyName} Recruitment Team</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>This is an automated message from ${companyName} ATS. Please do not reply directly to this email.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: candidateEmail,
      subject: `Application Update: ${jobTitle} at ${companyName}`,
      html,
    });
  }

  /**
   * Send team member invitation email
   */
  static async sendTeamInvitation(params: {
    inviteeEmail: string;
    inviteeName: string;
    companyName: string;
    role: string;
    invitationLink: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { inviteeEmail, inviteeName, companyName, role, invitationLink } = params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">You're Invited!</h1>
          </div>

          <div style="background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hello ${inviteeName},</p>

            <p>You have been invited to join <strong>${companyName}</strong> on ATS Pro as a <strong>${role}</strong>.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
            </div>

            <p style="font-size: 14px; color: #6b7280;">This invitation link will expire in 7 days.</p>

            <p>If you have any questions, please contact your administrator.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>ATS Pro Team</strong></p>
          </div>

          <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
            <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: inviteeEmail,
      subject: `Invitation to join ${companyName} on ATS Pro`,
      html,
    });
  }
}
