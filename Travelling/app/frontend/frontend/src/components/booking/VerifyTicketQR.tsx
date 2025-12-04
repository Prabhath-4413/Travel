import React, { useRef, useState } from 'react';
import { QrCode, CheckCircle, XCircle, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiBaseUrl } from '../../lib/api';
import axios from 'axios';

interface QRVerificationResponse {
  isValid: boolean;
  bookingId?: number;
  userEmail?: string;
  travelDate?: string;
  message?: string;
}

interface VerifyTicketQRProps {
  className?: string;
}

const VerifyTicketQR: React.FC<VerifyTicketQRProps> = ({ className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<QRVerificationResponse | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('image')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imageData = e.target?.result as string;
          
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.src = imageData;
          
          img.onload = async () => {
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);

            const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
            
            if (!imageData) {
              toast.error('Failed to process image');
              setIsVerifying(false);
              return;
            }

            try {
              const jsQR = (await import('jsqr')).default;
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              if (!code) {
                toast.error('No QR code found in image');
                setIsVerifying(false);
                return;
              }

              const qrData = code.data;
              
              const apiUrl = getApiBaseUrl();
              const response = await axios.post<QRVerificationResponse>(
                `${apiUrl}/api/bookings/verify-booking`,
                { qrData },
                {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  withCredentials: true,
                }
              );

              setVerificationResult(response.data);
              
              if (response.data.isValid) {
                toast.success('Booking verified successfully!');
              } else {
                toast.error(response.data.message || 'Booking verification failed');
              }
            } catch (error) {
              console.error('Verification error:', error);
              toast.error('Failed to verify booking');
            } finally {
              setIsVerifying(false);
            }
          };
        } catch (error) {
          console.error('Error processing file:', error);
          toast.error('Failed to process image');
          setIsVerifying(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Failed to read file');
      setIsVerifying(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <QrCode className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">Verify Booking QR Code</h3>
        </div>
        
        <p className="text-gray-600 text-sm mb-4">
          Upload a screenshot of your booking ticket QR code to verify its authenticity and get booking details.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isVerifying}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            bg-blue-600 hover:bg-blue-700 text-white font-semibold
            transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Upload className="w-5 h-5" />
          {isVerifying ? 'Verifying...' : 'Upload QR Code Image'}
        </button>
      </div>

      {verificationResult && (
        <div className={`
          p-4 rounded-lg border-2 transition duration-200
          ${verificationResult.isValid 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'}
        `}>
          <div className="flex items-start gap-3">
            {verificationResult.isValid ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            
            <div className="flex-1">
              <h4 className={`font-semibold ${verificationResult.isValid ? 'text-green-800' : 'text-red-800'}`}>
                {verificationResult.isValid ? 'Booking Verified' : 'Verification Failed'}
              </h4>
              
              <p className={`text-sm mt-1 ${verificationResult.isValid ? 'text-green-700' : 'text-red-700'}`}>
                {verificationResult.message}
              </p>

              {verificationResult.isValid && verificationResult.bookingId && (
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-gray-700">Booking ID:</span>
                    <span className="ml-2 text-gray-600">{verificationResult.bookingId}</span>
                  </p>
                  {verificationResult.userEmail && (
                    <p>
                      <span className="font-semibold text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-600">{verificationResult.userEmail}</span>
                    </p>
                  )}
                  {verificationResult.travelDate && (
                    <p>
                      <span className="font-semibold text-gray-700">Travel Date:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(verificationResult.travelDate).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyTicketQR;
