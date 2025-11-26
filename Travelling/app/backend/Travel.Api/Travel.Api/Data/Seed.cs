using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Models;

namespace Travel.Api.Data
{
    public static class Seed
    {
        public static async Task Run(ApplicationDbContext db)
        {
            var destinationSeeds = new List<Destination>
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
                },
                new()
                {
                    Name = "Tokyo Urban Explorer",
                    Description = "Neon-lit streets, ancient temples, and cutting-edge technology in Japan's capital.",
                    ImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
                    Price = 65000m,
                    Latitude = 35.6762m,
                    Longitude = 139.6503m,
                    Country = "Japan",
                    City = "Tokyo"
                },
                new()
                {
                    Name = "Swiss Alps Adventure",
                    Description = "Snow-capped peaks, crystal-clear lakes, and charming alpine villages.",
                    ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
                    Price = 55000m,
                    Latitude = 46.8182m,
                    Longitude = 8.2275m,
                    Country = "Switzerland",
                    City = "Interlaken"
                },
                new()
                {
                    Name = "Dubai Luxury Experience",
                    Description = "Iconic skyscrapers, desert safaris, and world-class shopping in the UAE.",
                    ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
                    Price = 58000m,
                    Latitude = 25.2048m,
                    Longitude = 55.2708m,
                    Country = "UAE",
                    City = "Dubai"
                },
                new()
                {
                    Name = "Machu Picchu Trek",
                    Description = "Ancient Incan citadel, Andean mountains, and mystical cloud forests.",
                    ImageUrl = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200&auto=format&fit=crop",
                    Price = 42000m,
                    Latitude = -13.1631m,
                    Longitude = -72.5450m,
                    Country = "Peru",
                    City = "Cusco"
                },
                new()
                {
                    Name = "Sydney Harbour Escape",
                    Description = "Iconic Opera House, Harbour Bridge, and pristine beaches in Australia's harbor city.",
                    ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
                    Price = 48000m,
                    Latitude = -33.8688m,
                    Longitude = 151.2093m,
                    Country = "Australia",
                    City = "Sydney"
                },
                new()
                {
                    Name = "Iceland Northern Lights",
                    Description = "Glaciers, geysers, waterfalls, and the magical aurora borealis.",
                    ImageUrl = "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop",
                    Price = 62000m,
                    Latitude = 64.9631m,
                    Longitude = -19.0208m,
                    Country = "Iceland",
                    City = "Reykjavik"
                },
                new()
                {
                    Name = "Maldives Overwater Retreat",
                    Description = "Turquoise lagoons, coral reefs, and private villas floating above the Indian Ocean.",
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
                    Price = 72000m,
                    Latitude = 3.2028m,
                    Longitude = 73.2207m,
                    Country = "Maldives",
                    City = "Malé"
                }
            };

            foreach (var seed in destinationSeeds)
            {
                var existing = await db.Destinations.FirstOrDefaultAsync(d => d.Name == seed.Name);
                if (existing is null)
                {
                    await db.Destinations.AddAsync(seed);
                }
                else
                {
                    existing.Description = seed.Description;
                    existing.ImageUrl = seed.ImageUrl;
                    existing.Price = seed.Price;
                    existing.Latitude = seed.Latitude;
                    existing.Longitude = seed.Longitude;
                    existing.Country = seed.Country;
                    existing.City = seed.City;
                }
            }

            await db.SaveChangesAsync();

            var destinationIds = await db.Destinations
                .AsNoTracking()
                .ToDictionaryAsync(d => d.Name, d => d.DestinationId);

