using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using QRCoder;

namespace Travel.Api.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailService> _logger;
        private const int MaxRetries = 3;
        private const int RetryDelayMs = 2000;

        public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Email sending initiated - To: {To}, Subject: {Subject}", message.ToEmail, message.Subject);

            var smtpSettings = _configuration.GetSection("EmailSettings");

            var host = smtpSettings.GetValue<string>("SmtpServer");
            var port = smtpSettings.GetValue<int?>("SmtpPort");
            var username = smtpSettings.GetValue<string>("SenderEmail");
            var password = smtpSettings.GetValue<string>("SenderPassword");
            var fromAddress = smtpSettings.GetValue<string>("SenderEmail");


            if (string.IsNullOrWhiteSpace(host) || port is null or 0 ||
                string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(fromAddress))
            {
                _logger.LogError("SMTP configuration incomplete - Host: {Host}, Port: {Port}, Username: {Username}, From: {From}. " +
                    "Please check appsettings.json configuration.", 
                    host ?? "[NULL]", port ?? 0, username ?? "[NULL]", fromAddress ?? "[NULL]");
                throw new InvalidOperationException("SMTP settings are incomplete. Please configure Host, Port, Username, Password, and From in appsettings.json");
            }

            _logger.LogInformation("SMTP Configuration loaded - Host: {Host}:{Port}, From: {From}", host, port, fromAddress);

            var mimeMessage = new MimeMessage();
            mimeMessage.From.Add(new MailboxAddress("Travel App", fromAddress));
            mimeMessage.To.Add(new MailboxAddress(message.ToName ?? message.ToEmail, message.ToEmail));
            mimeMessage.Subject = message.Subject;
            mimeMessage.Body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = message.Body
            };

            _logger.LogInformation("MimeMessage constructed - From: {From}, To: {To}, Subject: {Subject}", 
                fromAddress, message.ToEmail, message.Subject);

            int attempt = 0;
            while (attempt < MaxRetries)
            {
                using var smtpClient = new SmtpClient();
                try
                {
                    attempt++;
                    _logger.LogInformation("Attempting SMTP connection (Attempt {Attempt}/{MaxRetries}) - Host: {Host}:{Port}", 
                        attempt, MaxRetries, host, port);

                    await smtpClient.ConnectAsync(host, port.Value, SecureSocketOptions.StartTls, cancellationToken);
                    _logger.LogInformation("SMTP connection established successfully - Host: {Host}:{Port}", host, port);

                    _logger.LogInformation("Attempting SMTP authentication - Username: {Username}", username);
                    await smtpClient.AuthenticateAsync(username, password, cancellationToken);
                    _logger.LogInformation("SMTP authentication succeeded - Username: {Username}", username);

                    _logger.LogInformation("Sending email message - To: {To}, Subject: {Subject}", message.ToEmail, message.Subject);
                    await smtpClient.SendAsync(mimeMessage, cancellationToken);
                    _logger.LogInformation("Email sent successfully - To: {To}, Subject: {Subject}", message.ToEmail, message.Subject);

                    _logger.LogInformation("Disconnecting from SMTP server - Host: {Host}:{Port}", host, port);
                    await smtpClient.DisconnectAsync(true, cancellationToken);
                    _logger.LogInformation("SMTP disconnection completed gracefully");

                    return;
                }
                catch (OperationCanceledException ex)
                {
                    _logger.LogError(ex, "Email sending was cancelled - To: {To}, Subject: {Subject}", message.ToEmail, message.Subject);
                    throw;
                }
                catch (MailKit.Security.AuthenticationException ex)
                {
                    _logger.LogError(ex, "SMTP authentication failed - Username: {Username}. Verify App Password is correct.", username);
                    throw;
                }
                catch (MailKit.ServiceNotConnectedException ex)
                {
                    _logger.LogWarning(ex, "SMTP service not connected (Attempt {Attempt}/{MaxRetries}) - Host: {Host}:{Port}. Retrying...", 
                        attempt, MaxRetries, host, port);
                    
                    if (attempt >= MaxRetries)
                    {
                        _logger.LogError(ex, "Failed to send email after {MaxRetries} attempts - To: {To}, Subject: {Subject}", 
                            MaxRetries, message.ToEmail, message.Subject);
                        throw;
                    }

                    await Task.Delay(RetryDelayMs, cancellationToken);
                }
                catch (MailKit.ServiceNotAuthenticatedException ex)
                {
                    _logger.LogWarning(ex, "SMTP service not authenticated (Attempt {Attempt}/{MaxRetries}). Retrying...", attempt, MaxRetries);
                    
                    if (attempt >= MaxRetries)
                    {
                        _logger.LogError(ex, "Failed to authenticate after {MaxRetries} attempts - To: {To}", MaxRetries, message.ToEmail);
                        throw;
                    }

                    await Task.Delay(RetryDelayMs, cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unexpected error sending email (Attempt {Attempt}/{MaxRetries}) - To: {To}, Subject: {Subject}. Exception Type: {ExceptionType}", 
                        attempt, MaxRetries, message.ToEmail, message.Subject, ex.GetType().Name);

                    if (attempt >= MaxRetries)
                    {
                        _logger.LogError(ex, "Failed to send email after {MaxRetries} attempts due to {ExceptionType} - To: {To}, Subject: {Subject}", 
                            MaxRetries, ex.GetType().Name, message.ToEmail, message.Subject);
                        throw;
                    }

                    await Task.Delay(RetryDelayMs, cancellationToken);
                }
            }
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new EmailMessage
            {
                ToEmail = toEmail,
                Subject = subject,
                Body = body,
                IsHtml = true
            };

            await SendAsync(message);
        }

        public string GenerateQrCode(string data)
        {
            // Note: Requires QRCoder NuGet package
            // Install-Package QRCoder

            using var qrGenerator = new QRCoder.QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(data, QRCoder.QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new QRCoder.PngByteQRCode(qrCodeData);
            var qrCodeBytes = qrCode.GetGraphic(20);

            return Convert.ToBase64String(qrCodeBytes);
        }
    }
}