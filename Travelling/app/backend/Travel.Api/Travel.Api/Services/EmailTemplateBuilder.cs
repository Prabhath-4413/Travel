using System.Linq;
using System.Net;
using System.Text;
using Travel.Api.Models;

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
        public string BuildBookingConfirmationBody(string userName, Models.Booking booking, IEnumerable<string> destinationNames)
        {
            var filteredDestinations = destinationNames
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .ToList();

            var destinationText = filteredDestinations.Any()
                ? string.Join(", ", filteredDestinations)
                : "Not specified";

            var backgroundImage = "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1400&q=80";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
    <title>Booking Confirmation</title>
</head>
<body style=""margin:0;padding:0;background-color:#0b1412;
    font-family:'Segoe UI',Arial,sans-serif;color:#f8fafc;"">
    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%""
        style=""background-image:url('{backgroundImage}');
        background-size:cover;background-position:center;padding:48px 16px;"">
        <tr>
            <td align=""center"">
                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""560""
                    style=""background-color:rgba(11,20,18,0.86);
                    border-radius:24px;overflow:hidden;
                    box-shadow:0 24px 60px rgba(0,0,0,0.35);"">
                    <tr>
                        <td style=""padding:40px 36px;"">
                            <p style=""margin:0 0 12px;font-size:14px;
                                letter-spacing:1.5px;text-transform:uppercase;
                                color:#9ae6b4;"">Booking Confirmed</p>
                            <h1 style=""margin:0 0 16px;font-size:28px;
                                line-height:36px;font-weight:700;"">
                                Thank you, {WebUtility.HtmlEncode(userName)}!
                            </h1>
                            <p style=""margin:0 0 28px;font-size:16px;
                                line-height:26px;color:#e2e8f0;"">
                                We’re thrilled to confirm your stay.
                                Below are the details of your upcoming experience.
                            </p>

                            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%""
                                style=""border-collapse:separate;border-spacing:0 12px;"">
                                <tr>
                                    <td style=""padding:18px 20px;border-radius:18px;
                                        background:rgba(15,27,24,0.82);"">
                                        <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%""
                                            style=""font-size:15px;line-height:24px;color:#f8fafc;"">
                                            <tr>
                                                <td style=""padding-bottom:12px;"">
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Booking ID</strong>
                                                    </span>
                                                    <span style=""font-weight:700;font-size:18px;
                                                        letter-spacing:0.5px;"">
                                                        <strong>#{booking.BookingId}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""padding-bottom:12px;"">
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Destinations</strong>
                                                    </span>
                                                    <span style=""font-weight:700;"">
                                                        <strong>{WebUtility.HtmlEncode(destinationText)}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""padding-bottom:12px;"">
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Guests</strong>
                                                    </span>
                                                    <span style=""font-weight:700;"">
                                                        <strong>{booking.Guests}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""padding-bottom:12px;"">
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Nights</strong>
                                                    </span>
                                                    <span style=""font-weight:700;"">
                                                        <strong>{booking.Nights}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style=""padding-bottom:12px;"">
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Total Price</strong>
                                                    </span>
                                                    <span style=""font-weight:700;font-size:18px;
                                                        color:#68d391;"">
                                                        <strong>₹{booking.TotalPrice:F2}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <span style=""display:block;color:#9ae6b4;
                                                        font-size:13px;letter-spacing:1px;
                                                        text-transform:uppercase;margin-bottom:6px;"">
                                                        <strong>Starting Date</strong>
                                                    </span>
                                                    <span style=""font-weight:700;"">
                                                        <strong>{booking.BookingDate:yyyy-MM-dd}</strong>
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style=""margin:32px 0 0;font-size:15px;line-height:24px;color:#cbd5f5;"">
                                Need to adjust anything? Our concierge team is ready to help—
                                just reply to this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style=""padding:0 36px 36px;text-align:center;
                            color:#94a3b8;font-size:13px;"">
                            Travel App · Luxury Suites Crafted for You
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
            var builder = new StringBuilder();
            builder.AppendLine($"Hello {booking.User?.Name},");
            builder.AppendLine();
            builder.AppendLine("We have received your trip cancellation request.");
            builder.AppendLine($"Booking ID: {booking.BookingId}");
            builder.AppendLine($"Trip Dates: {booking.BookingDate:yyyy-MM-dd} to {booking.BookingDate.AddDays(booking.Nights):yyyy-MM-dd}");
            builder.AppendLine();
            if (!string.IsNullOrWhiteSpace(reason))
            {
                builder.AppendLine("Reason Provided:");
                builder.AppendLine(reason);
                builder.AppendLine();
            }
            builder.AppendLine("Our team will review your request soon. You will receive an email once a decision has been made.");
            builder.AppendLine();
            builder.AppendLine("Best regards,");
            builder.AppendLine("Travel App Team");
            return builder.ToString();
        }

        public string BuildCancellationRequestedAdminBody(TripCancellation cancellation, Models.Booking booking)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Hello Admin,");
            builder.AppendLine();
            builder.AppendLine("A traveler has requested to cancel their trip.");
            builder.AppendLine($"Cancellation ID: {cancellation.TripCancellationId}");
            builder.AppendLine($"Booking ID: {booking.BookingId}");
            builder.AppendLine($"Traveler: {booking.User?.Name} ({booking.User?.Email})");
            builder.AppendLine($"Requested On: {cancellation.RequestedAt:yyyy-MM-dd HH:mm} UTC");
            builder.AppendLine($"Trip Dates: {booking.BookingDate:yyyy-MM-dd} to {booking.BookingDate.AddDays(booking.Nights):yyyy-MM-dd}");

            var destinationNames = booking.BookingDestinations
                .Select(bd => bd.Destination?.Name)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .ToList();

            if (destinationNames.Any())
            {
                builder.AppendLine();
                builder.AppendLine("Destinations:");
                foreach (var destination in destinationNames)
                {
                    builder.AppendLine($"- {destination}");
                }
            }

            if (!string.IsNullOrWhiteSpace(cancellation.Reason))
            {
                builder.AppendLine();
                builder.AppendLine("Traveler's Reason:");
                builder.AppendLine(cancellation.Reason);
            }

            builder.AppendLine();
            builder.AppendLine("Please review this request from the admin dashboard.");
            builder.AppendLine();
            builder.AppendLine("Best regards,");
            builder.AppendLine("Travel App System");
            return builder.ToString();
        }

        public string BuildCancellationDecisionUserBody(Models.Booking booking, bool approved, string? adminComment)
        {
            var builder = new StringBuilder();
            builder.AppendLine($"Hello {booking.User?.Name},");
            builder.AppendLine();
            builder.AppendLine(approved
                ? "Good news! Your trip cancellation request has been approved."
                : "We’re sorry to inform you that your trip cancellation request has been rejected.");
            builder.AppendLine($"Booking ID: {booking.BookingId}");
            builder.AppendLine($"Trip Dates: {booking.BookingDate:yyyy-MM-dd} to {booking.BookingDate.AddDays(booking.Nights):yyyy-MM-dd}");
            builder.AppendLine();
            if (!string.IsNullOrWhiteSpace(adminComment))
            {
                builder.AppendLine("Notes from our team:");
                builder.AppendLine(adminComment);
                builder.AppendLine();
            }
            builder.AppendLine("If you have any questions, please reply to this email.");
            builder.AppendLine();
            builder.AppendLine("Best regards,");
            builder.AppendLine("Travel App Team");
            return builder.ToString();
        }

        public string BuildCancellationDecisionAdminBody(TripCancellation cancellation, bool approved)
        {
            var builder = new StringBuilder();
            builder.AppendLine("Hello Admin,");
            builder.AppendLine();
            builder.AppendLine(approved
                ? "A trip cancellation request has been approved."
                : "A trip cancellation request has been rejected.");
            builder.AppendLine($"Cancellation ID: {cancellation.TripCancellationId}");
            builder.AppendLine($"Booking ID: {cancellation.BookingId}");
            builder.AppendLine($"User ID: {cancellation.UserId}");
            if (!string.IsNullOrWhiteSpace(cancellation.Reason))
            {
                builder.AppendLine();
                builder.AppendLine("Original Reason:");
                builder.AppendLine(cancellation.Reason);
            }
            if (!string.IsNullOrWhiteSpace(cancellation.AdminComment))
            {
                builder.AppendLine();
                builder.AppendLine("Admin Comment:");
                builder.AppendLine(cancellation.AdminComment);
            }
            builder.AppendLine();
            builder.AppendLine("Best regards,");
            builder.AppendLine("Travel App System");
            return builder.ToString();
        }
    }
}
