using System;
using System.Linq;
using System.Net;
using System.Text;
using Travel.Api.Models;
using System.Collections.Generic;

namespace Travel.Api.Services
{
    public interface IEmailTemplateBuilder
    {
        string BuildBookingConfirmationBody(string userName, Models.Booking booking, IEnumerable<string> destinationNames);
        string BuildCancellationRequestedUserBody(Models.Booking booking, string? reason);
        string BuildCancellationRequestedAdminBody(TripCancellation cancellation, Models.Booking booking);
        string BuildCancellationDecisionUserBody(Models.Booking booking, bool approved, string? adminComment);
        string BuildCancellationDecisionAdminBody(TripCancellation cancellation, bool approved);
    }

    public class EmailTemplateBuilder : IEmailTemplateBuilder
    {
        // Color palette
        // dark teal: #0b1412
        // soft white: #f8fafc
        // light gray: #e2e8f0
        // accent: #68d391 (soft green)
        // light gold (used as subtle accent): #D4AF37 (we will use sparingly via inline styling)

        public string BuildBookingConfirmationBody(string userName, Models.Booking booking, IEnumerable<string> destinationNames)
        {
            // Safe encoded values
            var encodedUserName = WebUtility.HtmlEncode(userName ?? booking.User?.Name ?? "Guest");
            var encodedBookingId = WebUtility.HtmlEncode(booking.BookingId.ToString() ?? string.Empty);
            var filteredDestinations = (destinationNames ?? Enumerable.Empty<string>())
                                        .Where(n => !string.IsNullOrWhiteSpace(n))
                                        .ToList();
            var destinationText = filteredDestinations.Any()
                ? string.Join(", ", filteredDestinations)
                : "Not specified";
            var encodedDestinationText = WebUtility.HtmlEncode(destinationText);
            var encodedGuests = WebUtility.HtmlEncode(booking.Guests.ToString());
            var encodedNights = WebUtility.HtmlEncode(booking.Nights.ToString());
            var encodedTotalPrice = WebUtility.HtmlEncode((booking.TotalPrice).ToString("F2"));
            var encodedStartDate = WebUtility.HtmlEncode(booking.BookingDate.ToString("yyyy-MM-dd"));
            var encodedEndDate = WebUtility.HtmlEncode(booking.BookingDate.AddDays(booking.Nights).ToString("yyyy-MM-dd"));

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Booking Confirmation</title>
</head>
<body style=""margin:0;padding:0;background:#0b1412;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#0b1412;"">
  <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""padding:28px 12px;background:linear-gradient(180deg, rgba(11,20,18,0.9), rgba(11,20,18,1));"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""600"" style=""max-width:600px;width:100%;background:#f8fafc;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:18px 20px;background:#07231f;color:#f8fafc;"">
              <div style=""font-weight:700;font-size:18px;"">SuiteSavvy ✈️</div>
            </td>
          </tr>
          <tr>
            <td style=""padding:22px 24px;background:#f8fafc;color:#0b1412;"">
              <div style=""font-size:13px;color:#68d391;text-transform:uppercase;margin-bottom:8px;"">✅ Booking Confirmed</div>
              <h2 style=""margin:6px 0 10px;font-size:18px;"">Hello {encodedUserName}, your trip is confirmed!</h2>
              <p style=""margin:0 0 12px;color:#475569;font-size:14px;line-height:1.4;"">
                Thanks — your booking has been confirmed and we're excited to help you create unforgettable memories. Below are the details we have on file.
              </p>

              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:12px;border-collapse:separate;border-spacing:0 10px;"">
                <tr>
                  <td style=""background:#07231f;color:#f8fafc;padding:12px;border-radius:8px;"">
                    <div style=""font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Booking ID</div>
                    <div style=""font-weight:700;font-size:15px;color:#68d391;"">#{encodedBookingId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Trip Dates</div>
                    <div style=""font-weight:700;font-size:14px;color:#f8fafc;"">{encodedStartDate} — {encodedEndDate}</div>
                  </td>
                </tr>
              </table>

              <p style=""margin:14px 0 0;color:#475569;font-size:14px;line-height:1.4;"">
                Your booking is now active. You can view details and manage your trip through your SuiteSavvy dashboard.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:14px 20px;background:#0b1412;color:#e2e8f0;text-align:center;font-size:13px;"">
              SuiteSavvy Travel App • All Rights Reserved • support@suitesavvy.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }
        public string BuildCancellationRequestedUserBody(Models.Booking booking, string? reason)
        {
            var encodedUserName = WebUtility.HtmlEncode(booking.User?.Name ?? "Guest");
            var encodedBookingId = WebUtility.HtmlEncode(booking.BookingId.ToString() ?? string.Empty);
            var encodedStartDate = WebUtility.HtmlEncode(booking.BookingDate.ToString("yyyy-MM-dd"));
            var encodedEndDate = WebUtility.HtmlEncode(booking.BookingDate.AddDays(booking.Nights).ToString("yyyy-MM-dd"));
            var encodedReason = WebUtility.HtmlEncode(reason ?? string.Empty);

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8"" />
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Cancellation Request Received</title>
</head>
<body style=""margin:0;padding:0;background:#0b1412;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#0b1412;"">
  <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""padding:28px 12px;background:linear-gradient(180deg, rgba(11,20,18,0.9), rgba(11,20,18,1));"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""600"" style=""max-width:600px;width:100%;background:#f8fafc;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:18px 20px;background:#07231f;color:#f8fafc;"">
              <div style=""font-weight:700;font-size:18px;"">SuiteSavvy ✈️</div>
            </td>
          </tr>
          <tr>
            <td style=""padding:22px 24px;background:#f8fafc;color:#0b1412;"">
              <div style=""font-size:13px;color:#68d391;text-transform:uppercase;margin-bottom:8px;"">🕓 Cancellation Requested</div>
              <h2 style=""margin:6px 0 10px;font-size:18px;"">Hello {encodedUserName}, we received your request</h2>
              <p style=""margin:0 0 12px;color:#475569;font-size:14px;line-height:1.4;"">
                Thanks — your cancellation request has been received and is under review by our team. Below are the details we have on file.
              </p>

              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:12px;border-collapse:separate;border-spacing:0 10px;"">
                <tr>
                  <td style=""background:#07231f;color:#f8fafc;padding:12px;border-radius:8px;"">
                    <div style=""font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Booking ID</div>
                    <div style=""font-weight:700;font-size:15px;color:#68d391;"">#{encodedBookingId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Trip Dates</div>
                    <div style=""font-weight:700;font-size:14px;color:#f8fafc;"">{encodedStartDate} — {encodedEndDate}</div>

                    {(string.IsNullOrWhiteSpace(encodedReason) ? "" : $@"""<div style=\""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;\"">Reason Provided</div>
                    <div style=\""font-size:14px;color:#f8fafc;line-height:1.4;\"">{encodedReason}</div>""")}
                  </td>
                </tr>
              </table>

              <p style=""margin:14px 0 0;color:#475569;font-size:14px;line-height:1.4;"">
                Our team aims to review cancellation requests within 48 hours. You’ll receive a follow-up email once a decision is made.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:14px 20px;background:#0b1412;color:#e2e8f0;text-align:center;font-size:13px;"">
              SuiteSavvy Travel App • All Rights Reserved • support@suitesavvy.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }

