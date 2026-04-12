"use client";

import { ModalFrame } from "./ModalFrame";

type ModalConfirmProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

export function ModalConfirm({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ModalConfirmProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalFrame
      isOpen={isOpen}
      title={title}
      description={message}
      maxWidthClass="max-w-md"
      bodyClassName="px-6 py-2"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-[#2a2f38] px-4 py-1 text-sm font-medium text-[#e5e7eb] transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-[#f97316] px-4 py-1 text-sm font-semibold text-[#0f1115] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Procesando..." : confirmLabel}
          </button>
        </div>
      }
    >
      <span className="sr-only">Confirm action body</span>
    </ModalFrame>
  );
}
