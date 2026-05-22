import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import { EmailLog } from './email-log.model.js';

const ses = new SESv2Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_ADDRESS = `Travanora <${env.SES_FROM_EMAIL}>`;

export interface BookingConfirmationData {
  bookingRef: string;
  passengerName: string;
  passengers: Array<{ firstName: string; lastName: string; dob?: string }>;
  totalAmount: number;
  currency: string;
  slices: Array<{
    origin: string;
    originName?: string;
    destination: string;
    destinationName?: string;
    departureAt: string;
    arrivalAt: string;
  }>;
  airline: string;
  bookingId?: string;
}

function formatMoney(amount: number, currency: string): string {
  const decimals = currency.toUpperCase() === 'KWD' ? 3 : 2;
  return `${currency} ${amount.toFixed(decimals)}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-KW', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDob(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KW', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildHtml(data: BookingConfirmationData): string {
  const sliceRows = data.slices
    .map(
      (s) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">
          ${s.originName ?? s.origin} → ${s.destinationName ?? s.destination}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#0a2540;font-size:13px;text-align:right;font-weight:600;">
          ${formatDateTime(s.departureAt)}
        </td>
      </tr>`,
    )
    .join('');

  const passengerRows = data.passengers
    .map(
      (p, i) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;">
          ${data.passengers.length > 1 ? `Passenger ${i + 1}` : 'Passenger'}
        </td>
        <td style="padding:6px 0;border-bottom:1px solid #f3f4f6;color:#0a2540;font-size:13px;text-align:right;font-weight:600;">
          ${p.firstName} ${p.lastName}${p.dob ? ` <span style="color:#9ca3af;font-weight:400;font-size:12px;">(DOB: ${formatDob(p.dob)})</span>` : ''}
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="background:#0a2540;padding:24px 32px;">
          <div style="font-size:22px;font-weight:800;color:#FFBF00;letter-spacing:-0.5px;">Travanora</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:13px;">Booking Confirmation</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px;">Hi ${data.passengerName},</p>
          <p style="margin:0 0 24px;color:#0a2540;font-size:17px;font-weight:700;">Your booking is confirmed! ✓</p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <div style="margin:0 0 4px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;">Booking Reference</div>
            <div style="margin:0;color:#0a2540;font-size:26px;font-weight:800;letter-spacing:3px;font-family:monospace;">${data.bookingRef}</div>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td colspan="2" style="padding-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                Flight Details — ${data.airline}
              </td>
            </tr>
            ${sliceRows}
          </table>

          ${data.passengers.length > 0 ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td colspan="2" style="padding-bottom:8px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6b7280;">
                ${data.passengers.length === 1 ? 'Passenger' : 'Passengers'}
              </td>
            </tr>
            ${passengerRows}
          </table>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:16px;">
            <tr>
              <td style="padding-top:16px;color:#6b7280;font-size:14px;">Total paid</td>
              <td style="padding-top:16px;color:#0a2540;font-size:20px;font-weight:800;text-align:right;">
                ${formatMoney(data.totalAmount, data.currency)}
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
            Please ensure all passenger names exactly match the travel documents.
            Your e-ticket will be issued by the airline shortly.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <span style="color:#9ca3af;font-size:12px;">
            Travanora · <a href="mailto:${env.SES_REPLY_TO}" style="color:#FFBF00;text-decoration:none;">${env.SES_REPLY_TO}</a>
          </span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendPasswordChangedEmail(
  recipient: string,
  firstName: string,
): Promise<void> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="background:#0a2540;padding:24px 32px;">
          <div style="font-size:22px;font-weight:800;color:#FFBF00;letter-spacing:-0.5px;">Travanora</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:13px;">Security notice</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px;">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#0a2540;font-size:17px;font-weight:700;">Your password has been changed</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            This is a confirmation that the password for your Travanora account was successfully updated.
          </p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            If you made this change, no further action is needed.
            If you did <strong>not</strong> make this change, please contact us immediately at
            <a href="mailto:${env.SES_REPLY_TO}" style="color:#00b67a;text-decoration:none;">${env.SES_REPLY_TO}</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <span style="color:#9ca3af;font-size:12px;">
            Travanora · <a href="mailto:${env.SES_REPLY_TO}" style="color:#FFBF00;text-decoration:none;">${env.SES_REPLY_TO}</a>
          </span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const cmd = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: [env.SES_REPLY_TO],
      Destination: { ToAddresses: [recipient] },
      Content: {
        Simple: {
          Subject: { Data: 'Your Travanora password was changed', Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });
    const result = await ses.send(cmd);
    await EmailLog.create({ recipient, template: 'password_changed', sentAt: new Date(), sesMessageId: result.MessageId });
    logger.info({ recipient, messageId: result.MessageId }, 'Password changed email sent');
  } catch (err) {
    await EmailLog.create({ recipient, template: 'password_changed', sentAt: new Date(), error: (err as Error).message }).catch(() => undefined);
    logger.error({ err, recipient }, 'Failed to send password changed email');
  }
}

export async function sendPasswordResetEmail(
  recipient: string,
  firstName: string,
  resetUrl: string,
): Promise<void> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.warn({ recipient }, 'AWS credentials not configured — skipping password reset email');
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="background:#0a2540;padding:24px 32px;">
          <div style="font-size:22px;font-weight:800;color:#FFBF00;letter-spacing:-0.5px;">Travanora</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:13px;">Password reset</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px;">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#0a2540;font-size:17px;font-weight:700;">Reset your Travanora password</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            We received a request to reset your password. Click the button below to choose a new one.
            This link expires in 1 hour.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#00b67a;border-radius:8px;padding:14px 28px;">
                <a href="${resetUrl}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                  Reset my password →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            If you didn&apos;t request this, you can safely ignore this email — your password won&apos;t change.
            <br/>Or copy this link: <span style="color:#0a2540;word-break:break-all;">${resetUrl}</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <span style="color:#9ca3af;font-size:12px;">
            Travanora · <a href="mailto:${env.SES_REPLY_TO}" style="color:#FFBF00;text-decoration:none;">${env.SES_REPLY_TO}</a>
          </span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const cmd = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: [env.SES_REPLY_TO],
      Destination: { ToAddresses: [recipient] },
      Content: {
        Simple: {
          Subject: { Data: 'Reset your Travanora password', Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });

    const result = await ses.send(cmd);
    await EmailLog.create({ recipient, template: 'password_reset', sentAt: new Date(), sesMessageId: result.MessageId });
    logger.info({ recipient, messageId: result.MessageId }, 'Password reset email sent');
  } catch (err) {
    await EmailLog.create({ recipient, template: 'password_reset', sentAt: new Date(), error: (err as Error).message }).catch(() => undefined);
    logger.error({ err, recipient }, 'Failed to send password reset email');
    throw err;
  }
}

