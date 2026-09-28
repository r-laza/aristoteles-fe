import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Eye,
  KeyRound,
  Pencil,
  Plus,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { PasswordInput } from "../auth/PasswordInput";
import type { Person } from "../auth/types";
import { peopleApi, type CreatePersonInput } from "../services/auth.api";
import { ApiError } from "../services/api";
import { t } from "../lib/i18n";

type TabRole = "STUDENT" | "TEACHER" | "ADMIN";
type StudentInput = Extract<CreatePersonInput, { role: "STUDENT" }>;

function Modal({
  title,
  onClose,
  busy = false,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => dialog.current?.showModal(), []);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      aria-labelledby="modal-title"
      className="w-[calc(100%-2rem)] max-w-2xl rounded-2xl p-6 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 id="modal-title" className="text-xl font-bold text-sky-950">
          {title}
        </h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label={t("admin.close")}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        maxLength={type === "date" ? undefined : 200}
        className="field"
      />
    </div>
  );
}

function StatusField({ defaultValue = true }: { defaultValue?: boolean }) {
  return (
    <div>
      <label htmlFor="isActive" className="field-label">
        {t("admin.status")}
      </label>
      <select
        id="isActive"
        name="isActive"
        defaultValue={String(defaultValue)}
        className="field"
      >
        <option value="true">{t("admin.active")}</option>
        <option value="false">{t("admin.inactive")}</option>
      </select>
    </div>
  );
}

function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p role="alert" className="text-sm text-red-700">
      {error}
    </p>
  ) : null;
}

function FormActions({
  busy,
  onClose,
  editing = false,
}: {
  busy: boolean;
  onClose: () => void;
  editing?: boolean;
}) {
  return (
    <div className="flex justify-end gap-3 pt-3">
      <button
        type="button"
        disabled={busy}
        onClick={onClose}
        className="rounded-xl border px-4 py-2"
      >
        {t("admin.cancel")}
      </button>
      <button disabled={busy} className="primary-button">
        {t(
          busy
            ? "admin.saving"
            : editing
              ? "admin.saveChanges"
              : "admin.create",
        )}
      </button>
    </div>
  );
}

