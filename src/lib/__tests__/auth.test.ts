import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockSign = vi.fn().mockResolvedValue("mock-token");
const mockSetProtectedHeader = vi.fn().mockReturnThis();
const mockSetExpirationTime = vi.fn().mockReturnThis();
const mockSetIssuedAt = vi.fn().mockReturnThis();
const mockSignJWT = vi.fn().mockImplementation(() => ({
  setProtectedHeader: mockSetProtectedHeader,
  setExpirationTime: mockSetExpirationTime,
  setIssuedAt: mockSetIssuedAt,
  sign: mockSign,
}));

vi.mock("jose", () => ({ SignJWT: mockSignJWT }));

const mockCookieSet = vi.fn();
const mockCookieStore = { set: mockCookieSet };
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

beforeEach(() => vi.clearAllMocks());

test("createSession signs a JWT with userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  expect(mockSignJWT).toHaveBeenCalledWith(
    expect.objectContaining({ userId: "user-1", email: "test@example.com" })
  );
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets JWT with HS256 and 7d expiry", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSetExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSetIssuedAt).toHaveBeenCalled();
});

test("createSession sets an httpOnly cookie with the token", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledWith(
    "auth-token",
    "mock-token",
    expect.objectContaining({ httpOnly: true })
  );
});

test("createSession sets cookie to expire in ~7 days", async () => {
  const before = Date.now();
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const cookieOptions = mockCookieSet.mock.calls[0][2];
  const expiresMs = cookieOptions.expires.getTime();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs);
  expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs);
});
