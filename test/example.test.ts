import { describe, expect, it } from "bun:test";

// Basic example test to verify Bun test setup
describe("Example Tests", () => {
  it("should pass a simple test", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle async tests", async () => {
    const result = await Promise.resolve("hello");
    expect(result).toBe("hello");
  });

  it("should work with TypeScript", () => {
    const message: string = "Hello, Bun!";
    expect(message).toBe("Hello, Bun!");
  });
});
