import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchShows, fetchShow } from "../show";
import type { Show, PaginatedShows } from "../../types/show";

// Mock the request module (http helper)
vi.mock("../request", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { http } from "../request";
const mockGet = vi.mocked(http.get);

describe("Shows API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchShows", () => {
    it("should fetch shows with no parameters", async () => {
      const mockShows: Show[] = [
        { id: "1", name: "Test Show 1", description: "A test show" },
        { id: "2", name: "Test Show 2", description: "Another test show" },
      ];

      mockGet.mockResolvedValue(mockShows);

      const result = await fetchShows();

      expect(mockGet).toHaveBeenCalledWith("/shows", {
        query: { limit: undefined, offset: undefined },
      });
      expect(result).toEqual(mockShows);
    });

    it("should fetch shows with pagination parameters", async () => {
      const mockShows: Show[] = [{ id: "1", name: "Test Show 1" }];

      mockGet.mockResolvedValue(mockShows);

      const result = await fetchShows({ page: 2, pageSize: 10 });

      expect(mockGet).toHaveBeenCalledWith("/shows", {
        query: { limit: 10, offset: 10 },
      });
      expect(result).toEqual(mockShows);
    });

    it("should handle paginated response format", async () => {
      const mockPaginatedResponse: PaginatedShows = {
        items: [
          { id: "1", name: "Test Show 1" },
          { id: "2", name: "Test Show 2" },
        ],
        total: 10,
        page: 1,
        pageSize: 2,
      };

      mockGet.mockResolvedValue(mockPaginatedResponse);

      const result = await fetchShows({ page: 1, pageSize: 2 });

      expect(mockGet).toHaveBeenCalledWith("/shows", {
        query: { limit: 2, offset: 0 },
      });
      expect(result).toEqual(mockPaginatedResponse);
    });

    it("should handle array response format", async () => {
      const mockArrayResponse: Show[] = [
        { id: "1", name: "Test Show 1" },
        { id: "2", name: "Test Show 2" },
      ];

      mockGet.mockResolvedValue(mockArrayResponse);

      const result = await fetchShows();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(mockArrayResponse);
    });

    it("should handle API errors", async () => {
      const mockError = new Error("API 500: Internal Server Error");
      mockGet.mockRejectedValue(mockError);

      await expect(fetchShows()).rejects.toThrow(
        "API 500: Internal Server Error"
      );
    });

    it("should correctly serialize query parameters", async () => {
      mockGet.mockResolvedValue([]);

      // Test with only page -> default page size (from constants, currently 12)
      await fetchShows({ page: 5 });
      expect(mockGet).toHaveBeenLastCalledWith("/shows", {
        query: { limit: 12, offset: 48 },
      });

      // Test with only pageSize
      await fetchShows({ pageSize: 25 });
      expect(mockGet).toHaveBeenLastCalledWith("/shows", {
        query: { limit: 25, offset: 0 },
      });

      // Test with both
      await fetchShows({ page: 3, pageSize: 15 });
      expect(mockGet).toHaveBeenLastCalledWith("/shows", {
        query: { limit: 15, offset: 30 },
      });
    });
  });

  describe("fetchShow", () => {
    it("should fetch a single show by ID", async () => {
      const mockShow: Show = {
        id: "123",
        name: "Specific Show",
        description: "A specific show",
        createdAt: "2023-12-01T00:00:00Z",
      };

      mockGet.mockResolvedValue(mockShow);

      const result = await fetchShow("123");

      expect(mockGet).toHaveBeenCalledWith("/show/123");
      expect(result).toEqual(mockShow);
    });

    it("should handle 404 errors for non-existent shows", async () => {
      const mockError = new Error("API 404: Show not found");
      mockGet.mockRejectedValue(mockError);

      await expect(fetchShow("non-existent")).rejects.toThrow(
        "API 404: Show not found"
      );
    });

    it("should handle shows with extra fields", async () => {
      const mockShowWithExtras: Show = {
        id: "456",
        name: "Show with Extras",
        description: "A show with extra fields",
        customField: "custom value",
        anotherField: 123,
      };

      mockGet.mockResolvedValue(mockShowWithExtras);

      const result = await fetchShow("456");

      expect(result).toEqual(mockShowWithExtras);
      expect(result.customField).toBe("custom value");
      expect(result.anotherField).toBe(123);
    });
  });
});
