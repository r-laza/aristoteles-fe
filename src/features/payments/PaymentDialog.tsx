import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { t } from "../../lib/i18n";
export function PaymentDialog({
  title,
  busy = false,
  onClose,
  children,
}: {
  title: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="payment-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-xl rounded-2xl p-6 text-slate-800 shadow-xl backdrop:bg-slate-950/50"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 id="payment-title" className="text-xl font-bold text-sky-950">
          {title}
        </h2>
        <button
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
