import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { t } from "../lib/i18n";
export function PasswordInput({
  id = "password",
  newPassword = false,
}: {
  id?: string;
  newPassword?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        required
        maxLength={256}
        autoComplete={newPassword ? "new-password" : "current-password"}
        className="field pr-12"
      />
      <button
        type="button"
        aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")}
        aria-pressed={visible}
        onClick={() => setVisible(!visible)}
        className="absolute inset-y-0 right-0 px-3 text-slate-500"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}
