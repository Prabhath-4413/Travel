using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Services;

public class ReviewService
{
    private readonly ApplicationDbContext _context;

    public ReviewService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewResponseDto> AddReviewAsync(ReviewRequestDto request)
    {
        // Check if user has already reviewed this destination
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == request.UserId && r.DestinationId == request.DestinationId);

        if (existingReview != null)
        {
            throw new InvalidOperationException("User has already reviewed this destination");
        }

        // Check if user has booked this destination
        var hasBooked = await _context.BookingDestinations
            .AnyAsync(bd => bd.DestinationId == request.DestinationId &&
                           _context.Bookings.Any(b => b.BookingId == bd.BookingId && b.UserId == request.UserId));

        if (!hasBooked)
        {
            throw new InvalidOperationException("User can only review destinations they have booked");
        }

        var review = new Review
        {
            UserId = request.UserId,
            DestinationId = request.DestinationId,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // Return response with user name
        var user = await _context.Users.FindAsync(request.UserId);
        return new ReviewResponseDto
        {
            ReviewId = review.ReviewId,
            UserId = review.UserId,
            UserName = user?.Name ?? "Unknown User",
            DestinationId = review.DestinationId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<List<ReviewResponseDto>> GetReviewsForDestinationAsync(int destinationId)
    {
        return await _context.Reviews
            .Where(r => r.DestinationId == destinationId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewResponseDto
            {
                ReviewId = r.ReviewId,
                UserId = r.UserId,
                UserName = r.User!.Name,
                DestinationId = r.DestinationId,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ReviewAverageDto> GetAverageRatingAsync(int destinationId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.DestinationId == destinationId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return new ReviewAverageDto
            {
                DestinationId = destinationId,
                AverageRating = 0,
                TotalReviews = 0
            };
        }

        return new ReviewAverageDto
        {
            DestinationId = destinationId,
            AverageRating = reviews.Average(r => r.Rating),
            TotalReviews = reviews.Count
        };
    }
}