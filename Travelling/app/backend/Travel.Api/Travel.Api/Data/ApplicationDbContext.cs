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
                b.Property(d => d.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
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
                    });
            });

            modelBuilder.Entity<TravelPackageDestination>().HasData(
                new TravelPackageDestination { TravelPackageId = 1, DestinationId = 1 },
                new TravelPackageDestination { TravelPackageId = 1, DestinationId = 2 },
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 3 },
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 4 },
                new TravelPackageDestination { TravelPackageId = 2, DestinationId = 5 },
                new TravelPackageDestination { TravelPackageId = 3, DestinationId = 2 },
                new TravelPackageDestination { TravelPackageId = 3, DestinationId = 6 });

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
 