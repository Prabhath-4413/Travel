namespace Travel.Api.Services
{
    public interface IEmailService
    {
        Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
    }

    public class EmailMessage
    {
        public required string ToEmail { get; init; }
        public string? ToName { get; init; }
        public required string Subject { get; init; }
        public required string Body { get; init; }
        public bool IsHtml { get; init; }
    }
}