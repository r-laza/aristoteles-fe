import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

test("new payments expose exactly the four supported methods", async () => {
  const source = await readFile(
    new URL("../src/services/payments.api.ts", import.meta.url),
    "utf8",
  );
  const definition = source.match(/export const methods = \[([\s\S]*?)\] as const;/);
  assert.ok(definition);
  assert.deepEqual(
    [...definition[1].matchAll(/"([A-Z]+)"/g)].map((match) => match[1]),
    ["CASH", "TRANSFER", "YAPE", "PLIN"],
  );
});
