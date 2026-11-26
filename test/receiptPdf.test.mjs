import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("receipt PDF displays the representative WhatsApp information", async () => {
  const locale = JSON.parse(
    await readFile(new URL("../src/locales/es.json", import.meta.url), "utf8"),
  );
  const source = await readFile(
    new URL("../src/features/payments/receiptPdf.ts", import.meta.url),
    "utf8",
  );

  assert.equal(locale.receipts.payerInformationHeading, "DATOS DEL APODERADO");
  assert.equal(locale.receipts.whatsapp, "WhatsApp");
  assert.equal(locale.receipts.notRegistered, "No registrado");
  assert.match(source, /receipt\.payer\.phone/);
  assert.match(source, /t\("receipts\.whatsapp"\)/);
  assert.match(source, /t\("receipts\.notRegistered"\)/);
});

test("view and download use the same receipt PDF builder", async () => {
  const source = await readFile(
    new URL("../src/features/payments/receiptPdf.ts", import.meta.url),
    "utf8",
  );
  const sharedBuilderCalls = source.match(/await createReceiptPdf\(receipt\)/g);
  assert.equal(sharedBuilderCalls?.length, 2);
});
