/**
 * Static Map API Test Utility
 *
 * Helper function to test if Google Maps Static API is working
 * Run this in dev mode to verify API key configuration
 */

import { GOOGLE_MAPS_API_KEY } from "../constants/env";
import { getStaticMapUrl } from "./staticMapApi";

/**
 * Test if the Google Maps Static API key is working
 * @returns Promise<boolean> - true if API key works, false otherwise
 */
export const testStaticMapApi = async (): Promise<boolean> => {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.trim() === "") {
    console.error("❌ GOOGLE_MAPS_API_KEY is not set");
    return false;
  }

  try {
    // Test with a known location (San Francisco)
    const testUrl = getStaticMapUrl({
      latitude: 37.7749,
      longitude: -122.4194,
      width: 400,
      height: 300,
      zoom: 15,
    });

    // Try to fetch the image
    const response = await fetch(testUrl);

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.startsWith("image/")) {
        console.log("✅ Google Maps Static API is working correctly");
        return true;
      } else {
        // API returned an error (usually JSON error response)
        const errorText = await response.text();
        console.error("❌ Google Maps API returned error:", errorText);
        return false;
      }
    } else {
      console.error(`❌ Google Maps API returned status: ${response.status}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return false;
    }
  } catch (error: any) {
    console.error("❌ Error testing Google Maps Static API:", error.message);
    return false;
  }
};
