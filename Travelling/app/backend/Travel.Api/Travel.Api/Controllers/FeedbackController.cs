using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FeedbackController> _logger;

        public FeedbackController(ApplicationDbContext context, ILogger<FeedbackController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Submit new feedback with name, email, message, and rating
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SubmitFeedback([FromBody] CreateFeedbackDto feedbackDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(feedbackDto.Message))
                {
                    return BadRequest(new { message = "Message is required." });
                }

                if (feedbackDto.Rating < 1 || feedbackDto.Rating > 5)
                {
                    return BadRequest(new { message = "Rating must be between 1 and 5." });
                }

                var feedback = new Feedback
                {
                    Name = feedbackDto.Name?.Trim(),
                    Email = feedbackDto.Email?.Trim(),
                    Message = feedbackDto.Message.Trim(),
                    Rating = feedbackDto.Rating,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Feedbacks.Add(feedback);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Feedback submitted: ID={feedback.FeedbackId}, Rating={feedback.Rating}");

                return Ok(new {
                    message = "Thank you for your feedback!",
                    feedbackId = feedback.FeedbackId,
                    createdAt = feedback.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error submitting feedback: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while submitting feedback." });
            }
        }

        /// <summary>
        /// Get recent feedbacks sorted by creation date (latest first)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetFeedbacks([FromQuery] int limit = 10)
        {
            try
            {
                if (limit <= 0 || limit > 100)
                {
                    limit = 10;
                }

                var feedbacks = await _context.Feedbacks
                    .OrderByDescending(f => f.CreatedAt)
                    .Take(limit)
                    .Select(f => new
                    {
                        f.FeedbackId,
                        f.Name,
                        f.Email,
                        f.Message,
                        f.Rating,
                        f.CreatedAt
                    })
                    .ToListAsync();

                return Ok(feedbacks);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving feedbacks: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving feedbacks." });
            }
        }

        /// <summary>
        /// Get feedback statistics (average rating, total count)
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetFeedbackStats()
        {
            try
            {
                var totalCount = await _context.Feedbacks.CountAsync();
                
                if (totalCount == 0)
                {
                    return Ok(new
                    {
                        totalCount = 0,
                        averageRating = 0,
                        ratingDistribution = new { }
                    });
                }

                var averageRating = await _context.Feedbacks
                    .AverageAsync(f => f.Rating);

                var ratingDistribution = await _context.Feedbacks
                    .GroupBy(f => f.Rating)
                    .Select(g => new { rating = g.Key, count = g.Count() })
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    averageRating = Math.Round(averageRating, 2),
                    ratingDistribution = ratingDistribution
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving feedback stats: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics." });
            }
        }
    }

    /// <summary>
    /// DTO for creating feedback
    /// </summary>
    public class CreateFeedbackDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string Message { get; set; } = string.Empty;
        public int Rating { get; set; }
    }
}
