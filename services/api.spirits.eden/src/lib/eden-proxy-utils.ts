// Eden API Proxy Utilities
// Common utilities for Eden API proxy endpoints

import { NextRequest, NextResponse } from 'next/server';
import { EdenApiResponse, EdenApiError, RequestLog } from './eden-proxy-types';

// Configuration
export const EDEN_CONFIG = {
  baseUrl: 'https://api.eden.art/v2',
  timeout: 30000, // 30 seconds
  maxRetries: 2,
};

// CORS headers for all Eden proxy endpoints
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

// Extract Eden API key from request headers
export function extractEdenApiKey(request: NextRequest): string {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    throw new Error('X-API-Key header is required for Eden API requests');
  }
  return apiKey;
}

// Create headers for Eden API requests
export function createEdenHeaders(request: NextRequest): HeadersInit {
  const apiKey = extractEdenApiKey(request);
  
  const headers: HeadersInit = {
    'X-Api-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Forward User-Agent if present
  const userAgent = request.headers.get('user-agent');
  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }

  // Forward Accept-Language if present
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }

  return headers;
}

// Log request with timing and error details
export function logRequest(log: RequestLog): void {
  const emoji = log.error ? '❌' : '✅';
  const duration = log.duration ? `${log.duration}ms` : 'N/A';
  const status = log.statusCode ? `[${log.statusCode}]` : '';
  
  console.log(`${emoji} Eden API Proxy: ${log.method} ${log.endpoint} ${status} (${duration})`);
  
  if (log.error) {
    console.error(`   Error: ${log.error}`);
  }
}

// Create standardized error response
export function createErrorResponse(
  error: string,
  statusCode = 500,
  details?: string
): NextResponse {
  const errorResponse: EdenApiError = {
    success: false,
    error,
    statusCode,
    ...(details && { details }),
  };

  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: corsHeaders,
  });
}

// Create standardized success response
export function createSuccessResponse<T>(
  data: T,
  statusCode = 200
): NextResponse {
  const response: EdenApiResponse<T> = {
    success: true,
    data,
  };

  return NextResponse.json(response, {
    status: statusCode,
    headers: corsHeaders,
  });
}

// Make request to Eden API with error handling and logging
export async function makeEdenRequest(
  endpoint: string,
  options: RequestInit,
  request: NextRequest
): Promise<{ response: Response; duration: number }> {
  const startTime = Date.now();
  const method = options.method || 'GET';
  const fullUrl = `${EDEN_CONFIG.baseUrl}${endpoint}`;

  try {
    console.log(`🔄 Eden API Request: ${method} ${endpoint}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EDEN_CONFIG.timeout);

    const response = await fetch(fullUrl, {
      ...options,
      headers: createEdenHeaders(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    logRequest({
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      duration,
      statusCode: response.status,
    });

    return { response, duration };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.name === 'AbortError' 
      ? 'Request timeout after 30 seconds'
      : error.message || 'Unknown error';

    logRequest({
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      duration,
      error: errorMessage,
    });

    throw new Error(errorMessage);
  }
}

// Parse query parameters with type safety
export function parseQueryParams<T extends Record<string, any>>(
  request: NextRequest,
  defaults: T = {} as T
): T {
  const { searchParams } = new URL(request.url);
  const params = { ...defaults };

  for (const [key, value] of searchParams.entries()) {
    if (key in params) {
      // Type coercion based on default value type
      const defaultValue = params[key as keyof T];
      if (typeof defaultValue === 'number') {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          (params as any)[key] = num;
        }
      } else if (typeof defaultValue === 'boolean') {
        (params as any)[key] = value === 'true';
      } else {
        (params as any)[key] = value;
      }
    } else {
      (params as any)[key] = value;
    }
  }

  return params;
}

// Handle OPTIONS requests for CORS
export async function handleOptions(): Promise<NextResponse> {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// Validate required request body fields
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// Create URL with query parameters
export function createUrlWithParams(
  endpoint: string,
  params: Record<string, any>
): string {
  const url = new URL(endpoint, EDEN_CONFIG.baseUrl);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.pathname + url.search;
}

// Map HTTP status codes to appropriate error messages
export function getErrorMessage(statusCode: number, defaultMessage: string): string {
  switch (statusCode) {
    case 400:
      return 'Bad request - invalid parameters';
    case 401:
      return 'Unauthorized - invalid API key';
    case 403:
      return 'Forbidden - access denied';
    case 404:
      return 'Not found - resource does not exist';
    case 429:
      return 'Rate limit exceeded - too many requests';
    case 500:
      return 'Internal server error';
    case 502:
      return 'Bad gateway - upstream server error';
    case 503:
      return 'Service unavailable - try again later';
    case 504:
      return 'Gateway timeout - upstream server timeout';
    default:
      return defaultMessage;
  }
}