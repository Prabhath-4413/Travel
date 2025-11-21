namespace Travel.Api.Services
{
    public interface IBookingService
    {
        Task<(bool Success, string Message)> ConfirmBookingWithOtpAsync(int bookingId, string email);
    }
}
