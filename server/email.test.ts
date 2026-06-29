import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock the resend module before importing email.ts ─────────────────────────
const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

// Import after mock is set up
const { sendBookingConfirmation } = await import("./email");

const sampleData = {
  customerName: "Jane Smith",
  customerEmail: "jane@example.com",
  bookingDate: "2025-08-15",
  startHour: 10,
  durationHours: 1 as const,
  amountPaid: 2000,
  bookingRef: "ABC123456789",
};

describe("sendBookingConfirmation", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key_123";
    mockSend.mockReset();
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("returns false and logs a warning when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendBookingConfirmation(sampleData);
    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY not set")
    );
    warnSpy.mockRestore();
  });

  it("calls resend.emails.send with correct recipient and subject", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendBookingConfirmation(sampleData);

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.to).toBe("jane@example.com");
    expect(callArgs.subject).toContain("booked");
    expect(callArgs.html).toContain("Jane"); // HTML uses firstName
    expect(callArgs.html).toContain("$20.00");
    expect(callArgs.html).toContain("ABC123456789");
  });

  it("returns false when Resend returns an error object", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Invalid API key" } });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendBookingConfirmation(sampleData);

    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "[Email] Resend error:",
      expect.objectContaining({ message: "Invalid API key" })
    );
    errorSpy.mockRestore();
  });

  it("returns false and logs when resend.emails.send throws", async () => {
    mockSend.mockRejectedValue(new Error("Network error"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendBookingConfirmation(sampleData);

    expect(result).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "[Email] Failed to send confirmation email:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("includes 2-hour duration details correctly", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_456" }, error: null });

    const twoHourData = { ...sampleData, durationHours: 2 as const, amountPaid: 4000 };
    await sendBookingConfirmation(twoHourData);

    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("$40.00");
    expect(callArgs.html).toContain("2 hours");
    expect(callArgs.text).toContain("2 hours");
  });
});
