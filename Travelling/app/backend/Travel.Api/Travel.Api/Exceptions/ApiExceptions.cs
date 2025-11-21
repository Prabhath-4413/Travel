namespace Travel.Api.Exceptions;

public class ApiException : Exception
{
    public int StatusCode { get; set; }
    public string? ErrorCode { get; set; }

    public ApiException(string message, int statusCode = 500, string? errorCode = null) 
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }
}

public class RateLimitExceededException : ApiException
{
    public int? RetryAfterSeconds { get; set; }

    public RateLimitExceededException(string message, int? retryAfterSeconds = null) 
        : base(message, 429, "RATE_LIMIT_EXCEEDED")
    {
        RetryAfterSeconds = retryAfterSeconds;
    }
}

public class ValidationException : ApiException
{
    public ValidationException(string message) 
        : base(message, 400, "VALIDATION_ERROR")
    {
    }
}

public class NotFoundException : ApiException
{
    public NotFoundException(string message) 
        : base(message, 404, "NOT_FOUND")
    {
    }
}

public class UnauthorizedException : ApiException
{
    public UnauthorizedException(string message = "Unauthorized") 
        : base(message, 401, "UNAUTHORIZED")
    {
    }
}

public class ForbiddenException : ApiException
{
    public ForbiddenException(string message = "Forbidden") 
        : base(message, 403, "FORBIDDEN")
    {
    }
}
