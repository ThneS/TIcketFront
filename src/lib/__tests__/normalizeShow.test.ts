import { describe, it, expect } from "vitest";
import { normalizeShowFromBackend } from "../normalizeShow";

function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

describe("normalizeShowFromBackend", () => {
  it("handles snake_case backend payload", () => {
    const input = {
      id: "1",
      name: "WEB3峰会",
      description: "大咖云集，够W你就来",
      location: "上海世纪大厦",
      event_time: "1759060800",
      ticket_price: "100000000000000000",
      max_tickets: "100",
      sold_tickets: "0",
      is_active: false,
      organizer: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
      created_at: "2025-09-27T12:01:00.455137Z",
      metadata_uri: "ipfs://bafy.../meta.json",
    };
    const n = normalizeShowFromBackend(input)!;
    expect(n).toBeTruthy();
    expect(n.id).toBe("1");
    expect(n.name).toBe("WEB3峰会");
    expect(n.description).toContain("大咖");
    expect(n.location).toBe("上海世纪大厦");
    expect(isValidDate(n.startTime)).toBe(true);
    expect(n.ticketPrice).toBe(BigInt("100000000000000000"));
    expect(n.maxTickets).toBe(100n);
    expect(n.soldTickets).toBe(0n);
    expect(n.organizer.toLowerCase()).toBe(
      "0x8a791620dd6260079bf849dc5567adc3f2fdc318"
    );
    expect(n.isActive).toBe(false);
    expect(n.metadataURI).toBe("ipfs://bafy.../meta.json");
    expect(n.status).toBe(0);
  });

  it("handles camelCase backend payload", () => {
    const input = {
      id: 2,
      name: "Music Fest",
      description: "Annual music festival",
      location: "Stadium",
      eventTime: 1759060800,
      ticketPrice: "299000000000000000",
      maxTickets: 10000,
      soldTickets: 3500,
      isActive: true,
      organizer: "0x000000000000000000000000000000000000dead",
      metadataURI: "ipfs://meta/music.json",
    };
    const n = normalizeShowFromBackend(input)!;
    expect(n.id).toBe("2");
    expect(n.name).toBe("Music Fest");
    expect(n.location).toBe("Stadium");
    expect(isValidDate(n.startTime)).toBe(true);
    expect(n.ticketPrice).toBe(BigInt("299000000000000000"));
    expect(n.maxTickets).toBe(10000n);
    expect(n.soldTickets).toBe(3500n);
    expect(n.isActive).toBe(true);
    expect(n.status).toBe(1); // from isActive
    expect(n.metadataURI).toBe("ipfs://meta/music.json");
  });

  it("handles mixed fields and fallbacks", () => {
    const input = {
      id: "3",
      name: "Art Expo",
      place: "Gallery",
      price: 99000000000000000,
      totalTickets: "3000",
      ticketsSold: "1200",
      isActive: "true",
      meta: { uri: "ipfs://meta/art.json" },
    };
    const n = normalizeShowFromBackend(input)!;
    expect(n.id).toBe("3");
    expect(n.location).toBe("Gallery");
    expect(n.ticketPrice).toBe(99000000000000000n);
    expect(n.maxTickets).toBe(3000n);
    expect(n.soldTickets).toBe(1200n);
    expect(n.isActive).toBe(true);
    expect(n.metadataURI).toBe("ipfs://meta/art.json");
    expect(isValidDate(n.startTime)).toBe(true); // fallback date exists
  });

  it("applies sensible defaults when fields missing", () => {
    const input = { id: "0" };
    const n = normalizeShowFromBackend(input)!;
    expect(n.name).toBe("(未命名)");
    expect(n.description).toBe("");
    expect(n.location).toBe("-");
    expect(isValidDate(n.startTime)).toBe(true);
    expect(n.ticketPrice).toBe(0n);
    expect(n.maxTickets).toBe(0n);
    expect(n.soldTickets).toBe(0n);
    expect(typeof n.isActive).toBe("boolean");
    expect(typeof n.status).toBe("number");
    expect(n.metadataURI).toBe("");
  });
});
