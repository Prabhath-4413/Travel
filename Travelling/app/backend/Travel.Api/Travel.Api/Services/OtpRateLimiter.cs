using Microsoft.Extensions.Logging;
using Travel.Api.Exceptions;

namespace Travel.Api.Services;

public interface IOtpRateLimiter
{
    Task<(bool Allowed, string Message)> CheckRateLimitAsync(int bookingId);
    Task RecordOtpRequestAsync(int bookingId);
    Task ValidateRateLimitAsync(int bookingId);
}

public class OtpRateLimiter : IOtpRateLimiter
{
    private readonly Dictionary<int, List<DateTime>> _otpRequests = new();
    private readonly object _lockObject = new();
    private readonly ILogger<OtpRateLimiter> _logger;

    private const int OtpPerBookingSeconds = 60;
    private const int MaxRequestsIn10Minutes = 5;
    private const int WindowMinutes = 10;

    public OtpRateLimiter(ILogger<OtpRateLimiter> logger)
    {
        _logger = logger;
    }

    public async Task<(bool Allowed, string Message)> CheckRateLimitAsync(int bookingId)
    {
        return await Task.Run(() =>
        {
            lock (_lockObject)
            {
                var now = DateTime.UtcNow;

                if (!_otpRequests.ContainsKey(bookingId))
                {
                    _logger.LogInformation("OTP rate limit check for booking {BookingId}: No previous requests", bookingId);
                    return (true, "OTP request allowed");
                }

                var requests = _otpRequests[bookingId];
                var cutoffTime10Min = now.AddMinutes(-WindowMinutes);
                var requestsIn10Minutes = requests.Where(r => r > cutoffTime10Min).ToList();

                var cutoffTime60Sec = now.AddSeconds(-OtpPerBookingSeconds);
                var requestsIn60Sec = requestsIn10Minutes.Where(r => r > cutoffTime60Sec).ToList();

                if (requestsIn60Sec.Count > 0)
                {
                    var secondsUntilRetry = OtpPerBookingSeconds - (int)(now - requestsIn60Sec[0]).TotalSeconds;
                    _logger.LogWarning(
                        "OTP rate limit exceeded for booking {BookingId}: 60-second limit. Retry after {Seconds} seconds",
                        bookingId, secondsUntilRetry);
                    return (false, $"Please wait {secondsUntilRetry} seconds before requesting a new OTP");
                }

                if (requestsIn10Minutes.Count >= MaxRequestsIn10Minutes)
                {
                    _logger.LogWarning(
                        "OTP rate limit exceeded for booking {BookingId}: 10-minute limit ({Count}/{Max} requests)",
                        bookingId, requestsIn10Minutes.Count, MaxRequestsIn10Minutes);
                    var minutesUntilRetry = WindowMinutes - (int)(now - requestsIn10Minutes[0]).TotalMinutes;
                    return (false, $"Too many OTP requests. Please try again after {minutesUntilRetry} minutes");
                }

                _logger.LogInformation(
                    "OTP rate limit check for booking {BookingId}: Allowed ({Count}/{Max} requests in 10 minutes)",
                    bookingId, requestsIn10Minutes.Count, MaxRequestsIn10Minutes);
                return (true, "OTP request allowed");
            }
        });
    }

    public async Task RecordOtpRequestAsync(int bookingId)
    {
        await Task.Run(() =>
        {
            lock (_lockObject)
            {
                if (!_otpRequests.ContainsKey(bookingId))
                {
                    _otpRequests[bookingId] = new List<DateTime>();
                }

                _otpRequests[bookingId].Add(DateTime.UtcNow);
                _logger.LogInformation("Recorded OTP request for booking {BookingId} at {Timestamp}", bookingId, DateTime.UtcNow);

                var cutoffTime = DateTime.UtcNow.AddMinutes(-WindowMinutes);
                _otpRequests[bookingId] = _otpRequests[bookingId]
                    .Where(r => r > cutoffTime)
                    .ToList();
            }
        });
    }

    public async Task ValidateRateLimitAsync(int bookingId)
    {
        var (allowed, message) = await CheckRateLimitAsync(bookingId);
        if (!allowed)
        {
            var now = DateTime.UtcNow;
            lock (_lockObject)
            {
                if (_otpRequests.ContainsKey(bookingId))
                {
                    var requests = _otpRequests[bookingId];
                    var cutoffTime60Sec = now.AddSeconds(-OtpPerBookingSeconds);
                    var requestsIn60Sec = requests.Where(r => r > cutoffTime60Sec).ToList();

                    if (requestsIn60Sec.Count > 0)
                    {
                        var secondsUntilRetry = OtpPerBookingSeconds - (int)(now - requestsIn60Sec[0]).TotalSeconds;
                        throw new RateLimitExceededException(message, secondsUntilRetry);
                    }

                    var cutoffTime10Min = now.AddMinutes(-WindowMinutes);
                    var requestsIn10Min = requests.Where(r => r > cutoffTime10Min).ToList();
                    if (requestsIn10Min.Count >= MaxRequestsIn10Minutes)
                    {
                        var minutesUntilRetry = WindowMinutes - (int)(now - requestsIn10Min[0]).TotalMinutes;
                        throw new RateLimitExceededException(message, minutesUntilRetry * 60);
                    }
                }
            }

            throw new RateLimitExceededException(message);
        }
    }
}