function StudentForm({
  student,
  onClose,
  onSaved,
}: {
  student?: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [access, setAccess] = useState(false);
  const [relationship, setRelationship] = useState(
    student?.relationship ?? "FATHER",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    const input: StudentInput = {
      role: "STUDENT",
      dni: value("dni"),
      firstName: value("firstName"),
      lastName: value("lastName"),
      birthDate: value("birthDate"),
      gender: value("gender") as StudentInput["gender"],
      representativeName: value("representativeName"),
      relationship: value("relationship") as StudentInput["relationship"],
      relationshipOther: value("relationshipOther") || undefined,
      primaryPhone: value("primaryPhone"),
      secondaryPhone: value("secondaryPhone") || undefined,
      isActive: value("isActive") === "true",
      createAccess: !student && access,
      username: !student && access ? value("username") : undefined,
      password: !student && access ? String(data.get("password")) : undefined,
    };
    try {
      if (student) {
        const {
          role: _role,
          createAccess: _access,
          username: _username,
          password: _password,
          ...details
        } = input;
        await peopleApi.updateStudent(student.id, details);
      } else await peopleApi.create(input);
      onSaved();
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "admin.duplicate"
            : "admin.error",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("admin.dni")}
            name="dni"
            defaultValue={student?.dni}
          />
          <Field
            label={t("admin.birthDate")}
            name="birthDate"
            type="date"
            defaultValue={student?.birthDate?.slice(0, 10)}
          />
          <Field
            label={t("admin.firstName")}
            name="firstName"
            defaultValue={student?.firstName}
          />
          <Field
            label={t("admin.lastName")}
            name="lastName"
            defaultValue={student?.lastName}
          />
        </div>
        <div>
          <label htmlFor="gender" className="field-label">
            {t("admin.gender")}
          </label>
          <select
            id="gender"
            name="gender"
            defaultValue={student?.gender ?? "MALE"}
            className="field"
          >
            {["MALE", "FEMALE", "OTHER"].map((value) => (
              <option key={value} value={value}>
                {t(`admin.genders.${value}`)}
              </option>
            ))}
          </select>
        </div>
        <Field
          label={t("admin.representativeName")}
          name="representativeName"
          defaultValue={student?.representativeName}
        />
        <div>
          <label htmlFor="relationship" className="field-label">
            {t("admin.relationship")}
          </label>
          <select
            id="relationship"
            name="relationship"
            value={relationship}
            onChange={(event) =>
              setRelationship(
                event.target.value as StudentInput["relationship"],
              )
            }
            className="field"
          >
            {["FATHER", "MOTHER", "OTHER"].map((value) => (
              <option key={value} value={value}>
                {t(`admin.relationships.${value}`)}
              </option>
            ))}
          </select>
        </div>
        {relationship === "OTHER" && (
          <Field
            label={t("admin.relationshipOther")}
            name="relationshipOther"
            defaultValue={student?.relationshipOther ?? undefined}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("admin.primaryPhone")}
            name="primaryPhone"
            type="tel"
            defaultValue={student?.primaryPhone}
          />
          <Field
            label={t("admin.secondaryPhone")}
            name="secondaryPhone"
            type="tel"
            required={false}
            defaultValue={student?.secondaryPhone ?? undefined}
          />
        </div>
        <StatusField defaultValue={student?.isActive} />
        {!student && (
          <>
            <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={access}
                onChange={(event) => setAccess(event.target.checked)}
                className="mt-1"
              />
              <span>{t("admin.createAccessForStudent")}</span>
            </label>
            {access && (
              <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
                <Field label={t("auth.username")} name="username" />
                <div>
                  <label htmlFor="password" className="field-label">
                    {t("admin.temporaryPassword")}
                  </label>
                  <PasswordInput id="password" newPassword />
                </div>
              </div>
            )}
          </>
        )}
      </fieldset>
      <ErrorMessage error={error} />
      <FormActions busy={busy} onClose={onClose} editing={Boolean(student)} />
    </form>
  );
}

function StaffForm({
  role,
  person,
  onClose,
  onSaved,
}: {
  role: Exclude<TabRole, "STUDENT">;
  person?: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const input = {
      fullName: String(data.get("fullName")).trim(),
      username: String(data.get("username")).trim(),
      password: String(data.get("password") ?? ""),
      isActive: data.get("isActive") === "true",
    };
    try {
      if (person)
        await peopleApi.updateUser(person.id, {
          ...input,
          password: input.password || undefined,
        });
      else await peopleApi.create({ ...input, role });
      onSaved();
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "admin.duplicate"
            : "admin.error",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field
          label={t("admin.fullName")}
          name="fullName"
          defaultValue={person?.fullName}
        />
        <Field
          label={t("auth.username")}
          name="username"
          defaultValue={person?.username ?? undefined}
        />
        <div>
          <label htmlFor="password" className="field-label">
            {t(person ? "admin.newPasswordOptional" : "auth.password")}
          </label>
          {person ? (
            <input
              id="password"
              name="password"
              type="password"
              maxLength={256}
              autoComplete="new-password"
              className="field"
            />
          ) : (
            <PasswordInput id="password" newPassword />
          )}
        </div>
        <StatusField defaultValue={person?.isActive} />
      </fieldset>
      <ErrorMessage error={error} />
      <FormActions busy={busy} onClose={onClose} editing={Boolean(person)} />
    </form>
  );
}

function AccessForm({
  student,
  onClose,
  onSaved,
}: {
  student: Person;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const exists = Boolean(student.username);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await peopleApi.manageAccess(student.id, {
        username: String(data.get("username")).trim(),
        password: String(data.get("password") ?? "") || undefined,
        isActive: data.get("isActive") === "true",
      });
      onSaved();
    } catch (cause) {
      setError(
        t(
          cause instanceof ApiError && cause.status === 409
            ? "admin.duplicate"
            : "admin.error",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <Field
          label={t("auth.username")}
          name="username"
          defaultValue={student.username ?? undefined}
        />
        <div>
          <label htmlFor="password" className="field-label">
            {t(
              exists ? "admin.newPasswordOptional" : "admin.temporaryPassword",
            )}
          </label>
          {exists ? (
            <input
              id="password"
              name="password"
              type="password"
              maxLength={256}
              autoComplete="new-password"
              className="field"
            />
          ) : (
            <PasswordInput id="password" newPassword />
          )}
        </div>
        <StatusField defaultValue={student.accessIsActive ?? true} />
      </fieldset>
      <ErrorMessage error={error} />
      <FormActions busy={busy} onClose={onClose} editing={exists} />
    </form>
  );
}

function Details({ student }: { student: Person }) {
  const rows: Array<[string, ReactNode]> = [
    ["admin.dni", student.dni],
    ["admin.fullName", student.fullName],
    [
      "admin.birthDate",
      student.birthDate
        ? new Date(student.birthDate).toLocaleDateString("es-EC", {
            timeZone: "UTC",
          })
        : "",
    ],
    [
      "admin.gender",
      student.gender ? t(`admin.genders.${student.gender}`) : "",
    ],
    ["admin.representativeName", student.representativeName],
    [
      "admin.relationship",
      student.relationship === "OTHER"
        ? student.relationshipOther
        : student.relationship
          ? t(`admin.relationships.${student.relationship}`)
          : "",
    ],
    ["admin.primaryPhone", student.primaryPhone],
    [
      "admin.secondaryPhoneLabel",
      student.secondaryPhone ?? t("admin.unavailable"),
    ],
    ["admin.platformAccess", student.username ?? t("admin.noAccess")],
    ["admin.status", t(student.isActive ? "admin.active" : "admin.inactive")],
    [
      "admin.registrationDate",
      new Date(student.createdAt).toLocaleDateString("es-EC"),
    ],
  ];
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {rows.map(([key, value]) => (
        <div key={key} className="rounded-xl bg-slate-50 p-3">
          <dt className="text-sm text-slate-500">{t(key)}</dt>
          <dd className="mt-1 break-words font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Badge({
  active,
  children,
}: {
  active?: boolean | null;
  children: ReactNode;
}) {
  const tone =
    active === true
      ? "bg-emerald-50 text-emerald-700"
      : active === false
        ? "bg-slate-100 text-slate-600"
        : "bg-amber-50 text-amber-700";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge active={active}>
      {t(active ? "admin.active" : "admin.inactive")}
    </Badge>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1">{children}</div>;
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-8 items-center justify-center rounded-lg text-cyan-700 transition hover:bg-cyan-50 hover:text-cyan-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

function AccessStatus({ person }: { person: Person }) {
  if (!person.username) return <Badge>{t("admin.noAccess")}</Badge>;
  return (
    <div className="min-w-0">
      <span className="block truncate font-medium" title={person.username}>
        {person.username}
      </span>
      <StatusBadge active={Boolean(person.accessIsActive)} />
    </div>
  );
}

function StudentActions({
  person,
  onDetails,
  onEdit,
  onAccess,
}: {
  person: Person;
  onDetails: (p: Person) => void;
  onEdit: (p: Person) => void;
  onAccess: (p: Person) => void;
}) {
  const accessLabel = t(
    person.username ? "admin.manageAccess" : "admin.createPlatformAccess",
  );
  return (
    <Actions>
      <ActionButton
        label={t("admin.viewDetails")}
        icon={Eye}
        onClick={() => onDetails(person)}
      />
      <ActionButton
        label={t("admin.editStudent")}
        icon={Pencil}
        onClick={() => onEdit(person)}
      />
      <ActionButton
        label={accessLabel}
        icon={person.username ? KeyRound : UserPlus}
        onClick={() => onAccess(person)}
      />
    </Actions>
  );
}

function StudentTable({
  people,
  onDetails,
  onEdit,
  onAccess,
}: {
  people: Person[];
  onDetails: (p: Person) => void;
  onEdit: (p: Person) => void;
  onAccess: (p: Person) => void;
}) {
  return (
    <>
      <div className="hidden w-full md:block">
        <table className="w-full table-fixed text-left text-xs lg:text-sm">
          <colgroup>
            <col className="w-[8%]" />
            <col className="w-[16%]" />
            <col className="w-[16%]" />
            <col className="w-[17%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="border-b text-slate-500">
            <tr>
              {[
                "admin.dni",
                "admin.firstName",
                "admin.lastName",
                "admin.representative",
                "admin.phone",
                "admin.access",
                "admin.status",
                "admin.actions",
              ].map((key) => (
                <th
                  key={key}
                  className={`px-1.5 py-3 font-medium lg:px-2 ${key === "admin.actions" ? "text-right" : ""}`}
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr
                key={person.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="break-words px-1.5 py-4 lg:px-2">
                  {person.dni}
                </td>
                <td className="break-words px-1.5 py-4 font-medium lg:px-2">
                  {person.firstName}
                </td>
                <td className="break-words px-1.5 py-4 font-medium lg:px-2">
                  {person.lastName}
                </td>
                <td className="break-words px-1.5 py-4 lg:px-2">
                  {person.representativeName}
                </td>
                <td className="break-words px-1.5 py-4 lg:px-2">
                  {person.primaryPhone}
                </td>
                <td className="px-1.5 py-4 lg:px-2">
                  <AccessStatus person={person} />
                </td>
                <td className="px-1.5 py-4 lg:px-2">
                  <StatusBadge active={person.isActive} />
                </td>
                <td className="px-1.5 py-4 text-right lg:px-2">
                  <StudentActions
                    person={person}
                    onDetails={onDetails}
                    onEdit={onEdit}
                    onAccess={onAccess}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {people.map((person) => (
          <article
            key={person.id}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">
                  {t("admin.dni")}: {person.dni}
                </p>
                <h3 className="mt-1 break-words font-semibold text-sky-950">
                  {person.firstName} {person.lastName}
                </h3>
              </div>
              <StatusBadge active={person.isActive} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <p className="mb-1 text-xs text-slate-500">
                  {t("admin.access")}
                </p>
                <AccessStatus person={person} />
              </div>
              <StudentActions
                person={person}
                onDetails={onDetails}
                onEdit={onEdit}
                onAccess={onAccess}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function StaffTable({
  people,
  onEdit,
}: {
  people: Person[];
  onEdit: (p: Person) => void;
}) {
  return (
    <>
      <div className="hidden w-full md:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-[32%]" />
            <col className="w-[24%]" />
            <col className="w-[14%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="border-b text-slate-500">
            <tr>
              {[
                "admin.name",
                "auth.username",
                "admin.status",
                "admin.registrationDate",
                "admin.actions",
              ].map((key) => (
                <th
                  key={key}
                  className={`px-2 py-3 font-medium ${key === "admin.actions" ? "text-right" : ""}`}
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr
                key={person.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-2 py-4 font-medium">{person.fullName}</td>
                <td className="px-2 py-4">{person.username}</td>
                <td className="px-2 py-4">
                  {t(person.isActive ? "admin.active" : "admin.inactive")}
                </td>
                <td className="px-2 py-4">
                  {new Date(person.createdAt).toLocaleDateString("es-EC")}
                </td>
                <td className="px-2 py-4 text-right">
                  <ActionButton
                    label={t("admin.editPerson")}
                    icon={Pencil}
                    onClick={() => onEdit(person)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {people.map((person) => (
          <article
            key={person.id}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-sky-950">
                  {person.fullName}
                </h3>
                <p className="mt-1 break-all text-sm text-slate-500">
                  {person.username}
                </p>
              </div>
              <StatusBadge active={person.isActive} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-500">
                {new Date(person.createdAt).toLocaleDateString("es-EC")}
              </span>
              <ActionButton
                label={t("admin.editPerson")}
                icon={Pencil}
                onClick={() => onEdit(person)}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export function AdminPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [tab, setTab] = useState<TabRole>("STUDENT");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<
    "create" | "edit" | "details" | "access" | null
  >(null);
  const [selected, setSelected] = useState<Person>();
  const [success, setSuccess] = useState("");
  async function load() {
    try {
      setPeople(await peopleApi.list());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function saved() {
    setModal(null);
    setSelected(undefined);
    setSuccess(t("admin.saved"));
    setLoading(true);
    setError(false);
    void load();
  }
  const current = people.filter((person) => person.role === tab);
  const tabs: TabRole[] = ["STUDENT", "TEACHER", "ADMIN"];
  return (
    <AppLayout
      banner={{
        src: "/images/banner-aristoteles.png",
        alt: t("dashboard.bannerAlt"),
      }}
    >
      <div className="py-5">
        <h1 className="text-3xl font-bold tracking-tight text-sky-950">
          {t("admin.peopleTitle")}
        </h1>
        <p className="mt-2 text-slate-500">{t("admin.subtitle")}</p>
        <div className="my-8 grid gap-4 sm:grid-cols-3">
          {[
            ["admin.students", "STUDENT"],
            ["admin.teachers", "TEACHER"],
            ["admin.administrators", "ADMIN"],
          ].map(([label, role]) => (
            <section
              key={role}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <Users className="mb-4 text-cyan-600" size={23} />
              <p className="text-sm text-slate-500">{t(label)}</p>
              <p className="mt-2 text-3xl font-bold text-sky-950">
                {loading || error
                  ? t("admin.unavailable")
                  : people.filter((p) => p.role === role).length}
              </p>
            </section>
          ))}
        </div>
        <section className="w-full rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-6">
          <div
            role="tablist"
            aria-label={t("admin.peopleTypes")}
            className="mb-6 grid grid-cols-3 border-b"
          >
            {tabs.map((role) => (
              <button
                key={role}
                role="tab"
                aria-selected={tab === role}
                onClick={() => {
                  setTab(role);
                  setSuccess("");
                }}
                className={`min-w-0 break-words border-b-2 px-1 py-3 text-center text-xs font-medium sm:px-4 sm:text-sm ${tab === role ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {t(`admin.tabs.${role}`)}
              </button>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-sky-950">
              {t(`admin.tabs.${tab}`)}
            </h2>
            <button
              className="primary-button w-full sm:w-auto"
              onClick={() => {
                setSelected(undefined);
                setSuccess("");
                setModal("create");
              }}
            >
              <Plus size={18} />
              {t(`admin.createByRole.${tab}`)}
            </button>
          </div>
          {success && (
            <p
              role="status"
              className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-800"
            >
              {success}
            </p>
          )}
          {loading ? (
            <p role="status">{t("admin.loading")}</p>
          ) : error ? (
            <div role="alert">
              <p>{t("admin.loadError")}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  void load();
                }}
                className="mt-3 primary-button"
              >
                {t("dashboard.retry")}
              </button>
            </div>
          ) : (
            <>
              {tab === "STUDENT" ? (
                <StudentTable
                  people={current}
                  onDetails={(p) => {
                    setSelected(p);
                    setModal("details");
                  }}
                  onEdit={(p) => {
                    setSelected(p);
                    setModal("edit");
                  }}
                  onAccess={(p) => {
                    setSelected(p);
                    setModal("access");
                  }}
                />
              ) : (
                <StaffTable
                  people={current}
                  onEdit={(p) => {
                    setSelected(p);
                    setModal("edit");
                  }}
                />
              )}
              {current.length === 0 && (
                <p className="py-6 text-center text-slate-500">
                  {t(`admin.emptyByRole.${tab}`)}
                </p>
              )}
            </>
          )}
        </section>
        {modal === "create" && (
          <Modal
            title={t(`admin.createByRole.${tab}`)}
            onClose={() => setModal(null)}
          >
            {tab === "STUDENT" ? (
              <StudentForm onClose={() => setModal(null)} onSaved={saved} />
            ) : (
              <StaffForm
                role={tab}
                onClose={() => setModal(null)}
                onSaved={saved}
              />
            )}
          </Modal>
        )}
        {modal === "edit" && selected && (
          <Modal title={t("admin.editPerson")} onClose={() => setModal(null)}>
            {selected.role === "STUDENT" ? (
              <StudentForm
                student={selected}
                onClose={() => setModal(null)}
                onSaved={saved}
              />
            ) : (
              <StaffForm
                role={selected.role}
                person={selected}
                onClose={() => setModal(null)}
                onSaved={saved}
              />
            )}
          </Modal>
        )}
        {modal === "details" && selected && (
          <Modal
            title={t("admin.studentDetails")}
            onClose={() => setModal(null)}
          >
            <Details student={selected} />
            <div className="mt-6 flex justify-end">
              <button onClick={() => setModal(null)} className="primary-button">
                {t("admin.closeDetails")}
              </button>
            </div>
          </Modal>
        )}
        {modal === "access" && selected && (
          <Modal
            title={t(
              selected.username
                ? "admin.manageAccess"
                : "admin.createPlatformAccess",
            )}
            onClose={() => setModal(null)}
          >
            <AccessForm
              student={selected}
              onClose={() => setModal(null)}
              onSaved={saved}
            />
          </Modal>
        )}
      </div>
    </AppLayout>
  );
}
