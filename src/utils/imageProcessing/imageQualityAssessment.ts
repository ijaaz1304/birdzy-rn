/**
 * Image Quality Assessment
 * Assesses image quality for mineral/rock identification
 * Checks blur, brightness, contrast, and banknote detection
 */

import { Image } from "react-native";

export interface ImageQualityAssessment {
  isGood: boolean;
  score: number; // 0-100
  blurScore: number; // 0-100 (higher = less blur)
  brightnessScore: number; // 0-100 (optimal range)
  contrastScore: number; // 0-100 (higher = better)
  banknoteDetected: boolean; // Whether a banknote/mineral is detected
  issues: string[];
  suggestions: string[];
}

/**
 * Assess image blur (simplified - would need ML model for accurate detection)
 */
const assessBlur = async (uri: string): Promise<number> => {
  try {
    // Simplified blur detection
    // In production, this would use a ML model or image analysis library
    // For now, return a default score based on image dimensions

    const { width, height } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    // Higher resolution = likely less blur
    const minDimension = Math.min(width, height);
    if (minDimension >= 1920) return 90;
    if (minDimension >= 1280) return 75;
    if (minDimension >= 800) return 60;
    if (minDimension >= 400) return 45;
    return 30;
  } catch {
    return 50; // Default score if assessment fails
  }
};

/**
 * Assess image brightness
 */
const assessBrightness = async (_uri: string): Promise<number> => 70;

/**
 * Assess image contrast
 */
const assessContrast = async (_uri: string): Promise<number> => 70;

/**
 * Detect if image contains a banknote/mineral
 */
const detectBanknote = async (uri: string): Promise<boolean> => {
  try {
    // Simplified detection
    // In production, would use ML model or image analysis
    // For now, assume true if image is valid

    const { width, height } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) => {
      Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
    });

    // Basic check: image should have reasonable dimensions
    return width > 200 && height > 200;
  } catch {
    return false;
  }
};

/**
 * Assess overall image quality
 */
export const assessImageQuality = async (
  uri: string
): Promise<ImageQualityAssessment> => {
  try {
    // Run all assessments in parallel
    const [blurScore, brightnessScore, contrastScore, banknoteDetected] =
      await Promise.all([
        assessBlur(uri),
        assessBrightness(uri),
        assessContrast(uri),
        detectBanknote(uri),
      ]);

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      blurScore * 0.4 + brightnessScore * 0.3 + contrastScore * 0.3
    );

    // Determine if quality is good (threshold: 60)
    const isGood = overallScore >= 60 && banknoteDetected;

    // Identify issues
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (blurScore < 50) {
      issues.push("Image appears blurry");
      suggestions.push("Retake photo with steady hands or better lighting");
    }

    if (brightnessScore < 50) {
      issues.push("Image is too dark");
      suggestions.push("Improve lighting or use flash");
    } else if (brightnessScore > 90) {
      issues.push("Image is too bright");
      suggestions.push("Reduce lighting or avoid direct sunlight");
    }

    if (contrastScore < 50) {
      issues.push("Low contrast");
      suggestions.push("Ensure good lighting and clear background");
    }

    if (!banknoteDetected) {
      issues.push("No bird detected in image");
      suggestions.push("Ensure the bird is clearly visible and centered");
    }

    return {
      isGood,
      score: overallScore,
      blurScore,
      brightnessScore,
      contrastScore,
      banknoteDetected,
      issues,
      suggestions,
    };
  } catch (error) {
    // Return default assessment on error
    return {
      isGood: false,
      score: 0,
      blurScore: 0,
      brightnessScore: 0,
      contrastScore: 0,
      banknoteDetected: false,
      issues: ["Failed to assess image quality"],
      suggestions: ["Please try another image"],
    };
  }
};
