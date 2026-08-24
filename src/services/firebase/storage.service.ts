/**
 * Firebase Storage Service
 * Handles image uploads and file storage
 */

// Lazy import storage to avoid initialization issues
import { firebasePerf } from "../../lib/firebase";
import { analyticsService, EVENTS } from "../analytics/analytics.service";

export interface UploadImageOptions {
  path: string; // e.g., 'posts/images'
  fileName: string; // e.g., 'post-123-image.jpg'
  uri: string; // Local file URI
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  url: string;
  path: string;
}

class StorageService {
  /**
   * Get Firebase Storage instance (lazy import)
   */
  private getStorage() {
    const storage = require("@react-native-firebase/storage").default;
    return storage();
  }

  /**
   * Upload an image to Firebase Storage
   */
  async uploadImage(options: UploadImageOptions): Promise<UploadResult> {
    const trace = await firebasePerf.startTrace("storage_upload_image");

    try {
      trace.putAttribute("file_name", options.fileName);
      trace.putAttribute("path", options.path);

      const reference = this.getStorage().ref(
        `${options.path}/${options.fileName}`
      );
      const task = reference.putFile(options.uri);

      // Track upload progress
      if (options.onProgress) {
        task.on("state_changed", (snapshot: { bytesTransferred: number; totalBytes: number }) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options.onProgress?.(progress);
        });
      }

      await task;
      const url = await reference.getDownloadURL();

      await trace.stop();

      analyticsService.logEvent(EVENTS.image_uploaded, {
        file_name: options.fileName,
        path: options.path,
        file_size: (await reference.getMetadata()).size,
      });

      return { url, path: reference.fullPath };
    } catch (error) {
      await trace.stop();
      throw error;
    }
  }

  /**
   * Delete an image from Firebase Storage
   */
  async deleteImage(path: string): Promise<void> {
    try {
      const reference = this.getStorage().ref(path);
      await reference.delete();

      analyticsService.logEvent(EVENTS.image_deleted, { path });
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  }

  /**
   * Get download URL for an image
   */
  async getDownloadURL(path: string): Promise<string> {
    try {
      const reference = this.getStorage().ref(path);
      return await reference.getDownloadURL();
    } catch (error) {
      console.error("Error getting download URL:", error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
