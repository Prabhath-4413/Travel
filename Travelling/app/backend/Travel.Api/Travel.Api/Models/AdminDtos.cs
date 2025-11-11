namespace Travel.Api.Models
{
    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalBookings { get; set; }
        public int PaidBookings { get; set; }
        public double AverageRating { get; set; }
        public List<TopDestinationDto> TopDestinations { get; set; } = new();
    }

    public class TopDestinationDto
    {
        public string Name { get; set; } = string.Empty;
        public int Bookings { get; set; }
    }
}