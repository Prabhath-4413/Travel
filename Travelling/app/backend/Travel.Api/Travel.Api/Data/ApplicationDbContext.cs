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

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
