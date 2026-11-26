import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  payerFieldValue,
  validatePayerInformation,
} from "../src/features/payments/payerValidation.ts";

test("missing payer values and display placeholders initialize as empty", () => {
  assert.equal(payerFieldValue(null), "");
  assert.equal(payerFieldValue("  Sin registrar  "), "");
  assert.equal(payerFieldValue("María López"), "María López");
});

test("payer validation reports each missing required field", () => {
  assert.deepEqual(
    validatePayerInformation({
      payerName: "Sin registrar",
      documentType: "DNI",
      payerDocumentNumber: "",
    }),
    {
      payerName: "required",
      payerDocumentNumber: "required",
    },
  );
});

test("payer validation applies the existing document rules", () => {
  assert.deepEqual(
    validatePayerInformation({
      payerName: "Juan López",
      documentType: "DNI",
      payerDocumentNumber: "1234",
    }),
    { payerDocumentNumber: "documentFormat" },
  );
  assert.deepEqual(
    validatePayerInformation({
      payerName: "Juan López",
      documentType: "CE",
      payerDocumentNumber: "ABC12345",
    }),
    {},
  );
});

test("payment form exposes accessible inline payer errors", async () => {
  const source = await readFile(
    new URL("../src/features/payments/RegisterPayment.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /placeholder=\{t\("receipts\.unregisteredPlaceholder"\)\}/);
  assert.match(source, /aria-invalid=\{Boolean\(payerErrors\.payerName\)\}/);
  assert.match(source, /id="payer-document-number-error"/);
  assert.match(source, /noValidate/);
});
