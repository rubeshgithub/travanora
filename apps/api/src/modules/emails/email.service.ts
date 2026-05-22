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

export interface BookingConfirmationData {
  bookingRef: string;
  passengerName: string;
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
      FromEmailAddress: env.SES_FROM_EMAIL,
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
