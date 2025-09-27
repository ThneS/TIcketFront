import type { Show, ShowListParams, PaginatedShows } from "../types/show";
import { get } from "./request";

/**
 * Fetch shows from the backend API
 * Supports both array response and paginated response formats
 * @param params - Query parameters for pagination
 * @returns Promise<Show[] | PaginatedShows>
 */
export async function fetchShows(
  params: ShowListParams = {}
): Promise<Show[] | PaginatedShows> {
  // Build query string
  const query = new URLSearchParams();
  if (params.page) {
    query.append("page", params.page.toString());
  }
  if (params.pageSize) {
    query.append("pageSize", params.pageSize.toString());
  }

  // Make API call
  const url = `/show${query.size ? `?${query.toString()}` : ""}`;
  const response = await get<Show[] | PaginatedShows>(url);

  // Handle both response formats
  if (Array.isArray(response)) {
    return response as Show[];
  }

  return response as PaginatedShows;
}

/**
 * Fetch a single show by ID
 * @param id - Show ID
 * @returns Promise<Show>
 */
export async function fetchShow(id: string): Promise<Show> {
  return get<Show>(`/show/${id}`);
}
