using System;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Travel.Api.Data
{
    /// <summary>
    /// Provides a design-time factory so EF Core can create <see cref="AppDbContext"/> without the application's DI container.
    /// </summary>
    public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            // Build configuration using the project's appsettings.json file
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false)
                .AddEnvironmentVariables()
                .Build();

            string? connectionString = configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException("The connection string 'DefaultConnection' was not found in appsettings.json.");
            }

            var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
            optionsBuilder.UseNpgsql(connectionString);

            return new AppDbContext(optionsBuilder.Options);
        }
    }

    // Minimal AppDbContext so the design-time factory can resolve the type.
    // If you already have a DbContext implementation elsewhere, remove this stub
    // and add the appropriate using directive or reference to that class.
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }
        
        // Add DbSet<TEntity> properties here as needed, for example:
        // public DbSet<MyEntity> MyEntities { get; set; }
    }
}   