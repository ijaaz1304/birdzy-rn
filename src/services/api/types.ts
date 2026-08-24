/**
 * API Response Types
 * Standardized types for API responses across the application
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: ApiError[];
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Error structure
 */
export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Request configuration with common options
 */
export interface RequestConfig {
  skipAuth?: boolean;
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
  };
}
