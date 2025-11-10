using System;
using Microsoft.EntityFrameworkCore;
using Travel.Api.Models;

namespace Travel.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Destination> Destinations => Set<Destination>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<BookingDestination> BookingDestinations => Set<BookingDestination>();
        public DbSet<TripCancellation> TripCancellations => Set<TripCancellation>();
        public DbSet<Feedback> Feedbacks => Set<Feedback>();
        public DbSet<TravelPackage> TravelPackages => Set<TravelPackage>();
        public DbSet<TravelPackageDestination> TravelPackageDestinations => Set<TravelPackageDestination>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            var packageSeedTimestamp = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            //
            // USERS
            //
            modelBuilder.Entity<User>(b =>
            {
                b.ToTable("users");
                b.HasKey(u => u.UserId);
                b.Property(u => u.UserId).HasColumnName("user_id");
                b.Property(u => u.Name).HasColumnName("name").HasMaxLength(100).IsRequired().HasDefaultValue("");
                b.Property(u => u.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
                b.HasIndex(u => u.Email).IsUnique();
                b.Property(u => u.Password).HasColumnName("password").HasMaxLength(255).IsRequired();
                b.Property(u => u.Role).HasColumnName("role").HasMaxLength(50).IsRequired().HasDefaultValue("user");
                b.Property(u => u.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            });

            //
            // DESTINATIONS
            //
            modelBuilder.Entity<Destination>(b =>
            {
                b.ToTable("destinations");
                b.HasKey(d => d.DestinationId);
                b.Property(d => d.DestinationId).HasColumnName("destination_id");
                b.Property(d => d.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                b.HasIndex(d => d.Name).IsUnique();
                b.Property(d => d.Description).HasColumnName("description");
                b.Property(d => d.Price).HasColumnName("price").HasColumnType("numeric(10,2)").HasDefaultValue(0);
                b.Property(d => d.ImageUrl).HasColumnName("image_url");
                b.Property(d => d.Latitude).HasColumnName("latitude");
                b.Property(d => d.Longitude).HasColumnName("longitude");
                b.Property(d => d.Country).HasColumnName("country");
                b.Property(d => d.City).HasColumnName("city");
                b.Property(d => d.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

                b.HasData(
                    new Destination
                    {
                        DestinationId = 1,
                        Name = "Goa Coastline Escape",
                        Description = "Golden beaches, vibrant shacks, and Portuguese heritage for a sun-soaked getaway.",
                        ImageUrl = "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=1200&auto=format&fit=crop",
                        Price = 5200m,
                        Latitude = 15.2993m,
                        Longitude = 74.1240m,
                        Country = "India",
                        City = "Goa"
                    },
                    new Destination
                    {
                        DestinationId = 2,
                        Name = "Munnar Tea Highlands",
                        Description = "Mist-covered mountains, endless tea gardens, and cool breezes in Kerala's hill country.",
                        ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                        Price = 4000m,
                        Latitude = 10.0889m,
                        Longitude = 77.0595m,
                        Country = "India",
                        City = "Munnar"
                    },
                    new Destination
                    {
                        DestinationId = 3,
                        Name = "Jaipur Royal Circuit",
                        Description = "The Pink City's palaces, royal bazaars, and forts wrapped in Rajasthan heritage.",
                        ImageUrl = "https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop",
                        Price = 4800m,
                        Latitude = 26.9124m,
                        Longitude = 75.7873m,
                        Country = "India",
                        City = "Jaipur"
                    },
                    new Destination
                    {
                        DestinationId = 4,
                        Name = "Bali Island Retreat",
                        Description = "Balinese temples, terraced rice fields, and sunset beaches for an island escape.",
                        ImageUrl = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1200&auto=format&fit=crop",
                        Price = 18500m,
                        Latitude = -8.3405m,
                        Longitude = 115.0920m,
                        Country = "Indonesia",
                        City = "Bali"
                    },
                    new Destination
                    {
                        DestinationId = 5,
                        Name = "Paris City Lights",
                        Description = "Iconic boulevards, cafés, and museums in the heart of the City of Light.",
                        ImageUrl = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
                        Price = 45000m,
                        Latitude = 48.8566m,
                        Longitude = 2.3522m,
                        Country = "France",
                        City = "Paris"
                    },
                    new Destination
                    {
                        DestinationId = 6,
                        Name = "Santorini Sunset Escape",
                        Description = "Blue-domed churches, whitewashed cliffs, and legendary caldera sunsets.",
                        ImageUrl = "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1200&auto=format&fit=crop",
                        Price = 52000m,
                        Latitude = 36.3932m,
                        Longitude = 25.4615m,
                        Country = "Greece",
                        City = "Santorini"
                    },
                    new Destination
                    {
                        DestinationId = 7,
                        Name = "Tokyo Urban Explorer",
                        Description = "Neon-lit streets, ancient temples, and cutting-edge technology in Japan's capital.",
                        ImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
                        Price = 65000m,
                        Latitude = 35.6762m,
                        Longitude = 139.6503m,
                        Country = "Japan",
                        City = "Tokyo"
                    },
                    new Destination
                    {
                        DestinationId = 8,
                        Name = "Swiss Alps Adventure",
                        Description = "Snow-capped peaks, crystal-clear lakes, and charming alpine villages.",
                        ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
                        Price = 55000m,
                        Latitude = 46.8182m,
                        Longitude = 8.2275m,
                        Country = "Switzerland",
                        City = "Interlaken"
                    },
                    new Destination
                    {
                        DestinationId = 9,
                        Name = "Dubai Luxury Experience",
                        Description = "Iconic skyscrapers, desert safaris, and world-class shopping in the UAE.",
                        ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
                        Price = 58000m,
                        Latitude = 25.2048m,
                        Longitude = 55.2708m,
                        Country = "UAE",
                        City = "Dubai"
                    },
                    new Destination
                    {
                        DestinationId = 10,
                        Name = "Machu Picchu Trek",
                        Description = "Ancient Incan citadel, Andean mountains, and mystical cloud forests.",
                        ImageUrl = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=1200&auto=format&fit=crop",
                        Price = 42000m,
                        Latitude = -13.1631m,
                        Longitude = -72.5450m,
                        Country = "Peru",
                        City = "Cusco"
                    },
                    new Destination
                    {
                        DestinationId = 11,
                        Name = "Sydney Harbour Escape",
                        Description = "Iconic Opera House, Harbour Bridge, and pristine beaches in Australia's harbor city.",
                        ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
                        Price = 48000m,
                        Latitude = -33.8688m,
                        Longitude = 151.2093m,
                        Country = "Australia",
                        City = "Sydney"
                    },
                    new Destination
                    {
                        DestinationId = 12,
                        Name = "Iceland Northern Lights",
                        Description = "Glaciers, geysers, waterfalls, and the magical aurora borealis.",
                        ImageUrl = "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1200&auto=format&fit=crop",
                        Price = 62000m,
                        Latitude = 64.9631m,
                        Longitude = -19.0208m,
                        Country = "Iceland",
                        City = "Reykjavik"
                    });
            });

            //
            // TRAVEL PACKAGES
            //
            modelBuilder.Entity<TravelPackage>(b =>
            {
                b.ToTable("travel_packages");
                b.HasKey(p => p.PackageId);
                b.Property(p => p.PackageId).HasColumnName("package_id");
                b.Property(p => p.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
                b.Property(p => p.Description).HasColumnName("description");
                b.Property(p => p.Price).HasColumnName("price").HasColumnType("numeric(10,2)").HasDefaultValue(0);
                b.Property(p => p.ImageUrl).HasColumnName("image_url").HasMaxLength(500);
                b.Property(p => p.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

                b.HasMany(p => p.Destinations)
                    .WithMany(d => d.TravelPackages)
                    .UsingEntity<TravelPackageDestination>(
                        j => j
                            .HasOne(tpd => tpd.Destination)
                            .WithMany(d => d.TravelPackageDestinations)
                            .HasForeignKey(tpd => tpd.DestinationId)
                            .OnDelete(DeleteBehavior.Cascade),
                        j => j
                            .HasOne(tpd => tpd.TravelPackage)
                            .WithMany(p => p.TravelPackageDestinations)
                            .HasForeignKey(tpd => tpd.TravelPackageId)
                            .OnDelete(DeleteBehavior.Cascade),
                        j =>
                        {
                            j.ToTable("travel_package_destinations");
                            j.HasKey(t => new { t.TravelPackageId, t.DestinationId });
                            j.Property(t => t.TravelPackageId).HasColumnName("package_id");
                            j.Property(t => t.DestinationId).HasColumnName("destination_id");
                        });

                b.HasData(
                    new TravelPackage
                    {
                        PackageId = 1,
                        Name = "Beach Escape",
                        Description = "Five-day coastal escape featuring sunrise yoga, local seafood tastings, and resort-style beach villas.",
                        Price = 499.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 2,
                        Name = "Mountain Adventure",
                        Description = "Week-long alpine expedition with guided summit treks, riverside camping, and stargazing under clear skies.",
                        Price = 899.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 3,
                        Name = "Cultural Journey",
                        Description = "Curated heritage trail showcasing palace walkthroughs, artisan workshops, and immersive food tours.",
                        Price = 699.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=80",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 4,
                        Name = "Urban Explorer",
                        Description = "Modern city vibes with cutting-edge technology, vibrant nightlife, and cultural landmarks.",
                        Price = 799.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1200&auto=format&fit=crop",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 5,
                        Name = "Luxury Worldwide",
                        Description = "Premium destinations featuring world-class accommodations, exclusive experiences, and personalized service.",
                        Price = 1499.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200&auto=format&fit=crop",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 6,
                        Name = "Adventure Seeker",
                        Description = "Thrilling outdoor activities, breathtaking landscapes, and unforgettable natural wonders.",
                        Price = 1099.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop",
                        CreatedAt = packageSeedTimestamp
                    },
                    new TravelPackage
                    {
                        PackageId = 7,
                        Name = "European Heritage Tour",
                        Description = "Rich history, architectural marvels, and culinary traditions across Europe's most iconic cities.",
                        Price = 1199.99m,
                        ImageUrl = "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1200&auto=format&fit=crop",
                        CreatedAt = packageSeedTimestamp
                    });
            });

            //
            // BOOKINGS
            //
            modelBuilder.Entity<Booking>(b =>
            {
                b.ToTable("bookings");
                b.HasKey(x => x.BookingId);
                b.Property(x => x.BookingId).HasColumnName("booking_id");
                b.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                b.Property(x => x.TotalPrice).HasColumnName("total_price").HasColumnType("numeric(10,2)");
                b.Property(x => x.Guests).HasColumnName("guests");
                b.Property(x => x.Nights).HasColumnName("nights");
                b.Property(x => x.BookingDate).HasColumnName("booking_date").HasDefaultValueSql("NOW()");
                b.Property(x => x.Confirmed).HasColumnName("confirmed").HasDefaultValue(false);
                b.Property(x => x.ReminderSent).HasColumnName("reminder_sent").HasDefaultValue(false);
                b.Property(x => x.Status).HasColumnName("status").HasConversion<int>().HasDefaultValue(BookingStatus.Active);
                b.Property(x => x.Rating).HasColumnName("rating");
                b.Property(x => x.Review).HasColumnName("review");

                // Enum default value fix
                b.Property(x => x.CancellationStatus)
                    .HasColumnName("cancellation_status")
                    .HasConversion<int>()
                    .HasDefaultValue(CancellationStatus.None);

                b.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");

                b.HasOne(x => x.User)
                    .WithMany(u => u.Bookings)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            //
            // BOOKING_DESTINATIONS (many-to-many)
            //
            modelBuilder.Entity<BookingDestination>(bd =>
            {
                bd.ToTable("booking_destinations");
                bd.HasKey(x => new { x.BookingId, x.DestinationId });

                bd.Property(x => x.BookingId).HasColumnName("booking_id");
                bd.Property(x => x.DestinationId).HasColumnName("destination_id");

                bd.HasOne(x => x.Booking)
                  .WithMany(b => b.BookingDestinations)
                  .HasForeignKey(x => x.BookingId)
                  .OnDelete(DeleteBehavior.Cascade);

                bd.HasOne(x => x.Destination)
                  .WithMany(d => d.BookingDestinations)
                  .HasForeignKey(x => x.DestinationId)
                  .OnDelete(DeleteBehavior.Cascade);
            });

            //
            // TRIP CANCELLATIONS
            //
            modelBuilder.Entity<TripCancellation>(tc =>
            {
                tc.ToTable("trip_cancellations");
                tc.HasKey(x => x.TripCancellationId);
                tc.Property(x => x.TripCancellationId).HasColumnName("trip_cancellation_id");
                tc.Property(x => x.BookingId).HasColumnName("booking_id").IsRequired();
                tc.Property(x => x.UserId).HasColumnName("user_id").IsRequired();
                tc.Property(x => x.Reason).HasColumnName("reason").HasMaxLength(1000);
                tc.Property(x => x.RequestedAt).HasColumnName("requested_at").HasDefaultValueSql("NOW()");
                tc.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");

                // ✅ Enum fix here
                tc.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasConversion<int>() // store enum as int
                    .HasDefaultValue(TripCancellationStatus.Pending);


                tc.Property(x => x.AdminComment).HasColumnName("admin_comment").HasMaxLength(1000);

                tc.HasOne(x => x.Booking)
                  .WithMany(b => b.TripCancellations)
                  .HasForeignKey(x => x.BookingId)
                  .OnDelete(DeleteBehavior.Cascade);

                tc.HasOne(x => x.User)
                  .WithMany()
                  .HasForeignKey(x => x.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
            });

            //
            // FEEDBACKS
            //
            modelBuilder.Entity<Feedback>(f =>
            {
                f.ToTable("feedbacks");
                f.HasKey(x => x.FeedbackId);
                f.Property(x => x.FeedbackId).HasColumnName("feedback_id");
                f.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                f.Property(x => x.Email).HasColumnName("email").HasMaxLength(100).IsRequired();
                f.Property(x => x.Message).HasColumnName("message").HasMaxLength(1000).IsRequired();
                f.Property(x => x.Rating).HasColumnName("rating").IsRequired();
                f.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            });

            //
            // INDEXES
            //
            modelBuilder.Entity<Booking>()
                .HasIndex(b => b.UserId)
                .HasDatabaseName("idx_bookings_user_id");

            modelBuilder.Entity<TripCancellation>()
                .HasIndex(tc => tc.BookingId)
                .HasDatabaseName("idx_tripcancellations_booking_id");

            modelBuilder.Entity<TripCancellation>()
                .HasIndex(tc => tc.UserId)
                .HasDatabaseName("idx_tripcancellations_user_id");

            modelBuilder.Entity<BookingDestination>()
                .HasIndex(bd => bd.DestinationId)
                .HasDatabaseName("idx_bookingdest_dest_id");

            modelBuilder.Entity<Feedback>()
                .HasIndex(fb => fb.CreatedAt)
                .HasDatabaseName("idx_feedbacks_created_at");
        }
    }
}
 