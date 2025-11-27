using Travel.Api.Models;
using Microsoft.Extensions.Logging;

namespace Travel.Api.Services;

public interface IPricingService
{
    decimal CalculatePackageBookingPrice(
        IEnumerable<Destination> destinations,
        DateTime startDate,
        int guests,
        int nights,
        out PricingBreakdown breakdown);
}

public class PricingBreakdown
{
    public decimal BasePrice { get; set; }
    public decimal SeasonalAdjustment { get; set; }
    public decimal WeatherAdjustment { get; set; }
    public decimal DemandAdjustment { get; set; }
    public decimal LastMinuteAdjustment { get; set; }
    public decimal SubtotalAfterAdjustments { get; set; }
    public decimal GstAmount { get; set; }
    public decimal FinalPrice { get; set; }
    public const decimal GST_RATE = 0.18m;
}

public class PricingService : IPricingService
{
    private readonly ILogger<PricingService> _logger;
    private const decimal GST_RATE = 0.18m;

    public PricingService(ILogger<PricingService> logger)
    {
        _logger = logger;
    }

    public decimal CalculatePackageBookingPrice(
        IEnumerable<Destination> destinations,
        DateTime startDate,
        int guests,
        int nights,
        out PricingBreakdown breakdown)
    {
        var destinationList = destinations.ToList();
        breakdown = new PricingBreakdown();

        // Step 1: Calculate base price (sum of all destination prices * guests * nights)
        breakdown.BasePrice = destinationList.Sum(d => d.Price) * guests * nights;
        _logger.LogInformation("Base price calculated: {BasePrice} (destinations: {Count}, guests: {Guests}, nights: {Nights})",
            breakdown.BasePrice, destinationList.Count, guests, nights);

        // Step 2: Calculate seasonal adjustment
        breakdown.SeasonalAdjustment = CalculateSeasonalAdjustment(startDate, breakdown.BasePrice);
        _logger.LogInformation("Seasonal adjustment: {Adjustment}%", (breakdown.SeasonalAdjustment / breakdown.BasePrice * 100));

        // Step 3: Calculate weather adjustment (can be 0 or based on destination weather)
        breakdown.WeatherAdjustment = CalculateWeatherAdjustment(startDate, breakdown.BasePrice);
        _logger.LogInformation("Weather adjustment: {Adjustment}%", (breakdown.WeatherAdjustment / breakdown.BasePrice * 100));

        // Step 4: Calculate demand adjustment (peak travel times)
        breakdown.DemandAdjustment = CalculateDemandAdjustment(startDate, nights, breakdown.BasePrice);
        _logger.LogInformation("Demand adjustment: {Adjustment}%", (breakdown.DemandAdjustment / breakdown.BasePrice * 100));

        // Step 5: Calculate last-minute adjustment (bookings within 7 days)
        breakdown.LastMinuteAdjustment = CalculateLastMinuteAdjustment(startDate, breakdown.BasePrice);
        _logger.LogInformation("Last-minute adjustment: {Adjustment}%", (breakdown.LastMinuteAdjustment / breakdown.BasePrice * 100));

        // Step 6: Calculate subtotal after all adjustments
        breakdown.SubtotalAfterAdjustments = breakdown.BasePrice
            + breakdown.SeasonalAdjustment
            + breakdown.WeatherAdjustment
            + breakdown.DemandAdjustment
            + breakdown.LastMinuteAdjustment;

        // Step 7: Calculate GST (18%)
        breakdown.GstAmount = breakdown.SubtotalAfterAdjustments * GST_RATE;

        // Step 8: Final price
        breakdown.FinalPrice = breakdown.SubtotalAfterAdjustments + breakdown.GstAmount;

        _logger.LogInformation("Package pricing calculated. Subtotal: {Subtotal}, GST: {Gst}, Final: {Final}",
            breakdown.SubtotalAfterAdjustments, breakdown.GstAmount, breakdown.FinalPrice);

        return breakdown.FinalPrice;
    }

    private decimal CalculateSeasonalAdjustment(DateTime startDate, decimal basePrice)
    {
        var month = startDate.Month;

        // Monsoon (June-September): -15% discount
        if (month >= 6 && month <= 9)
        {
            return -basePrice * 0.15m;
        }

        // Peak season (December-January): +25% premium
        if (month == 12 || month == 1)
        {
            return basePrice * 0.25m;
        }

        // Summer (April-May): +10% premium
        if (month == 4 || month == 5)
        {
            return basePrice * 0.10m;
        }

        // Off-season (February-March, October-November): +5%
        return basePrice * 0.05m;
    }

    private decimal CalculateWeatherAdjustment(DateTime startDate, decimal basePrice)
    {
        // Weather adjustment logic - can integrate with weather API
        // For now, simple month-based logic
        var month = startDate.Month;

        // Extreme weather months: -10%
        if (month >= 7 && month <= 8)
        {
            return -basePrice * 0.10m;
        }

        return 0m;
    }

    private decimal CalculateDemandAdjustment(DateTime startDate, int nights, decimal basePrice)
    {
        // High demand periods
        var isWeekend = startDate.DayOfWeek == DayOfWeek.Friday || startDate.DayOfWeek == DayOfWeek.Saturday;
        var isHoliday = IsIndianHoliday(startDate);

        decimal adjustment = 0m;

        if (isWeekend)
        {
            adjustment += basePrice * 0.08m;
        }

        if (isHoliday)
        {
            adjustment += basePrice * 0.15m;
        }

        // Longer stays get discount
        if (nights >= 5)
        {
            adjustment -= basePrice * 0.05m;
        }

        return adjustment;
    }

    private decimal CalculateLastMinuteAdjustment(DateTime startDate, decimal basePrice)
    {
        var daysUntilTrip = (startDate - DateTime.UtcNow).TotalDays;

        // Booking within 7 days: -20% (last-minute discount to fill inventory)
        if (daysUntilTrip <= 7 && daysUntilTrip > 0)
        {
            return -basePrice * 0.20m;
        }

        // Booking within 3 days: -25%
        if (daysUntilTrip <= 3 && daysUntilTrip > 0)
        {
            return -basePrice * 0.25m;
        }

        return 0m;
    }

    private static bool IsIndianHoliday(DateTime date)
    {
        // Major Indian holidays (approximate dates, can be refined)
        var month = date.Month;
        var day = date.Day;

        var holidays = new List<(int month, int day, string name)>
        {
            (1, 26, "Republic Day"),
            (3, 8, "Maha Shivaratri"),
            (3, 25, "Holi"),
            (3, 29, "Good Friday"),
            (4, 11, "Eid ul-Fitr"),
            (4, 17, "Ram Navami"),
            (5, 23, "Buddha Purnima"),
            (8, 15, "Independence Day"),
            (8, 26, "Janmashtami"),
            (9, 16, "Milad un-Nabi"),
            (10, 2, "Gandhi Jayanti"),
            (10, 12, "Dussehra"),
            (10, 24, "Diwali"),
            (10, 25, "Govardhan Puja"),
            (11, 1, "Diwali (New Year)"),
            (12, 25, "Christmas")
        };

        return holidays.Any(h => h.month == month && h.day == day);
    }
}
