import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("module and pension obligations use independent checkboxes", async () => {
  const source = await readFile(new URL("../src/features/payments/RegisterPayment.tsx", import.meta.url), "utf8");
  assert.match(source, /type="checkbox"/);
  assert.doesNotMatch(source, /type=\{[\s\S]*?"radio"/);
  assert.match(source, /selected\.includes\(key\)[\s\S]*?selected\.filter[\s\S]*?\.\.\.selected, key/);
  assert.match(source, /obligations: selectedCharges\.map/);
  assert.match(source, /onSaved\(\s*registration,/);
});
