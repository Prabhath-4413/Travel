using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;
using Travel.Api.Services;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly ReviewService _reviewService;
        private readonly ILogger<ReviewController> _logger;

        public ReviewController(ReviewService reviewService, ILogger<ReviewController> logger)
        {
            _reviewService = reviewService;
            _logger = logger;
        }

        /// <summary>
        /// Add a new review for a destination
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] ReviewRequestDto request)
        {
            try
            {
                if (request.Rating < 1 || request.Rating > 5)
                {
                    return BadRequest(new { message = "Rating must be between 1 and 5." });
                }

                var review = await _reviewService.AddReviewAsync(request);

                _logger.LogInformation($"Review added: ID={review.ReviewId}, User={review.UserId}, Destination={review.DestinationId}, Rating={review.Rating}");

                return Ok(new
                {
                    message = "Thank you for your review!",
                    review = review
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning($"Review validation failed: {ex.Message}");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error adding review: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while adding the review." });
            }
        }

        /// <summary>
        /// Get all reviews for a specific destination
        /// </summary>
        [HttpGet("{destinationId}")]
        public async Task<IActionResult> GetReviews(int destinationId)
        {
            _logger.LogInformation($"GetReviews called for destination {destinationId}");
            try
            {
                var reviews = await _reviewService.GetReviewsForDestinationAsync(destinationId);
                _logger.LogInformation($"Found {reviews.Count} reviews for destination {destinationId}");
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving reviews for destination {destinationId}: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving reviews." });
            }
        }

        /// <summary>
        /// Get average rating for a specific destination
        /// </summary>
        [HttpGet("average/{destinationId}")]
        public async Task<IActionResult> GetAverageRating(int destinationId)
        {
            _logger.LogInformation($"GetAverageRating called for destination {destinationId}");
            try
            {
                var average = await _reviewService.GetAverageRatingAsync(destinationId);
                _logger.LogInformation($"Average rating for destination {destinationId}: {average.AverageRating}");
                return Ok(average);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving average rating for destination {destinationId}: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving average rating." });
            }
        }
    }
}