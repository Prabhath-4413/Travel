export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  logoUrl?: string;
}

export interface TicketBookingData {
  bookingId: number;
  userName: string;
  userEmail: string;
  userPhone?: string;
  packageName: string;
  destination: string;
  date: string;
  persons: number;
  subTotal: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: string;
}

export interface TicketPdfOptions {
  fileName?: string;
  companyDetails: CompanyDetails;
  termsAndConditions?: string;
}
