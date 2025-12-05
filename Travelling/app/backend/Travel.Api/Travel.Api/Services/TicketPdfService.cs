using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;
using System.Text.Json;
using Travel.Api.Models;

namespace Travel.Api.Services;

public interface ITicketPdfService
{
    Task<byte[]> GenerateTicketPdfAsync(TicketDetailsDto ticketDetails);
    string GenerateQrCodeAsBase64(TicketQrData qrData);
}

public class TicketPdfService : ITicketPdfService
{
    private readonly ILogger<TicketPdfService> _logger;

    public TicketPdfService(ILogger<TicketPdfService> logger)
    {
        _logger = logger;
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
    }

    public async Task<byte[]> GenerateTicketPdfAsync(TicketDetailsDto ticketDetails)
    {
        try
        {
            _logger.LogInformation("Generating ticket PDF for booking {BookingId}", ticketDetails.BookingId);

            var qrData = new TicketQrData
            {
                BookingId = ticketDetails.BookingId,
                UserEmail = ticketDetails.UserEmail,
                TravelDate = ticketDetails.StartDate
            };

            var qrCodeImage = GenerateQrCodeAsBase64(qrData);
            var endDate = ticketDetails.StartDate.AddDays(ticketDetails.Nights);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.MarginVertical(20);
                    page.MarginHorizontal(30);

                    page.Header().Element(x => RenderHeader(x));
                    page.Content().Element(x => RenderContent(x, ticketDetails, qrCodeImage, endDate));
                    page.Footer().Element(x => RenderFooter(x));
                });
            });

            var pdf = document.GeneratePdf();
            _logger.LogInformation("Successfully generated ticket PDF for booking {BookingId}", ticketDetails.BookingId);

            return await Task.FromResult(pdf);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate ticket PDF for booking {BookingId}: {Message}",
                ticketDetails.BookingId, ex.Message);
            throw;
        }
    }

    private void RenderHeader(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem(1).Border(1).Padding(5).Background("#F5F5F5").AlignCenter().AlignMiddle().Text("✈ SUITESAVVY");
            row.RelativeItem(2).PaddingLeft(10).Column(col =>
            {
                col.Item().Text("SuiteSavvy - Your Journey Awaits").FontSize(18).Bold().FontColor("#1e40af");
                col.Item().Text("Premium Travel Booking Services").FontSize(10).FontColor("#666");
            });
        });

        container.PaddingTop(10);

        container.Row(row =>
        {
            row.RelativeItem().Column(col =>
            {
                col.Item().Text("Address: 123 Travel Street, Mumbai, MH 400001").FontSize(9).FontColor("#555");
                col.Item().Text("Phone: +91-9876543210 | Email: support@travelling.com").FontSize(9).FontColor("#555");
                col.Item().Text("Website: www.travelling.com | GST No: 27AAXFT1234H1Z0").FontSize(9).FontColor("#555");
            });
        });

        container.PaddingTop(5);
        container.LineHorizontal(1);
    }

    private void RenderContent(IContainer container, TicketDetailsDto ticketDetails, string qrCodeImage, DateTime endDate)
    {
        container.PaddingTop(10);

        container.Text("BOOKING TICKET").FontSize(16).Bold().FontColor("#1e40af").AlignCenter();

        container.PaddingTop(8);

        container.Row(row =>
        {
            row.RelativeItem().Background("#E8F4F8").Padding(5).Column(col =>
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Ticket Number:").Bold().FontSize(10);
                    r.RelativeItem().Text(GenerateTicketNumber(ticketDetails.BookingId)).FontSize(10).FontColor("#1e40af").Bold();
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Booking ID:").Bold().FontSize(10);
                    r.RelativeItem().Text(ticketDetails.BookingId.ToString()).FontSize(10);
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text("Generated On:").Bold().FontSize(10);
                    r.RelativeItem().Text(DateTime.UtcNow.ToString("dd MMM yyyy HH:mm")).FontSize(10);
                });
            });
        });

        container.PaddingTop(8);
        container.LineHorizontal(0.5f);
        container.PaddingTop(8);

        container.Text("CUSTOMER DETAILS").FontSize(12).Bold().FontColor("#1e40af");
        container.Row(row =>
        {
            row.RelativeItem().Background("#F9F9F9").Padding(8).Column(col =>
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Name:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.UserName).FontSize(10);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Email:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.UserEmail).FontSize(9);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Phone:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.UserPhone).FontSize(10);
                    });
                });
            });
        });

        container.PaddingTop(8);
        container.LineHorizontal(0.5f);
        container.PaddingTop(8);

        container.Text("TRIP DETAILS").FontSize(12).Bold().FontColor("#1e40af");
        container.Row(row =>
        {
            row.RelativeItem().Background("#F9F9F9").Padding(8).Column(col =>
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Destination:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.Destinations).FontSize(10);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Travel Date:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.StartDate.ToString("dd MMM yyyy")).FontSize(10);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Return Date:").Bold().FontSize(10);
                        c.Item().Text(endDate.ToString("dd MMM yyyy")).FontSize(10);
                    });
                });
                col.Item().Text("");
                col.Item().Row(r =>
                {
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Guests:").Bold().FontSize(10);
                        c.Item().Text(ticketDetails.Guests.ToString()).FontSize(10);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Duration:").Bold().FontSize(10);
                        c.Item().Text($"{ticketDetails.Nights} nights").FontSize(10);
                    });
                    r.RelativeItem(2).Column(c =>
                    {
                        c.Item().Text("Status:").Bold().FontSize(10);
                        c.Item().Text("✓ Confirmed").FontSize(10).FontColor("#22c55e");
                    });
                });
            });
        });

        container.PaddingTop(8);
        container.LineHorizontal(0.5f);
        container.PaddingTop(8);

        container.Text("PRICE BREAKDOWN").FontSize(12).Bold().FontColor("#1e40af");
        container.Row(row =>
        {
            row.RelativeItem().Background("#F9F9F9").Padding(8).Column(col =>
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem(3).Text("Subtotal:").FontSize(10);
                    r.RelativeItem(1).Text($"₹ {ticketDetails.SubTotal:F2}").FontSize(10).AlignRight().Bold();
                });
                col.Item().Row(r =>
                {
                    r.RelativeItem(3).Text("GST (18%):").FontSize(10);
                    r.RelativeItem(1).Text($"₹ {ticketDetails.GstAmount:F2}").FontSize(10).AlignRight().Bold();
                });
                col.Item().Text("");
                col.Item().Background("#1e40af").Padding(5).Row(r =>
                {
                    r.RelativeItem(3).Text("TOTAL AMOUNT:").FontSize(11).Bold().FontColor("white");
                    r.RelativeItem(1).Text($"₹ {ticketDetails.TotalAmount:F2}").FontSize(11).AlignRight().Bold().FontColor("white");
                });
                col.Item().Text("");
                col.Item().Row(r =>
                {
                    r.RelativeItem(3).Text("Payment Status:").FontSize(10).Bold();
                    r.RelativeItem(1).Text("✓ PAID").FontSize(10).AlignRight().FontColor("#22c55e").Bold();
                });
            });
        });

        container.PaddingTop(8);
        container.LineHorizontal(0.5f);
        container.PaddingTop(8);

        container.Row(row =>
        {
            row.RelativeItem(1).Column(col =>
            {
                col.Item().Text("VERIFICATION QR CODE").FontSize(11).Bold().FontColor("#1e40af").AlignCenter();
                col.Item().Text("");
                col.Item().Image(Convert.FromBase64String(qrCodeImage));
                col.Item().Text("Scan to verify booking").FontSize(8).AlignCenter().FontColor("#666");
            });

            row.RelativeItem(2).PaddingLeft(20).Column(col =>
            {
                col.Item().Text("BOOKING TERMS & CONDITIONS").FontSize(10).Bold().FontColor("#1e40af");
                col.Item().Text("");
                col.Item().Text("• Cancellation is allowed up to 30 days before travel date with 10% cancellation charges").FontSize(8).FontColor("#555");
                col.Item().Text("• Rescheduling is free if done 15 days before travel date").FontSize(8).FontColor("#555");
                col.Item().Text("• GST 18% is applicable on all bookings as per Indian tax regulations").FontSize(8).FontColor("#555");
                col.Item().Text("• A valid ID proof must be carried during travel").FontSize(8).FontColor("#555");
                col.Item().Text("• For changes/queries, contact support@travelling.com").FontSize(8).FontColor("#555");
            });
        });

        container.PaddingTop(10);
    }

    private void RenderFooter(IContainer container)
    {
        container.LineHorizontal(1);
        container.PaddingTop(5);
        container.Row(row =>
        {
            row.RelativeItem().Text("Thank you for choosing SuiteSavvy! Have a wonderful journey!").FontSize(9).FontColor("#1e40af").Bold().AlignCenter();
        });
        container.Row(row =>
        {
            row.RelativeItem().Text("For support, contact: support@suitesavvy.com | Phone: +91-9876543210").FontSize(8).FontColor("#666").AlignCenter();
        });
        container.Row(row =>
        {
            row.RelativeItem().Text($"Ticket generated on: {DateTime.UtcNow:dd MMM yyyy HH:mm:ss}").FontSize(7).FontColor("#999").AlignCenter();
        });
    }

    public string GenerateQrCodeAsBase64(TicketQrData qrData)
    {
        try
        {
            _logger.LogInformation("Generating QR code for booking {BookingId}", qrData.BookingId);

            var jsonData = JsonSerializer.Serialize(qrData);

            using (var qrGenerator = new QRCodeGenerator())
            {
                var qrCodeData = qrGenerator.CreateQrCode(jsonData, QRCodeGenerator.ECCLevel.Q);
                using (var qrCode = new PngByteQRCode(qrCodeData))
                {
                    var qrCodeImage = qrCode.GetGraphic(20);
                    var base64String = Convert.ToBase64String(qrCodeImage);
                    _logger.LogInformation("Successfully generated QR code for booking {BookingId}", qrData.BookingId);
                    return base64String;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate QR code for booking {BookingId}: {Message}",
                qrData.BookingId, ex.Message);
            throw;
        }
    }

    private string GenerateTicketNumber(int bookingId)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
        return $"TKT-{timestamp}-{bookingId:D6}";
    }
}
