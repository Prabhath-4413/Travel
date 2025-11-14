import { weatherService } from "../api/weather";
import type { Destination } from "./api";

export interface PricingAdjustments {
  season: number;
  weather: number;
  demand: number;
  weekend: number;
  lastMinute: number;
}

export interface PricingResult {
  basePrice: number;
  finalPrice: number;
  adjustments: PricingAdjustments;
  pricingReason: string;
}

/**
 * Calculate dynamic pricing for a destination based on various factors
 */
export async function calculateDynamicPrice(
  destination: Destination,
  startDate: Date,
  guests: number = 1,
  nights: number = 1
): Promise<PricingResult> {
  const basePrice = destination.price * guests * nights;

  // Initialize adjustments
  const adjustments: PricingAdjustments = {
    season: 0,
    weather: 0,
    demand: 0,
    weekend: 0,
    lastMinute: 0,
  };

  // Seasonal pricing
  const month = startDate.getMonth() + 1; // getMonth() returns 0-11
  if ([11, 12, 1, 4, 5, 6].includes(month)) {
    // High season: Nov-Jan, Apr-Jun
    adjustments.season = 20;
  } else if ([7, 8, 9].includes(month)) {
    // Low season: Jul-Sep
    adjustments.season = -15;
  }

  // Weather-based pricing
  try {
    const weather = await weatherService.getWeatherByCity(destination.name);
    const temp = weather.temperature;

    if (temp >= 18 && temp <= 28) {
      adjustments.weather = 10; // Ideal weather
    } else if (temp > 35) {
      adjustments.weather = -10; // Very hot
    } else if (weather.description.toLowerCase().includes('rain') ||
               weather.description.toLowerCase().includes('thunderstorm')) {
      adjustments.weather = -5; // Heavy rain/thunderstorm
    }
  } catch (error) {
    // If weather API fails, no weather adjustment
    console.warn('Weather data unavailable for pricing:', error);
  }

  // Demand pricing - Mock implementation since we don't have real booking history
  // In a real app, this would query the database for bookings in last 7 days
  const mockBookingsLast7Days = Math.floor(Math.random() * 50); // Random for demo
  if (mockBookingsLast7Days > 40) {
    adjustments.demand = 20;
  } else if (mockBookingsLast7Days < 5) {
    adjustments.demand = -10;
  }

  // Weekend pricing
  const dayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    // Friday, Saturday, Sunday
    adjustments.weekend = 5;
  }

  // Last-minute booking
  const now = new Date();
  const hoursUntilTrip = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilTrip <= 48) {
    adjustments.lastMinute = 10;
  }

  // Calculate final price
  const totalAdjustmentPercent = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
  const finalPrice = basePrice * (1 + totalAdjustmentPercent / 100);

  // Generate pricing reason
  const reasons: string[] = [];
  if (adjustments.season > 0) reasons.push(`High season (+${adjustments.season}%)`);
  if (adjustments.season < 0) reasons.push(`Low season (${adjustments.season}%)`);
  if (adjustments.weather > 0) reasons.push(`Ideal weather (+${adjustments.weather}%)`);
  if (adjustments.weather < 0) reasons.push(`Weather conditions (${adjustments.weather}%)`);
  if (adjustments.demand > 0) reasons.push(`High demand (+${adjustments.demand}%)`);
  if (adjustments.demand < 0) reasons.push(`Low demand (${adjustments.demand}%)`);
  if (adjustments.weekend > 0) reasons.push(`Weekend travel (+${adjustments.weekend}%)`);
  if (adjustments.lastMinute > 0) reasons.push(`Last-minute booking (+${adjustments.lastMinute}%)`);

  const pricingReason = reasons.length > 0
    ? `Price adjusted due to: ${reasons.join(', ')}`
    : 'Standard pricing applied';

  return {
    basePrice,
    finalPrice: Math.round(finalPrice),
    adjustments,
    pricingReason,
  };
}

/**
 * Get pricing for multiple destinations
 */
export async function calculateMultiDestinationPrice(
  destinations: Destination[],
  startDate: Date,
  guests: number = 1,
  nights: number = 1
): Promise<PricingResult> {
  const totalBasePrice = destinations.reduce((sum, dest) => sum + dest.price, 0) * guests * nights;

  // For multi-destination, we'll use average adjustments
  // In a real implementation, you might want different logic
  const adjustmentPromises = destinations.map(dest =>
    calculateDynamicPrice(dest, startDate, 1, 1)
  );

  const results = await Promise.all(adjustmentPromises);

  const avgAdjustments: PricingAdjustments = {
    season: results.reduce((sum, r) => sum + r.adjustments.season, 0) / results.length,
    weather: results.reduce((sum, r) => sum + r.adjustments.weather, 0) / results.length,
    demand: results.reduce((sum, r) => sum + r.adjustments.demand, 0) / results.length,
    weekend: results[0].adjustments.weekend, // Same for all
    lastMinute: results[0].adjustments.lastMinute, // Same for all
  };

  const totalAdjustmentPercent = Object.values(avgAdjustments).reduce((sum, adj) => sum + adj, 0);
  const finalPrice = totalBasePrice * (1 + totalAdjustmentPercent / 100);

  const pricingReason = results[0].pricingReason; // Use first destination's reason as representative

  return {
    basePrice: totalBasePrice,
    finalPrice: Math.round(finalPrice),
    adjustments: avgAdjustments,
    pricingReason,
  };
}