import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { TicketBookingData, CompanyDetails, TicketPdfOptions } from "../types/ticketPdf";

const DEFAULT_COMPANY_DETAILS: CompanyDetails = {
  name: "Travelling",
  address: "123 Travel Street, India",
  phone: "+91-9876543210",
  email: "info@travelling.com",
  website: "www.travelling.com",
  gstNumber: "18AABCU9603R1Z0",
};

const DEFAULT_TERMS = `1. The booking is confirmed upon payment completion.
2. Cancellation is allowed up to 7 days before travel date with 20% deduction.
3. All terms and conditions are subject to our booking policy.
4. For grievances, contact our support team.`;

async function generateQRCodeImage(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: 200,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function generateTicketPDF(
  booking: TicketBookingData,
  options: Partial<TicketPdfOptions> = {},
): Promise<void> {
  try {
    const companyDetails = options.companyDetails || DEFAULT_COMPANY_DETAILS;
    const fileName = options.fileName || `booking-${booking.bookingId}-ticket.pdf`;
    const termsAndConditions = options.termsAndConditions || DEFAULT_TERMS;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    autoTable(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    let yPosition = margin;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(31, 41, 55);
    doc.text(companyDetails.name, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`${companyDetails.address}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 4;
    doc.text(
      `Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`,
      pageWidth / 2,
      yPosition,
      { align: "center" },
    );
    yPosition += 4;
    doc.text(`Website: ${companyDetails.website} | GST: ${companyDetails.gstNumber}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text("Booking Confirmation Ticket", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 8;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text("BOOKING DETAILS", margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);

    const bookingDetailsData = [
      [`Booking ID: #${booking.bookingId}`, `Date: ${formatDate(booking.date)}`],
      [`Package: ${booking.packageName}`, `Destination: ${booking.destination}`],
      [`Passengers: ${booking.persons}`, `Payment Status: ${booking.paymentStatus}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: bookingDetailsData,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        font: "Helvetica",
        fontSize: 9,
        textColor: [75, 85, 99],
        cellPadding: 3,
        border: "none",
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 2 },
        1: { cellWidth: contentWidth / 2 },
      },
    });

    yPosition = (doc as any).lastAutoTable?.finalY ?? yPosition + 15 + 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text("CUSTOMER INFORMATION", margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);

    const customerData = [
      [`Name: ${booking.userName}`, `Email: ${booking.userEmail}`],
      booking.userPhone ? [`Phone: ${booking.userPhone}`, ""] : ["", ""],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: customerData,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        font: "Helvetica",
        fontSize: 9,
        textColor: [75, 85, 99],
        cellPadding: 3,
        border: "none",
      },
      columnStyles: {
        0: { cellWidth: contentWidth / 2 },
        1: { cellWidth: contentWidth / 2 },
      },
    });

    yPosition = (doc as any).lastAutoTable?.finalY ?? yPosition + 15 + 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text("PRICE BREAKDOWN", margin, yPosition);
    yPosition += 6;

    const priceData = [
      ["Subtotal", `₹${booking.subTotal.toFixed(2)}`],
      ["GST (18%)", `₹${booking.gstAmount.toFixed(2)}`],
      ["Total Amount", `₹${booking.totalAmount.toFixed(2)}`],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: priceData,
      margin: { left: margin, right: margin },
      theme: "plain",
      styles: {
        font: "Helvetica",
        fontSize: 9,
        textColor: [75, 85, 99],
        cellPadding: 3,
        border: "none",
      },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.7 },
        1: { cellWidth: contentWidth * 0.3, halign: "right" },
      },
    });

    yPosition = (doc as any).lastAutoTable?.finalY ?? yPosition + 15 + 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    doc.text("BOOKING REFERENCE", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 6;

    const qrCodeData = JSON.stringify({
      bookingId: booking.bookingId,
      email: booking.userEmail,
      date: booking.date,
    });

    const qrCodeImage = await generateQRCodeImage(qrCodeData);
    const qrSize = 40;
    const qrX = pageWidth / 2 - qrSize / 2;
    doc.addImage(qrCodeImage, "PNG", qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + 4;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("Scan this QR code to verify your booking", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 6;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 6;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text("TERMS & CONDITIONS", margin, yPosition);
    yPosition += 5;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);

    const splitTerms = doc.splitTextToSize(termsAndConditions, contentWidth);
    doc.text(splitTerms, margin, yPosition);

    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(
      "Thank you for booking with us! We wish you an amazing travel experience.",
      pageWidth / 2,
      pageHeight - 15,
      { align: "center" },
    );

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      `Generated on: ${new Date().toLocaleString("en-IN")}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );

    doc.save(fileName);
  } catch (error) {
    console.error("Error generating ticket PDF:", error);
    throw new Error(`Failed to generate ticket PDF: ${error}`);
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
