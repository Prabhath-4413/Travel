using System.Globalization;

namespace Travel.Api.Services
{
    public static class EmailTemplates
    {
        public static string BookingConfirmed(string userName, int bookingId, string destination, DateTime checkInDate, DateTime checkOutDate, int guests, decimal totalPrice)
        {
            var formattedTotal = totalPrice.ToString("C", CultureInfo.CurrentCulture);

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
    <title>Booking Confirmed</title>
</head>
<body style=""margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;color:#111827;"">
    <div style=""max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 20px 40px rgba(15,23,42,0.12);"">
        <h1 style=""font-size:26px;margin:0 0 16px;"">✈️ Booking Confirmed – Have a Wonderful Trip!</h1>
        <p style=""font-size:16px;line-height:1.6;margin:0 0 16px;"">Congratulations <b>{userName}</b>! Your adventure is all set and we could not be more excited for you.</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Booking ID:</b> #{bookingId}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Destination:</b> {destination}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Check-in:</b> {checkInDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Check-out:</b> {checkOutDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Guests:</b> {guests}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 24px 24px 0;padding:12px 16px;border-left:4px solid #3b82f6;background:#eff6ff;""><b>Total Price:</b> {formattedTotal}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 16px;"">We are here for anything you need before takeoff. Feel free to reach out anytime and have a safe and happy journey! 🌍</p>
        <p style=""font-size:14px;color:#6b7280;margin:24px 0 0;"">Warm wishes,<br/><b>SuiteSavvy</b></p>
    </div>
</body>
</html>";
        }

        public static string CancellationRequested(string userName, int bookingId, string destination, DateTime checkInDate, DateTime checkOutDate, int guests, decimal totalPrice, string? reason)
        {
            var formattedTotal = totalPrice.ToString("C", CultureInfo.CurrentCulture);
            var reasonBlock = string.IsNullOrWhiteSpace(reason) ? string.Empty : $"<p style=\"font-size:15px;line-height:1.6;margin:0 0 12px;\"><b>Reason:</b> {reason}</p>";

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
    <title>Cancellation Request Received</title>
</head>
<body style=""margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;color:#111827;"">
    <div style=""max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 20px 40px rgba(15,23,42,0.12);"">
        <h1 style=""font-size:26px;margin:0 0 16px;"">❔ Cancellation Request Received – We’re Processing It</h1>
        <p style=""font-size:16px;line-height:1.6;margin:0 0 16px;"">Hi <b>{userName}</b>, we have received your cancellation request and our team is reviewing it right away.</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Booking ID:</b> #{bookingId}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Destination:</b> {destination}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Check-in:</b> {checkInDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Check-out:</b> {checkOutDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Guests:</b> {guests}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 24px 16px 0;padding:12px 16px;border-left:4px solid #f97316;background:#fff7ed;""><b>Total Price:</b> {formattedTotal}</p>
        {reasonBlock}
        <p style=""font-size:15px;line-height:1.6;margin:16px 0;"">We’re sorry to hear that you wish to cancel your trip. Our support team will follow up soon with the next steps. Thank you for your patience. 🙏</p>
        <p style=""font-size:14px;color:#6b7280;margin:24px 0 0;"">Kind regards,<br/><b>Travel App Team</b></p>
    </div>
</body>
</html>";
        }

        public static string CancellationApproved(string userName, int bookingId, string destination, DateTime checkInDate, DateTime checkOutDate, int guests, decimal refundAmount)
        {
            var formattedRefund = refundAmount.ToString("C", CultureInfo.CurrentCulture);

            return $@"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"" />
    <meta name=""viewport"" content=""width=device-width, initial-scale=1"" />
    <title>Cancellation Approved</title>
</head>
<body style=""margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;color:#111827;"">
    <div style=""max-width:600px;margin:24px auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 20px 40px rgba(15,23,42,0.12);"">
        <h1 style=""font-size:26px;margin:0 0 16px;"">🛑 Booking Cancelled – We’re Sorry to See You Go</h1>
        <p style=""font-size:16px;line-height:1.6;margin:0 0 16px;"">Hello <b>{userName}</b>, your cancellation has been completed and the details are below.</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Booking ID:</b> #{bookingId}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Destination:</b> {destination}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Original Check-in:</b> {checkInDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Original Check-out:</b> {checkOutDate:dddd, MMMM d, yyyy}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 12px;""><b>Guests:</b> {guests}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 24px 24px 0;padding:12px 16px;border-left:4px solid #10b981;background:#ecfdf5;""><b>Refund Amount:</b> {formattedRefund}</p>
        <p style=""font-size:15px;line-height:1.6;margin:0 0 16px;"">Your refund will be processed shortly. We hope to see you again soon and look forward to planning your next getaway. 🌟</p>
        <p style=""font-size:14px;color:#6b7280;margin:24px 0 0;"">With appreciation,<br/><b>Travel App Team</b></p>
    </div>
</body>
</html>";
        }
    }
}