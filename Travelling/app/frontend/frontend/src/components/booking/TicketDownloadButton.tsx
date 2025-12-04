import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { Download, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../lib/api';

interface TicketDownloadButtonProps {
  bookingId: number;
  className?: string;
}

interface ApiError {
  message?: string;
  error?: string;
}

const TicketDownloadButton: React.FC<TicketDownloadButtonProps> = ({ bookingId, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const downloadTicket = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Authentication token not found. Please log in.');
        setIsLoading(false);
        return;
      }

      const apiUrl = getApiBaseUrl();
      const response = await axios.get(
        `${apiUrl}/api/bookings/download-ticket/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          responseType: 'blob',
          withCredentials: true,
        }
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Ticket-${bookingId}-${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      
      if (axiosError.response?.status === 401) {
        toast.error('Unauthorized: Please log in again.');
      } else if (axiosError.response?.status === 403) {
        toast.error('Forbidden: You do not have access to this booking.');
      } else if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data?.message || 'Invalid request. Ticket can only be downloaded for paid bookings.';
        toast.error(errorMessage);
      } else if (axiosError.response?.status === 404) {
        toast.error('Booking not found.');
      } else {
        toast.error('Failed to download ticket. Please try again.');
      }
      
      console.error('Error downloading ticket:', axiosError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={downloadTicket}
      disabled={isLoading}
      className={`
        flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        bg-blue-600 hover:bg-blue-700 text-white font-semibold
        transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Download Ticket
        </>
      )}
    </button>
  );
};

export default TicketDownloadButton;
