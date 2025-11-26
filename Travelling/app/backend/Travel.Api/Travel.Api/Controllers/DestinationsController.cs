using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DestinationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DestinationsController> _logger;

        public DestinationsController(ApplicationDbContext context, ILogger<DestinationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetDestinations()
        {
            try
            {
                var destinations = await _context.Destinations
                    .AsNoTracking()
                    .OrderBy(d => d.Name)
                    .ToListAsync();

                return Ok(destinations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving destinations");
                return StatusCode(500, new { message = "An error occurred while retrieving destinations." });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetDestination(int id)
        {
            try
            {
                var destination = await _context.Destinations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(d => d.DestinationId == id);

                if (destination == null)
                {
                    return NotFound(new { message = "Destination not found." });
                }

                return Ok(destination);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving destination");
                return StatusCode(500, new { message = "An error occurred while retrieving the destination." });
            }
        }
    }
}