export async function sendVerificationEmail(
  recipient: string,
  firstName: string,
  verificationUrl: string,
): Promise<void> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.warn({ recipient }, 'AWS credentials not configured — skipping verification email');
    return;
  }

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <tr>
        <td style="background:#0a2540;padding:24px 32px;">
          <div style="font-size:22px;font-weight:800;color:#FFBF00;letter-spacing:-0.5px;">Travanora</div>
          <div style="margin-top:4px;color:#94a3b8;font-size:13px;">Welcome aboard</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px;">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#0a2540;font-size:17px;font-weight:700;">Welcome to Travanora! Please verify your email.</p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            Click the button below to confirm your email address and activate your account.
            This link expires in 24 hours.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#00b67a;border-radius:8px;padding:14px 28px;">
                <a href="${verificationUrl}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                  Verify my email →
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            If you didn&apos;t create a Travanora account, you can safely ignore this email.
            <br/>Or copy this link: <span style="color:#0a2540;word-break:break-all;">${verificationUrl}</span>
          </p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <span style="color:#9ca3af;font-size:12px;">
            Travanora · <a href="mailto:${env.SES_REPLY_TO}" style="color:#FFBF00;text-decoration:none;">${env.SES_REPLY_TO}</a>
          </span>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  try {
    const cmd = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: [env.SES_REPLY_TO],
      Destination: { ToAddresses: [recipient] },
      Content: {
        Simple: {
          Subject: { Data: 'Verify your Travanora email address', Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });

    const result = await ses.send(cmd);
    await EmailLog.create({ recipient, template: 'email_verification', sentAt: new Date(), sesMessageId: result.MessageId });
    logger.info({ recipient, messageId: result.MessageId }, 'Verification email sent');
  } catch (err) {
    await EmailLog.create({ recipient, template: 'email_verification', sentAt: new Date(), error: (err as Error).message }).catch(() => undefined);
    logger.error({ err, recipient }, 'Failed to send verification email');
  }
}

export async function sendBookingConfirmation(
  recipient: string,
  data: BookingConfirmationData,
): Promise<void> {
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    logger.warn({ recipient }, 'AWS credentials not configured — skipping confirmation email');
    return;
  }

  const html = buildHtml(data);
  const subject = `Booking Confirmed · ${data.bookingRef}`;

  try {
    const cmd = new SendEmailCommand({
      FromEmailAddress: FROM_ADDRESS,
      ReplyToAddresses: [env.SES_REPLY_TO],
      Destination: { ToAddresses: [recipient] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });

    const result = await ses.send(cmd);
    await EmailLog.create({
      recipient,
      template: 'booking_confirmation',
      sentAt: new Date(),
      sesMessageId: result.MessageId,
      bookingId: data.bookingId,
    });
    logger.info({ recipient, messageId: result.MessageId, bookingRef: data.bookingRef }, 'Confirmation email sent');
  } catch (err) {
    await EmailLog.create({
      recipient,
      template: 'booking_confirmation',
      sentAt: new Date(),
      error: (err as Error).message,
      bookingId: data.bookingId,
    }).catch(() => undefined);
    logger.error({ err, recipient, bookingRef: data.bookingRef }, 'Failed to send confirmation email');
    throw err;
  }
}
