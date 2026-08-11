import { describe, expect, test } from "bun:test";
import { runMutation, runQuery } from "./api-mutation";

describe("API operations", () => {
  test("returns successful query values", async () => {
    const result = await runQuery("test.query", {}, async () => "value");

    expect(result).toEqual({ value: "value" });
  });

  test("returns a JSON 500 when a query fails", async () => {
    const result = await runQuery("test.query", {}, async () => {
      throw new Error("database unavailable");
    });

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(500);
      expect(await result.response.json()).toEqual({
        error: "Something went wrong. Please try again.",
      });
    }
  });

  test("returns a JSON 503 when a mutation fails", async () => {
    const result = await runMutation("test.mutation", {}, async () => {
      throw new Error("database unavailable");
    });

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(503);
      expect(await result.response.json()).toEqual({
        error: "Something went wrong. Please try again.",
      });
    }
  });
});
