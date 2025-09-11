// Base request utility for API calls
// Reusable HTTP client with error handling

const API_BASE: string | undefined = (import.meta as { env?: Record<string, unknown> }).env
  ?.VITE_API_BASE_URL as string | undefined;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic fetch wrapper with error handling
 * @param url - Full URL or path (will be prefixed with API_BASE if relative)
 * @param options - Fetch options
 * @returns Promise<T>
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(fullUrl, defaultOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      response.status,
      `API ${response.status}: ${errorText}`,
      response
    );
  }

  return (await response.json()) as T;
}

/**
 * GET request helper
 */
export async function get<T>(url: string): Promise<T> {
  return request<T>(url, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function post<T>(url: string, data?: unknown): Promise<T> {
  return request<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Check if API base URL is configured
 */
export function isApiEnabled(): boolean {
  return Boolean(API_BASE);
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string | undefined {
  return API_BASE;
}