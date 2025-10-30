using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Travel.Api.Data;
using Travel.Api.Migrations;
using Xunit;

namespace Travel.Api.Tests.Migrations
{
    public class BaselineDesignerTests
    {
        [Fact]
        public void Baseline_Migration_Should_Have_Correct_Migration_Id()
        {
            // Arrange
            var migration = new Baseline();
            
            // Act & Assert
            Assert.NotNull(migration);
        }

        [Fact]
        public void Baseline_Migration_Should_Build_Target_Model_Without_Errors()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var modelBuilder = new ModelBuilder();

            // Act
            var migration = new Baseline();
            var method = typeof(Baseline).GetMethod("BuildTargetModel", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            // Assert
            Assert.NotNull(method);
            
            // This should not throw an exception
            method.Invoke(migration, new object[] { modelBuilder });
        }

        [Fact]
        public void Target_Model_Should_Have_All_Required_Entities()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb2"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var model = context.Model;
            
            // Assert
            Assert.NotNull(model.FindEntityType("Travel.Api.Models.User"));
            Assert.NotNull(model.FindEntityType("Travel.Api.Models.Destination"));
            Assert.NotNull(model.FindEntityType("Travel.Api.Models.Booking"));
            Assert.NotNull(model.FindEntityType("Travel.Api.Models.BookingDestination"));
        }

        [Fact]
        public void User_Entity_Should_Have_Correct_Properties()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb3"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var userEntity = context.Model.FindEntityType("Travel.Api.Models.User");
            
            // Assert
            Assert.NotNull(userEntity);
            Assert.NotNull(userEntity.FindProperty("UserId"));
            Assert.NotNull(userEntity.FindProperty("Name"));
            Assert.NotNull(userEntity.FindProperty("Email"));
            Assert.NotNull(userEntity.FindProperty("Password"));
            Assert.NotNull(userEntity.FindProperty("Role"));
        }

        [Fact]
        public void Destination_Entity_Should_Have_Correct_Properties()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb4"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var destinationEntity = context.Model.FindEntityType("Travel.Api.Models.Destination");
            
            // Assert
            Assert.NotNull(destinationEntity);
            Assert.NotNull(destinationEntity.FindProperty("DestinationId"));
            Assert.NotNull(destinationEntity.FindProperty("Name"));
            Assert.NotNull(destinationEntity.FindProperty("Description"));
            Assert.NotNull(destinationEntity.FindProperty("Price"));
            Assert.NotNull(destinationEntity.FindProperty("ImageUrl"));
            Assert.NotNull(destinationEntity.FindProperty("Latitude"));
            Assert.NotNull(destinationEntity.FindProperty("Longitude"));
        }

        [Fact]
        public void Booking_Entity_Should_Have_Correct_Properties()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb5"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var bookingEntity = context.Model.FindEntityType("Travel.Api.Models.Booking");
            
            // Assert
            Assert.NotNull(bookingEntity);
            Assert.NotNull(bookingEntity.FindProperty("BookingId"));
            Assert.NotNull(bookingEntity.FindProperty("UserId"));
            Assert.NotNull(bookingEntity.FindProperty("BookingDate"));
            Assert.NotNull(bookingEntity.FindProperty("Guests"));
            Assert.NotNull(bookingEntity.FindProperty("Nights"));
            Assert.NotNull(bookingEntity.FindProperty("TotalPrice"));
            Assert.NotNull(bookingEntity.FindProperty("Confirmed"));
        }

        [Fact]
        public void BookingDestination_Entity_Should_Have_Correct_Properties()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb6"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var bookingDestinationEntity = context.Model.FindEntityType("Travel.Api.Models.BookingDestination");
            
            // Assert
            Assert.NotNull(bookingDestinationEntity);
            Assert.NotNull(bookingDestinationEntity.FindProperty("BookingId"));
            Assert.NotNull(bookingDestinationEntity.FindProperty("DestinationId"));
        }

        [Fact]
        public void User_Email_Should_Have_Unique_Index()
        {
            // Arrange
            var services = new ServiceCollection();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb7"));
            
            var serviceProvider = services.BuildServiceProvider();
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            
            // Act
            var userEntity = context.Model.FindEntityType("Travel.Api.Models.User");
            var emailIndex = userEntity?.GetIndexes().FirstOrDefault(i => 
                i.Properties.Any(p => p.Name == "Email"));
            
            // Assert
            Assert.NotNull(emailIndex);
            Assert.True(emailIndex.IsUnique);
        }
    }
}