        public string BuildCancellationRequestedAdminBody(TripCancellation cancellation, Models.Booking booking)
        {
            var encodedCancellationId = WebUtility.HtmlEncode(cancellation.TripCancellationId.ToString() ?? string.Empty);
            var encodedBookingId = WebUtility.HtmlEncode(booking.BookingId.ToString() ?? string.Empty);
            var encodedUserName = WebUtility.HtmlEncode(booking.User?.Name ?? string.Empty);
            var encodedUserEmail = WebUtility.HtmlEncode(booking.User?.Email ?? string.Empty);
            var encodedRequestedAt = WebUtility.HtmlEncode(cancellation.RequestedAt.ToString("yyyy-MM-dd HH:mm"));
            var encodedStartDate = WebUtility.HtmlEncode(booking.BookingDate.ToString("yyyy-MM-dd"));
            var encodedEndDate = WebUtility.HtmlEncode(booking.BookingDate.AddDays(booking.Nights).ToString("yyyy-MM-dd"));
            var encodedReason = WebUtility.HtmlEncode(cancellation.Reason ?? string.Empty);

            var destinationNames = booking.BookingDestinations?
                                       .Select(bd => bd.Destination?.Name)
                                       .Where(n => !string.IsNullOrWhiteSpace(n))
                                       .ToList() ?? new List<string>();

            var encodedDestinations = destinationNames.Any()
                ? WebUtility.HtmlEncode(string.Join(", ", destinationNames))
                : "Not specified";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8""/>
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Admin — Cancellation Request</title>
</head>
<body style=""margin:0;padding:0;background:#0b1412;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#0b1412;"">
  <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""padding:28px 12px;background:linear-gradient(180deg, rgba(11,20,18,0.9), rgba(11,20,18,1));"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""640"" style=""max-width:640px;width:100%;background:#f8fafc;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:18px 20px;background:#07231f;color:#f8fafc;"">
              <div style=""font-weight:700;font-size:18px;"">SuiteSavvy Admin</div>
            </td>
          </tr>

          <tr>
            <td style=""padding:22px 24px;background:#f8fafc;color:#0b1412;"">
              <div style=""font-size:13px;color:#D4AF37;text-transform:uppercase;margin-bottom:8px;"">⚠️ Cancellation Request — Action Required</div>
              <h2 style=""margin:6px 0 10px;font-size:18px;"">Cancellation ID: {encodedCancellationId}</h2>

              <p style=""margin:0 0 12px;color:#334155;font-size:14px;line-height:1.4;"">
                A traveler has requested a cancellation. Please review the details and act via the Admin dashboard.
              </p>

              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:12px;border-collapse:separate;border-spacing:0 10px;"">
                <tr>
                  <td style=""background:#0b1412;color:#f8fafc;padding:12px;border-radius:8px;"">
                    <div style=""font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Booking ID</div>
                    <div style=""font-weight:700;font-size:15px;color:#68d391;"">#{encodedBookingId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Traveler</div>
                    <div style=""font-weight:700;font-size:14px;color:#f8fafc;"">{encodedUserName} • {encodedUserEmail}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Requested On</div>
                    <div style=""font-size:14px;color:#f8fafc;"">{encodedRequestedAt} (UTC)</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Trip Dates</div>
                    <div style=""font-size:14px;color:#f8fafc;"">{encodedStartDate} — {encodedEndDate}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Destinations</div>
                    <div style=""font-size:14px;color:#f8fafc;"">{WebUtility.HtmlEncode(encodedDestinations)}</div>

                    {(string.IsNullOrWhiteSpace(encodedReason) ? "" : $@"""<div style=\""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;\"">Traveler's Reason</div>
                    <div style=\""font-size:14px;color:#f8fafc;line-height:1.4;\"">{encodedReason}</div>""")}
                  </td>
                </tr>
              </table>

              <p style=""margin:14px 0 0;color:#475569;font-size:14px;line-height:1.4;"">
                Visit the Admin Dashboard to Approve or Reject this request. This message contains all data submitted by the traveler.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:14px 20px;background:#0b1412;color:#e2e8f0;text-align:center;font-size:13px;"">
              SuiteSavvy Travel App • All Rights Reserved • support@suitesavvy.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }

