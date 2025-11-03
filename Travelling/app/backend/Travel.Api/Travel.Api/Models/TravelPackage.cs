using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Travel.Api.Models
{
    public class TravelPackage
    {
        [Key]
        [Column("package_id")]
        public int PackageId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Column("price", TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Column("image_url")]
        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        public ICollection<Destination> Destinations { get; set; } = new List<Destination>();

        [JsonIgnore]
        public ICollection<TravelPackageDestination> TravelPackageDestinations { get; set; } = new List<TravelPackageDestination>();

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class TravelPackageDestination
    {
        [Column("package_id")]
        public int TravelPackageId { get; set; }

        [JsonIgnore]
        public TravelPackage? TravelPackage { get; set; }

        [Column("destination_id")]
        public int DestinationId { get; set; }

        [JsonIgnore]
        public Destination? Destination { get; set; }
    }
}
