using System.Text.Json;
using Microsoft.Extensions.Logging;
using Travel.Api.Exceptions;

namespace Travel.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        if (exception is ApiException apiEx)
        {
            context.Response.StatusCode = apiEx.StatusCode;
            response.StatusCode = apiEx.StatusCode;
            response.Message = apiEx.Message;
            response.ErrorCode = apiEx.ErrorCode;

            if (apiEx is RateLimitExceededException rateLimitEx && rateLimitEx.RetryAfterSeconds.HasValue)
            {
                context.Response.Headers["Retry-After"] = rateLimitEx.RetryAfterSeconds.ToString();
                response.RetryAfter = rateLimitEx.RetryAfterSeconds;
            }
        }
        else
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            response.StatusCode = StatusCodes.Status500InternalServerError;
            response.Message = "An internal server error occurred";
            response.ErrorCode = "INTERNAL_SERVER_ERROR";
        }

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);
        return context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? ErrorCode { get; set; }
    public int? RetryAfter { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
