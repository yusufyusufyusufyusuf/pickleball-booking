import { Resend } from "resend";

// Lazily instantiate so the module loads cleanly even before the secret is set
function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export type BookingConfirmationData = {
  customerName: string;
  customerEmail: string;
  bookingDate: string; // "YYYY-MM-DD"
  startHour: number;
  durationHours: 1 | 2;
  amountPaid: number; // in cents
  bookingRef: string;
};

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${period}`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildHtml(data: BookingConfirmationData): string {
  const {
    customerName,
    bookingDate,
    startHour,
    durationHours,
    amountPaid,
    bookingRef,
  } = data;

  const endHour = startHour + durationHours;
  const formattedDate = formatDate(bookingDate);
  const timeRange = `${formatHour(startHour)} – ${formatHour(endHour)}`;
  const amountDisplay = `$${(amountPaid / 100).toFixed(2)}`;
  const firstName = customerName.split(" ")[0] || customerName;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed – Pickleball Court</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a4731;border-radius:50%;width:40px;height:40px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:bold;line-height:40px;">P</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:600;color:#1a1a1a;font-family:Georgia,serif;">Pickleball Court</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

              <!-- Green top band -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a4731;padding:28px 32px;">
                    <p style="margin:0 0 6px;color:rgba(255,255,255,0.65);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Booking Confirmed</p>
                    <p style="margin:0;color:#ffffff;font-size:24px;font-weight:700;font-family:Georgia,serif;">You're on the court, ${firstName}!</p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px;">

                    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
                      Your pickleball court has been reserved and your payment has been processed. Here's a summary of your booking:
                    </p>

                    <!-- Details table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:10px;overflow:hidden;margin-bottom:24px;">
                      <tr style="background:#f9f9f7;">
                        <td style="padding:12px 16px;font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e8e8e8;" colspan="2">Booking Details</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f0;width:40%;">Reference</td>
                        <td style="padding:12px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0f0f0;font-family:monospace;">${bookingRef}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f0;">Date</td>
                        <td style="padding:12px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0f0f0;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f0;">Time</td>
                        <td style="padding:12px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0f0f0;">${timeRange}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f0;">Duration</td>
                        <td style="padding:12px 16px;font-size:13px;color:#1a1a1a;font-weight:600;border-bottom:1px solid #f0f0f0;">${durationHours} hour${durationHours > 1 ? "s" : ""}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 16px;font-size:13px;color:#888;">Amount Paid</td>
                        <td style="padding:12px 16px;font-size:15px;color:#1a4731;font-weight:700;font-family:Georgia,serif;">${amountDisplay}</td>
                      </tr>
                    </table>

                    <!-- Tips box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f3;border:1px solid #c8e6d4;border-radius:10px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1a4731;">Before you arrive</p>
                          <p style="margin:0;font-size:13px;color:#3a6b52;line-height:1.6;">Please arrive 5 minutes early. Court equipment is available on-site. Bring water and wear court-appropriate shoes.</p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0;font-size:14px;color:#888;line-height:1.6;">
                      Questions? Reply to this email or visit your confirmation page anytime.
                    </p>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 0 8px;">
              <p style="margin:0;font-size:12px;color:#aaa;">© 2025 Pickleball Court · Secure payments by Stripe</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a booking confirmation email to the customer via Resend.
 * Returns true on success, false on failure (non-throwing).
 */
export async function sendBookingConfirmation(
  data: BookingConfirmationData
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping confirmation email");
    return false;
  }

  const { customerName, customerEmail, bookingDate, startHour, durationHours } = data;
  const formattedDate = formatDate(bookingDate);
  const timeRange = `${formatHour(startHour)} – ${formatHour(startHour + durationHours)}`;

  try {
    const { error } = await getResend().emails.send({
      from: "Pickleball Court <bookings@book.yusufremtulla.com>",
      to: customerEmail,
      subject: `Your court is booked — ${formattedDate} at ${formatHour(startHour)}`,
      html: buildHtml(data),
      text: `Hi ${customerName},\n\nYour pickleball court booking is confirmed!\n\nDate: ${formattedDate}\nTime: ${timeRange}\nDuration: ${durationHours} hour${durationHours > 1 ? "s" : ""}\nAmount Paid: $${(data.amountPaid / 100).toFixed(2)}\nReference: ${data.bookingRef}\n\nPlease arrive 5 minutes early. Court equipment is available on-site.\n\n© 2025 Pickleball Court`,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }

    console.log(`[Email] Confirmation sent to ${customerEmail}`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send confirmation email:", err);
    return false;
  }
}
