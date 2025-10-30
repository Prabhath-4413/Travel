using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TripCancellationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMessageQueueService _messageQueue;
        private readonly IEmailTemplateBuilder _templateBuilder;
        private readonly ILogger<TripCancellationController> _logger;

        public TripCancellationController(
            ApplicationDbContext context, 
            IMessageQueueService messageQueue, 
            IEmailTemplateBuilder templateBuilder,
            ILogger<TripCancellationController> logger)
        {
            _context = context;
            _messageQueue = messageQueue;
            _templateBuilder = templateBuilder;
            _logger = logger;
        }

        [HttpPost("request")]
        [Authorize(Roles = "user")]
        public async Task<IActionResult> RequestCancellation([FromBody] TripCancellationRequestDto requestDto)
        {
            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.BookingDestinations)
                .ThenInclude(bd => bd.Destination)
                .FirstOrDefaultAsync(b => b.BookingId == requestDto.BookingId && b.UserId == requestDto.UserId);

            if (booking is null)
            {
                return NotFound(new { message = "Booking not found." });
            }

            if (booking.CancellationStatus == CancellationStatus.Approved)
            {
                return BadRequest(new { message = "Booking has already been cancelled." });
            }

            if (booking.CancellationStatus == CancellationStatus.Requested)
            {
                return BadRequest(new { message = "Cancellation already requested." });
            }

            booking.CancellationStatus = CancellationStatus.Requested;

            var cancellation = new TripCancellation
            {
                BookingId = booking.BookingId,
                UserId = booking.UserId,
                Reason = requestDto.Reason,
                RequestedAt = DateTime.UtcNow,
                Status = (int)TripCancellationStatus.Pending
            };

            _context.TripCancellations.Add(cancellation);
            await _context.SaveChangesAsync();

            // Publish cancellation request message to RabbitMQ
            var cancellationMessage = new CancellationMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                Type = MessageType.CancellationRequested,
                CancellationId = cancellation.TripCancellationId,
                BookingId = booking.BookingId,
                UserId = booking.UserId,
                UserName = booking.User!.Name,
                UserEmail = booking.User.Email,
                Reason = requestDto.Reason,
                RequestedAt = cancellation.RequestedAt,
                Status = (int)cancellation.Status,
                Destination = string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination!.Name)),
                TripStartDate = booking.StartDate,
                Nights = booking.Nights
            };

            await _messageQueue.PublishMessageAsync("travel.bookings", cancellationMessage);
            _logger.LogInformation("📤 Cancellation request message published for booking #{BookingId}", booking.BookingId);

            // Send admin notification
            var adminEmail = "admin@example.com"; // Or fetch from configuration
            var adminBody = _templateBuilder.BuildCancellationRequestedAdminBody(cancellation, booking);
            var adminNotification = new AdminNotificationMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                Type = MessageType.AdminNotification,
                AdminEmail = adminEmail,
                Subject = $"New Trip Cancellation Request - Booking #{booking.BookingId}",
                Body = adminBody
            };

            await _messageQueue.PublishAdminNotificationAsync(adminNotification);
            _logger.LogInformation("📤 Admin notification sent for cancellation request #{CancellationId}", cancellation.TripCancellationId);

            return Ok(new
            {
                message = "Cancellation request submitted.",
                cancellationStatus = booking.CancellationStatus,
                tripCancellationId = cancellation.TripCancellationId
            });
        }

        [HttpGet("pending")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<IEnumerable<TripCancellationSummaryDto>>> GetPendingCancellations()
        {
            var pending = await _context.TripCancellations
                .Include(tc => tc.Booking)!
                    .ThenInclude(b => b!.BookingDestinations)
                    .ThenInclude(bd => bd.Destination)
                .Include(tc => tc.User)
                .Where(tc => tc.Status == (int)TripCancellationStatus.Pending)
                .OrderBy(tc => tc.RequestedAt)
                .Select(tc => new TripCancellationSummaryDto
                {
                    TripCancellationId = tc.TripCancellationId,
                    BookingId = tc.BookingId,
                    UserId = tc.UserId,
                    UserName = tc.User!.Name,
                    UserEmail = tc.User.Email,
                    Status = tc.Status,
                    BookingCancellationStatus = tc.Booking!.CancellationStatus,
                    RequestedAt = tc.RequestedAt,
                    Reason = tc.Reason,
                    TotalPrice = tc.Booking.TotalPrice,
                    Nights = tc.Booking.Nights,
                    StartDate = tc.Booking.BookingDate,
                    Destinations = tc.Booking.BookingDestinations.Select(bd => bd.Destination!.Name)
                })
                .ToListAsync();

            return Ok(pending);
        }

        [HttpPost("approve")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ApproveCancellation([FromBody] TripCancellationDecisionDto decisionDto)
        {
            var cancellation = await _context.TripCancellations
                .Include(tc => tc.Booking)
                    .ThenInclude(b => b!.User)
                .Include(tc => tc.Booking)
                    .ThenInclude(b => b!.BookingDestinations)
                    .ThenInclude(bd => bd!.Destination)
                .FirstOrDefaultAsync(tc => tc.TripCancellationId == decisionDto.TripCancellationId);

            if (cancellation is null)
            {
                return NotFound(new { message = "Cancellation request not found." });
            }

            if (cancellation.Status != TripCancellationStatus.Pending)
            {
                return BadRequest(new { message = "Cancellation request already processed." });
            }

            cancellation.Status = TripCancellationStatus.Approved;
            cancellation.ReviewedAt = DateTime.UtcNow;
            cancellation.AdminComment = decisionDto.AdminComment;

            var booking = cancellation.Booking!;
            booking.CancellationStatus = CancellationStatus.Approved;
            booking.Status = BookingStatus.Cancelled;
            booking.Confirmed = false;

            await _context.SaveChangesAsync();

            // Publish cancellation decision message to RabbitMQ
            var decisionMessage = new CancellationMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                Type = MessageType.CancellationDecision,
                CancellationId = cancellation.TripCancellationId,
                BookingId = booking.BookingId,
                UserId = booking.UserId,
                UserName = booking.User!.Name,
                UserEmail = booking.User.Email,
                Reason = cancellation.Reason,
                RequestedAt = cancellation.RequestedAt,
                ReviewedAt = cancellation.ReviewedAt,
                Status = (int)cancellation.Status,
                AdminComment = decisionDto.AdminComment,
                Destination = string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination!.Name)),
                TripStartDate = booking.StartDate,
                Nights = booking.Nights,
                Approved = true
            };

            await _messageQueue.PublishMessageAsync("travel.bookings", decisionMessage);
            _logger.LogInformation("📤 Cancellation approval message published for booking #{BookingId}", booking.BookingId);

            return Ok(new { message = "Cancellation approved." });
        }

        [HttpPost("reject")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RejectCancellation([FromBody] TripCancellationDecisionDto decisionDto)
        {
            var cancellation = await _context.TripCancellations
                .Include(tc => tc.Booking)
                    .ThenInclude(b => b!.User)
                .Include(tc => tc.Booking)
                    .ThenInclude(b => b!.BookingDestinations)
                    .ThenInclude(bd => bd!.Destination)
                .FirstOrDefaultAsync(tc => tc.TripCancellationId == decisionDto.TripCancellationId);

            if (cancellation is null)
            {
                return NotFound(new { message = "Cancellation request not found." });
            }

            if (cancellation.Status != TripCancellationStatus.Pending)
            {
                return BadRequest(new { message = "Cancellation request already processed." });
            }

            cancellation.Status = TripCancellationStatus.Rejected;
            cancellation.ReviewedAt = DateTime.UtcNow;
            cancellation.AdminComment = decisionDto.AdminComment;

            var booking = cancellation.Booking!;
            booking.CancellationStatus = CancellationStatus.Rejected;
            booking.Status = BookingStatus.Active;

            await _context.SaveChangesAsync();

            // Publish cancellation rejection message to RabbitMQ
            var rejectionMessage = new CancellationMessage
            {
                MessageId = Guid.NewGuid().ToString(),
                Type = MessageType.CancellationDecision,
                CancellationId = cancellation.TripCancellationId,
                BookingId = booking.BookingId,
                UserId = booking.UserId,
                UserName = booking.User!.Name,
                UserEmail = booking.User.Email,
                Reason = cancellation.Reason,
                RequestedAt = cancellation.RequestedAt,
                ReviewedAt = cancellation.ReviewedAt,
                Status = (int)cancellation.Status,
                AdminComment = decisionDto.AdminComment,
                Destination = string.Join(", ", booking.BookingDestinations.Select(bd => bd.Destination!.Name)),
                TripStartDate = booking.StartDate,
                Nights = booking.Nights,
                Approved = false
            };

            await _messageQueue.PublishMessageAsync("travel.bookings", rejectionMessage);
            _logger.LogInformation("📤 Cancellation rejection message published for booking #{BookingId}", booking.BookingId);

            return Ok(new { message = "Cancellation rejected." });
        }
    }
}