        public string BuildCancellationDecisionUserBody(Models.Booking booking, bool approved, string? adminComment)
        {
            var encodedUserName = WebUtility.HtmlEncode(booking.User?.Name ?? "Guest");
            var encodedBookingId = WebUtility.HtmlEncode(booking.BookingId.ToString() ?? string.Empty);
            var encodedStartDate = WebUtility.HtmlEncode(booking.BookingDate.ToString("yyyy-MM-dd"));
            var encodedEndDate = WebUtility.HtmlEncode(booking.BookingDate.AddDays(booking.Nights).ToString("yyyy-MM-dd"));
            var encodedAdminComment = WebUtility.HtmlEncode(adminComment ?? string.Empty);

            // Icon & message based on approval
            var statusIcon = approved ? "✔️" : "🛑";
            var statusTitle = approved ? "Cancellation Approved" : "Cancellation Rejected";
            var statusMessage = approved
                ? "Good news — your cancellation request has been approved. Any eligible refund will be processed according to our policy."
                : "We’re sorry — your cancellation request has been reviewed and was not approved. Please see the note from our team below.";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8""/>
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Cancellation Decision</title>
</head>
<body style=""margin:0;padding:0;background:#0b1412;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#0b1412;"">
  <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""padding:28px 12px;background:linear-gradient(180deg, rgba(11,20,18,0.9), rgba(11,20,18,1));"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""600"" style=""max-width:600px;width:100%;background:#f8fafc;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:18px 20px;background:#07231f;color:#f8fafc;"">
              <div style=""font-weight:700;font-size:18px;"">SuiteSavvy ✈️</div>
            </td>
          </tr>

          <tr>
            <td style=""padding:22px 24px;background:#f8fafc;color:#0b1412;"">
              <div style=""font-size:13px;color:#68d391;text-transform:uppercase;margin-bottom:8px;"">{statusIcon} {statusTitle}</div>
              <h2 style=""margin:6px 0 10px;font-size:18px;"">Hello {encodedUserName},</h2>

              <p style=""margin:0 0 12px;color:#334155;font-size:14px;line-height:1.4;"">
                {WebUtility.HtmlEncode(statusMessage)}
              </p>

              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:12px;border-collapse:separate;border-spacing:0 10px;"">
                <tr>
                  <td style=""background:#0b1412;color:#f8fafc;padding:12px;border-radius:8px;"">
                    <div style=""font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Booking ID</div>
                    <div style=""font-weight:700;font-size:15px;color:#68d391;"">#{encodedBookingId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Trip Dates</div>
                    <div style=""font-size:14px;color:#f8fafc;"">{encodedStartDate} — {encodedEndDate}</div>

                    {(string.IsNullOrWhiteSpace(encodedAdminComment) ? "" : $@"""<div style=\""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;\"">Notes from our team</div>
                    <div style=\""font-size:14px;color:#f8fafc;line-height:1.4;\"">{encodedAdminComment}</div>""")}
                  </td>
                </tr>
              </table>

              <p style=""margin:14px 0 0;color:#475569;font-size:14px;line-height:1.4;"">
                If you have questions or need further assistance, reply to this email and our support team will help.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:14px 20px;background:#0b1412;color:#e2e8f0;text-align:center;font-size:13px;"">
              SuiteSavvy Travel App • All Rights Reserved • support@suitesavvy.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }

