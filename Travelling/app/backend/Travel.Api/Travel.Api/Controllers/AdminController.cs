using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get admin statistics for dashboard
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var totalUsers = await _context.Users.CountAsync();
                var totalBookings = await _context.Bookings.CountAsync();
                var paidBookings = await _context.Bookings.CountAsync(b => b.Status == BookingStatus.Paid);
                var averageRating = await _context.Reviews.AnyAsync()
                    ? await _context.Reviews.AverageAsync(r => r.Rating)
                    : 0.0;

                // Get top 5 destinations by booking count
                var topDestinations = await _context.BookingDestinations
                    .GroupBy(bd => bd.DestinationId)
                    .Select(g => new
                    {
                        DestinationId = g.Key,
                        Bookings = g.Count()
                    })
                    .OrderByDescending(x => x.Bookings)
                    .Take(5)
                    .Join(_context.Destinations,
                        bd => bd.DestinationId,
                        d => d.DestinationId,
                        (bd, d) => new TopDestinationDto
                        {
                            Name = d.Name,
                            Bookings = bd.Bookings
                        })
                    .ToListAsync();

                var stats = new AdminStatsDto
                {
                    TotalUsers = totalUsers,
                    TotalBookings = totalBookings,
                    PaidBookings = paidBookings,
                    AverageRating = Math.Round(averageRating, 2),
                    TopDestinations = topDestinations
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error retrieving admin stats: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while retrieving statistics." });
            }
        }
    }
}