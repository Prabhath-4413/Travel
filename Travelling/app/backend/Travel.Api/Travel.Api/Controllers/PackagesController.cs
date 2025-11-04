using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Travel.Api.Data;
using Travel.Api.Models;

namespace Travel.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PackagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PackagesController> _logger;

        public PackagesController(ApplicationDbContext context, ILogger<PackagesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetPackages()
        {
            var packages = await _context.TravelPackages
                .Include(p => p.TravelPackageDestinations)
                    .ThenInclude(tpd => tpd.Destination)
                .AsNoTracking()
                .Select(p => new TravelPackageDto
                {
                    PackageId = p.PackageId,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    Destinations = p.TravelPackageDestinations
                        .Where(tpd => tpd.Destination != null)
                        .Select(tpd => new DestinationDto
                        {
                            DestinationId = tpd.Destination!.DestinationId,
                            Name = tpd.Destination.Name,
                            Description = tpd.Destination.Description,
                            Price = tpd.Destination.Price,
                            ImageUrl = tpd.Destination.ImageUrl,
                            Country = tpd.Destination.Country,
                            City = tpd.Destination.City,
                            Latitude = tpd.Destination.Latitude,
                            Longitude = tpd.Destination.Longitude
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(packages);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPackage(int id)
        {
            var package = await _context.TravelPackages
                .Include(p => p.TravelPackageDestinations)
                    .ThenInclude(tpd => tpd.Destination)
                .AsNoTracking()
                .Where(p => p.PackageId == id)
                .Select(p => new TravelPackageDto
                {
                    PackageId = p.PackageId,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    Destinations = p.TravelPackageDestinations
                        .Where(tpd => tpd.Destination != null)
                        .Select(tpd => new DestinationDto
                        {
                            DestinationId = tpd.Destination!.DestinationId,
                            Name = tpd.Destination.Name,
                            Description = tpd.Destination.Description,
                            Price = tpd.Destination.Price,
                            ImageUrl = tpd.Destination.ImageUrl,
                            Country = tpd.Destination.Country,
                            City = tpd.Destination.City,
                            Latitude = tpd.Destination.Latitude,
                            Longitude = tpd.Destination.Longitude
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (package == null)
            {
                return NotFound(new { message = "Travel package not found." });
            }

            return Ok(package);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePackage([FromBody] CreateTravelPackageDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Invalid payload." });
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            if (dto.DestinationIds == null || dto.DestinationIds.Count == 0)
            {
                return BadRequest(new { message = "At least one destination is required." });
            }

            var distinctDestinationIds = dto.DestinationIds.Distinct().ToList();
            var destinations = await _context.Destinations
                .Where(d => distinctDestinationIds.Contains(d.DestinationId))
                .Select(d => d.DestinationId)
                .ToListAsync();

            if (destinations.Count != distinctDestinationIds.Count)
            {
                var missing = distinctDestinationIds.Except(destinations).ToList();
                return BadRequest(new { message = "Some destinations were not found.", missingDestinationIds = missing });
            }

            var package = new TravelPackage
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                ImageUrl = dto.ImageUrl?.Trim(),
                TravelPackageDestinations = distinctDestinationIds
                    .Select(id => new TravelPackageDestination { DestinationId = id })
                    .ToList()
            };

            _context.TravelPackages.Add(package);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating travel package");
                return StatusCode(500, new { message = "An error occurred while creating the travel package." });
            }

            var createdPackage = await _context.TravelPackages
                .Include(p => p.TravelPackageDestinations)
                    .ThenInclude(tpd => tpd.Destination)
                .AsNoTracking()
                .Where(p => p.PackageId == package.PackageId)
                .Select(p => new TravelPackageDto
                {
                    PackageId = p.PackageId,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    ImageUrl = p.ImageUrl,
                    CreatedAt = p.CreatedAt,
                    Destinations = p.TravelPackageDestinations
                        .Where(tpd => tpd.Destination != null)
                        .Select(tpd => new DestinationDto
                        {
                            DestinationId = tpd.Destination!.DestinationId,
                            Name = tpd.Destination.Name,
                            Description = tpd.Destination.Description,
                            Price = tpd.Destination.Price,
                            ImageUrl = tpd.Destination.ImageUrl,
                            Country = tpd.Destination.Country,
                            City = tpd.Destination.City,
                            Latitude = tpd.Destination.Latitude,
                            Longitude = tpd.Destination.Longitude
                        })
                        .ToList()
                })
                .FirstAsync();

            return CreatedAtAction(nameof(GetPackage), new { id = createdPackage.PackageId }, createdPackage);
        }
    }

    public class CreateTravelPackageDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public List<int> DestinationIds { get; set; } = new();
    }

    public class TravelPackageDto
    {
        public int PackageId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<DestinationDto> Destinations { get; set; } = new();
    }

    public class DestinationDto
    {
        public int DestinationId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public string? Country { get; set; }
        public string? City { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
    }
}