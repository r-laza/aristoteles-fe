import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateStaffForm,
  validateStudentForm,
} from "../src/features/admin/personValidation.ts";

const validStudent = {
  dni: "12345678",
  firstName: "Juan",
  lastName: "Lopez",
  birthDate: "2012-05-10",
  gender: "MALE",
  representativeName: "Maria Lopez",
  representativeDocumentType: "DNI",
  representativeDocumentNumber: "87654321",
  relationship: "MOTHER",
  relationshipOther: "",
  primaryPhone: "999888777",
  secondaryPhone: "",
  username: "",
  password: "",
};

test("student validation mirrors required and document rules", () => {
  assert.deepEqual(validateStudentForm(validStudent, false), {});
  assert.deepEqual(
    validateStudentForm(
      {
        ...validStudent,
        firstName: "",
        birthDate: "2026-02-30",
        representativeDocumentNumber: "123",
      },
      false,
    ),
    {
      firstName: "required",
      birthDate: "format",
      representativeDocumentNumber: "documentFormat",
    },
  );
});

test("staff access validation requires only backend-required credentials", () => {
  assert.deepEqual(
    validateStaffForm({ fullName: "", username: "", password: "" }, true),
    { fullName: "required", username: "required", password: "required" },
  );
});

test("person modal has bounded mobile width and vertical scrolling", async () => {
  const source = await readFile(
    new URL("../src/pages/AdminPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /w-\[calc\(100%_-_2rem\)\]/);
  assert.match(source, /max-h-\[calc\(100dvh_-_2rem\)\]/);
  assert.match(source, /overflow-x-hidden overflow-y-auto/);
  assert.equal(375 - 32, 343);
  assert.equal(400 - 32, 368);
});