        public string BuildCancellationDecisionAdminBody(TripCancellation cancellation, bool approved)
        {
            var encodedCancellationId = WebUtility.HtmlEncode(cancellation.TripCancellationId.ToString() ?? string.Empty);
            var encodedBookingId = WebUtility.HtmlEncode(cancellation.BookingId.ToString() ?? string.Empty);
            var encodedUserId = WebUtility.HtmlEncode(cancellation.UserId.ToString() ?? string.Empty);
            var encodedReason = WebUtility.HtmlEncode(cancellation.Reason ?? string.Empty);
            var encodedAdminComment = WebUtility.HtmlEncode(cancellation.AdminComment ?? string.Empty);

            var statusIcon = approved ? "✔️" : "❌";
            var statusText = approved ? "Approved" : "Rejected";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
  <meta charset=""utf-8""/>
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0""/>
  <title>Admin — Cancellation Decision</title>
</head>
<body style=""margin:0;padding:0;background:#0b1412;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;color:#0b1412;"">
  <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""padding:28px 12px;background:linear-gradient(180deg, rgba(11,20,18,0.9), rgba(11,20,18,1));"">
    <tr>
      <td align=""center"">
        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""640"" style=""max-width:640px;width:100%;background:#f8fafc;border-radius:12px;overflow:hidden;"">
          <tr>
            <td style=""padding:18px 20px;background:#07231f;color:#f8fafc;"">
              <div style=""font-weight:700;font-size:18px;"">SuiteSavvy Admin</div>
            </td>
          </tr>

          <tr>
            <td style=""padding:22px 24px;background:#f8fafc;color:#0b1412;"">
              <div style=""font-size:13px;color:#D4AF37;text-transform:uppercase;margin-bottom:8px;"">{statusIcon} Cancellation {statusText}</div>

              <p style=""margin:0 0 12px;color:#334155;font-size:14px;line-height:1.4;"">
                A cancellation request has been {statusText.ToLower()} by an admin. Details below.
              </p>

              <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:12px;border-collapse:separate;border-spacing:0 10px;"">
                <tr>
                  <td style=""background:#0b1412;color:#f8fafc;padding:12px;border-radius:8px;"">
                    <div style=""font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Cancellation ID</div>
                    <div style=""font-weight:700;font-size:15px;color:#68d391;"">{encodedCancellationId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">Booking ID</div>
                    <div style=""font-size:14px;color:#f8fafc;"">#{encodedBookingId}</div>

                    <div style=""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;"">User ID</div>
                    <div style=""font-size:14px;color:#f8fafc;"">{encodedUserId}</div>

                    {(string.IsNullOrWhiteSpace(encodedReason) ? "" : $@"""<div style=\""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;\"">Original Reason</div>
                    <div style=\""font-size:14px;color:#f8fafc;line-height:1.4;\"">{encodedReason}</div>""")}

                    {(string.IsNullOrWhiteSpace(encodedAdminComment) ? "" : $@"""<div style=\""margin-top:10px;font-size:12px;color:#e2e8f0;text-transform:uppercase;margin-bottom:6px;\"">Admin Comment</div>
                    <div style=\""font-size:14px;color:#f8fafc;line-height:1.4;\"">{encodedAdminComment}</div>""")}
                  </td>
                </tr>
              </table>

              <p style=""margin:14px 0 0;color:#475569;font-size:14px;line-height:1.4;"">
                This message is for administrative purposes. Use the Admin dashboard to view full details and take additional actions if necessary.
              </p>
            </td>
          </tr>

          <tr>
            <td style=""padding:14px 20px;background:#0b1412;color:#e2e8f0;text-align:center;font-size:13px;"">
              SuiteSavvy Travel App • All Rights Reserved • support@suitesavvy.com
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>";
        }
    }
}
