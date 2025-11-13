// Simple test for weather fallback system
import { weatherService } from "./src/api/weather.ts";

console.log("Testing weather fallback system...\n");

// Test cases
const testCases = [
  { input: "gandipet mandal", expected: "Hyderabad" },
  { input: "Machu Picchu Trek", expected: "Cusco" },
  { input: "Unknown Location XYZ", expected: "Hyderabad" },
  { input: "Paris", expected: "Paris" }, // Should return same if no mapping
  { input: "machu picchu", expected: "Cusco" }, // Partial match
];

testCases.forEach(({ input, expected }) => {
  const result = weatherService.getFallbackCity(input);
  const status = result === expected ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} "${input}" → "${result}" (expected: "${expected}")`);
});

console.log("\nFallback system test completed!");