            var packageSeedTimestamp = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var packageSeeds = new List<TravelPackage>
            {
                new()
                {
                    Name = "Beach Escape",
                    Description = "Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.",
                    Price = 499.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
                },
                new()
                {
                    Name = "Mountain Adventure",
                    Description = "Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.",
                    Price = 899.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
                },
                new()
                {
                    Name = "Cultural Journey",
                    Description = "Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.",
                    Price = 699.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80"
                },
                new()
                {
                    Name = "Urban Explorer",
                    Description = "Modern city vibes with cutting-edge technology, vibrant nightlife, and cultural landmarks.",
                    Price = 799.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop"
                },
                new()
                {
                    Name = "Luxury Worldwide",
                    Description = "Premium destinations featuring world-class accommodations, exclusive experiences, and personalized service.",
                    Price = 1499.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop"
                },
                new()
                {
                    Name = "Adventure Seeker",
                    Description = "Thrilling outdoor activities, breathtaking landscapes, and unforgettable natural wonders.",
                    Price = 1099.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop"
                },
                new()
                {
                    Name = "European Heritage Tour",
                    Description = "Rich history, architectural marvels, and culinary traditions across Europe's most iconic cities.",
                    Price = 1199.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop"
                },
                new()
                {
                    Name = "Iconic Horizons",
                    Description = "Maldivian lagoons, Swiss summits, and Dubai skylines united in a single signature journey.",
                    Price = 1599.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
                }
            };

            foreach (var seed in packageSeeds)
            {
                var existing = await db.TravelPackages.FirstOrDefaultAsync(p => p.Name == seed.Name);
                if (existing is null)
                {
                    seed.CreatedAt = packageSeedTimestamp;
                    await db.TravelPackages.AddAsync(seed);
                }
                else
                {
                    existing.Description = seed.Description;
                    existing.Price = seed.Price;
                    existing.ImageUrl = seed.ImageUrl;
                }
            }

            await db.SaveChangesAsync();

            var packageIds = await db.TravelPackages
                .AsNoTracking()
                .ToDictionaryAsync(p => p.Name, p => p.PackageId);

            var packageDestinationMap = new Dictionary<string, string[]>
            {
                ["Beach Escape"] = new[]
                {
                    "Goa Coastline Escape",
                    "Bali Island Retreat",
                    "Maldives Overwater Retreat"
                },
                ["Mountain Adventure"] = new[]
                {
                    "Munnar Tea Highlands",
                    "Swiss Alps Adventure",
                    "Machu Picchu Trek"
                },
                ["Cultural Journey"] = new[]
                {
                    "Jaipur Royal Circuit",
                    "Santorini Sunset Escape",
                    "Paris City Lights"
                },
                ["Urban Explorer"] = new[]
                {
                    "Tokyo Urban Explorer",
                    "Dubai Luxury Experience",
                    "Sydney Harbour Escape"
                },
                ["Luxury Worldwide"] = new[]
                {
                    "Paris City Lights",
                    "Dubai Luxury Experience",
                    "Santorini Sunset Escape",
                    "Maldives Overwater Retreat"
                },
                ["Adventure Seeker"] = new[]
                {
                    "Swiss Alps Adventure",
                    "Machu Picchu Trek",
                    "Iceland Northern Lights",
                    "Bali Island Retreat"
                },
                ["European Heritage Tour"] = new[]
                {
                    "Paris City Lights",
                    "Santorini Sunset Escape",
                    "Swiss Alps Adventure"
                },
                ["Iconic Horizons"] = new[]
                {
                    "Maldives Overwater Retreat",
                    "Swiss Alps Adventure",
                    "Dubai Luxury Experience"
                }
            };

            var existingLinks = await db.TravelPackageDestinations.ToListAsync();
            if (existingLinks.Count > 0)
            {
                db.TravelPackageDestinations.RemoveRange(existingLinks);
                await db.SaveChangesAsync();
            }

            var newLinks = new List<TravelPackageDestination>();
            foreach (var mapping in packageDestinationMap)
            {
                if (!packageIds.TryGetValue(mapping.Key, out var packageId))
                {
                    continue;
                }

                foreach (var destinationName in mapping.Value.Distinct())
                {
                    if (!destinationIds.TryGetValue(destinationName, out var destinationId))
                    {
                        continue;
                    }

                    newLinks.Add(new TravelPackageDestination
                    {
                        TravelPackageId = packageId,
                        DestinationId = destinationId
                    });
                }
            }

            if (newLinks.Count > 0)
            {
                await db.TravelPackageDestinations.AddRangeAsync(newLinks);
                await db.SaveChangesAsync();
            }
        }
    }
}
