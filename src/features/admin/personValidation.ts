export type PersonFieldErrors = Record<string, string>;

const required = (value: string, max: number) =>
  !value ? "required" : value.length > max ? "tooLong" : "";

export function validateStudentForm(
  values: Record<string, string>,
  createAccess: boolean,
) {
  const errors: PersonFieldErrors = {};
  for (const [field, max] of [
    ["dni", 30],
    ["firstName", 200],
    ["lastName", 200],
    ["representativeName", 200],
    ["representativeDocumentNumber", 30],
    ["primaryPhone", 30],
  ] as const) {
    const reason = required(values[field], max);
    if (reason) errors[field] = reason;
  }
  const birthDate = values.birthDate ?? "";
  const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
    !Number.isFinite(parsedBirthDate.getTime()) ||
    parsedBirthDate.toISOString().slice(0, 10) !== birthDate
  )
    errors.birthDate = values.birthDate ? "format" : "required";
  if (!(["MALE", "FEMALE", "OTHER"] as string[]).includes(values.gender))
    errors.gender = "format";
  if (!(["FATHER", "MOTHER", "OTHER"] as string[]).includes(values.relationship))
    errors.relationship = "format";
  if (values.relationship === "OTHER") {
    const reason = required(values.relationshipOther, 100);
    if (reason) errors.relationshipOther = reason;
  }
  if (!(["DNI", "CE", "PASSPORT"] as string[]).includes(values.representativeDocumentType))
    errors.representativeDocumentType = "format";
  else if (
    values.representativeDocumentType === "DNI"
      ? !/^\d{8}$/.test(values.representativeDocumentNumber)
      : !/^[A-Za-z0-9]{6,12}$/.test(values.representativeDocumentNumber)
  )
    errors.representativeDocumentNumber = "documentFormat";
  if (values.secondaryPhone.length > 30) errors.secondaryPhone = "tooLong";
  if (createAccess) {
    const usernameReason = required(values.username, 100);
    if (usernameReason) errors.username = usernameReason;
    const passwordReason = required(values.password, 256);
    if (passwordReason) errors.password = passwordReason;
  }
  return errors;
}

export function validateStaffForm(
  values: Record<string, string>,
  requirePassword: boolean,
) {
  const errors: PersonFieldErrors = {};
  const fullNameReason = required(values.fullName, 200);
  if (fullNameReason) errors.fullName = fullNameReason;
  const usernameReason = required(values.username, 100);
  if (usernameReason) errors.username = usernameReason;
  if (requirePassword) {
    const passwordReason = required(values.password, 256);
    if (passwordReason) errors.password = passwordReason;
  } else if (values.password.length > 256) errors.password = "tooLong";
  return errors;
}
