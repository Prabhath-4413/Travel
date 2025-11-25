namespace Travel.Api.Services
{
    public interface IBookingService
    {
        Task<(bool Success, string Message)> ConfirmBookingWithOtpAsync(int bookingId, string email);
        Task<(bool Success, string Message)> RescheduleBookingAsync(int bookingId, string email, DateTime newStartDate, int? newDestinationId);
    }
}
