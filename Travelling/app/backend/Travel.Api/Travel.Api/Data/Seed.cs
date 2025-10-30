using Microsoft.EntityFrameworkCore;
using Travel.Api.Models;

namespace Travel.Api.Data
{
    public static class Seed
    {
        public static async Task Run(ApplicationDbContext db)
        {
            if (await db.Destinations.AnyAsync()) return;

            var destinations = new List<Destination>
            {
                new()
                {
                    Name = "Goa Coastline Escape",
                    Description = "Golden beaches, vibrant shacks, and Portuguese heritage for a sun-soaked getaway.",
                    ImageUrl = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
                    Price = 5200m,
                    Latitude = 15.2993m,
                    Longitude = 74.1240m,
                    Country = "India",
                    City = "Goa"
                },
                new()
                {
                    Name = "Munnar Tea Highlands",
                    Description = "Mist-covered mountains, endless tea gardens, and cool breezes in Kerala's hill country.",
                    ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                    Price = 4000m,
                    Latitude = 10.0889m,
                    Longitude = 77.0595m,
                    Country = "India",
                    City = "Munnar"
                },
                new()
                {
                    Name = "Jaipur Royal Circuit",
                    Description = "The Pink City's palaces, royal bazaars, and forts wrapped in Rajasthan heritage.",
                    ImageUrl = "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop",
                    Price = 4800m,
                    Latitude = 26.9124m,
                    Longitude = 75.7873m,
                    Country = "India",
                    City = "Jaipur"
                },
                new()
                {
                    Name = "Bali Island Retreat",
                    Description = "Balinese temples, terraced rice fields, and sunset beaches for an island escape.",
                    ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop",
                    Price = 18500m,
                    Latitude = -8.3405m,
                    Longitude = 115.0920m,
                    Country = "Indonesia",
                    City = "Bali"
                },
                new()
                {
                    Name = "Paris City Lights",
                    Description = "Iconic boulevards, cafés, and museums in the heart of the City of Light.",
                    ImageUrl = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
                    Price = 45000m,
                    Latitude = 48.8566m,
                    Longitude = 2.3522m,
                    Country = "France",
                    City = "Paris"
                },
                new()
                {
                    Name = "Santorini Sunset Escape",
                    Description = "Blue-domed churches, whitewashed cliffs, and legendary caldera sunsets.",
                    ImageUrl = "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop",
                    Price = 52000m,
                    Latitude = 36.3932m,
                    Longitude = 25.4615m,
                    Country = "Greece",
                    City = "Santorini"
                }
            };

            await db.Destinations.AddRangeAsync(destinations);
            await db.SaveChangesAsync();
        }
    }
}
