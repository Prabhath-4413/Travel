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

            // Seed travel packages (force add missing ones)
            var packageSeedTimestamp = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var packagesToAdd = new List<TravelPackage>();

            // Always try to add packages 1-3 (they might not exist)
            if (!await db.TravelPackages.AnyAsync(p => p.PackageId == 1))
            {
                packagesToAdd.Add(new TravelPackage
                {
                    PackageId = 1,
                    Name = "Beach Escape",
                    Description = "Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.",
                    Price = 499.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                    CreatedAt = packageSeedTimestamp
                });
            }

            if (!await db.TravelPackages.AnyAsync(p => p.PackageId == 2))
            {
                packagesToAdd.Add(new TravelPackage
                {
                    PackageId = 2,
                    Name = "Mountain Adventure",
                    Description = "Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.",
                    Price = 899.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                    CreatedAt = packageSeedTimestamp
                });
            }

            if (!await db.TravelPackages.AnyAsync(p => p.PackageId == 3))
            {
                packagesToAdd.Add(new TravelPackage
                {
                    PackageId = 3,
                    Name = "Cultural Journey",
                    Description = "Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.",
                    Price = 699.99m,
                    ImageUrl = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
                    CreatedAt = packageSeedTimestamp
                });
            }

            if (packagesToAdd.Any())
            {
                await db.TravelPackages.AddRangeAsync(packagesToAdd);
                await db.SaveChangesAsync();
            }

            // Seed travel package destinations
            // Clear existing relationships and re-seed
            db.TravelPackageDestinations.RemoveRange(await db.TravelPackageDestinations.ToListAsync());
            await db.SaveChangesAsync();

            var packageDestinations = new List<TravelPackageDestination>
            {
                // Beach Escape (Goa, Bali)
                new TravelPackageDestination { TravelPackageId = 1, DestinationId = 1 },
                new TravelPackageDestination { TravelPackageId = 1, DestinationId = 4 },

                // Mountain Adventure (Munnar, Swiss Alps, Machu Picchu)
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 2 },
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 8 },
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 10 },

                // Cultural Journey (Jaipur, Santorini, Paris)
                new TravelPackageDestination { TravelPackageId = 3, DestinationId = 3 },
                new TravelPackageDestination { TravelPackageId = 3, DestinationId = 6 },
                new TravelPackageDestination { TravelPackageId = 3, DestinationId = 5 },

                // Urban Explorer (Tokyo, Dubai, Sydney)
                new TravelPackageDestination { TravelPackageId = 4, DestinationId = 7 },
                new TravelPackageDestination { TravelPackageId = 4, DestinationId = 9 },
                new TravelPackageDestination { TravelPackageId = 4, DestinationId = 11 },

                // Luxury Worldwide (Paris, Dubai, Santorini, Tokyo)
                new TravelPackageDestination { TravelPackageId = 5, DestinationId = 5 },
                new TravelPackageDestination { TravelPackageId = 5, DestinationId = 9 },
                new TravelPackageDestination { TravelPackageId = 5, DestinationId = 6 },
                new TravelPackageDestination { TravelPackageId = 5, DestinationId = 7 },

                // Adventure Seeker (Swiss Alps, Machu Picchu, Iceland, Bali)
                new TravelPackageDestination { TravelPackageId = 6, DestinationId = 8 },
                new TravelPackageDestination { TravelPackageId = 6, DestinationId = 10 },
                new TravelPackageDestination { TravelPackageId = 6, DestinationId = 12 },
                new TravelPackageDestination { TravelPackageId = 6, DestinationId = 4 },

                // European Heritage Tour (Paris, Santorini, Swiss Alps)
                new TravelPackageDestination { TravelPackageId = 7, DestinationId = 5 },
                new TravelPackageDestination { TravelPackageId = 7, DestinationId = 6 },
                new TravelPackageDestination { TravelPackageId = 7, DestinationId = 8 }
            };

            await db.TravelPackageDestinations.AddRangeAsync(packageDestinations);
            await db.SaveChangesAsync();
        }
    }
}
