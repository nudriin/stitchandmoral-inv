"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Info,
} from "lucide-react";

export type DialogType = "info" | "warning" | "danger" | "success";

export interface AlertOptions {
  title?: string;
  message: string;
  type?: DialogType;
  buttonText?: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState {
  isOpen: boolean;
  isConfirm: boolean;
  title: string;
  message: string;
  type: DialogType;
  confirmText: string;
  cancelText: string;
  resolve: ((val: boolean) => void) | null;
}

interface DialogContextValue {
  showAlert: (options: string | AlertOptions) => Promise<void>;
  showConfirm: (options: string | ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function ModalDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    isConfirm: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "Mengerti",
    cancelText: "Batal",
    resolve: null,
  });

  const showAlert = useCallback((options: string | AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      const isString = typeof options === "string";
      const message = isString ? options : options.message;
      let type = isString ? "info" : options.type || "info";

      // Detect warning / error from message contents
      if (isString) {
        if (options.includes("⚠️") || options.includes("BENTROK") || options.includes("Tidak dapat")) {
          type = "warning";
        } else if (options.includes("Gagal") || options.includes("kesalahan") || options.includes("Error")) {
          type = "danger";
        }
      }

      const defaultTitle =
        type === "warning"
          ? "Perhatian"
          : type === "danger"
          ? "Terjadi Kesalahan"
          : type === "success"
          ? "Berhasil"
          : "Informasi";

      setDialog({
        isOpen: true,
        isConfirm: false,
        title: isString ? defaultTitle : options.title || defaultTitle,
        message,
        type,
        confirmText: !isString && options.buttonText ? options.buttonText : "Mengerti",
        cancelText: "Batal",
        resolve: () => resolve(),
      });
    });
  }, []);

  const showConfirm = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const isString = typeof options === "string";
      const message = isString ? options : options.message;
      let type = isString ? "warning" : options.type || "warning";

      if (isString && (options.toLowerCase().includes("hapus") || options.toLowerCase().includes("batalkan"))) {
        type = "danger";
      }

      const defaultTitle =
        type === "danger"
          ? "Konfirmasi Tindakan"
          : type === "warning"
          ? "Konfirmasi"
          : "Apakah Anda Yakin?";

      setDialog({
        isOpen: true,
        isConfirm: true,
        title: isString ? defaultTitle : options.title || defaultTitle,
        message,
        type,
        confirmText: !isString && options.confirmText ? options.confirmText : "Ya, Lanjutkan",
        cancelText: !isString && options.cancelText ? options.cancelText : "Batal",
        resolve,
      });
    });
  }, []);

  function handleClose(result: boolean) {
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  }

  // Intercept window.alert in browser environment so any legacy alerts automatically open our modal
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      showAlert(String(msg ?? ""));
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && dialog.isOpen) {
        handleClose(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog.isOpen]);

  // Visual styling based on dialog type
  const typeConfig = {
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      badgeBg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300",
      btnConfirm: "bg-amber-600 hover:bg-amber-700 text-white",
    },
    danger: {
      icon: <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      badgeBg: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300",
      btnConfirm: "bg-rose-600 hover:bg-rose-700 text-white",
    },
    success: {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      badgeBg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300",
      btnConfirm: "bg-emerald-600 hover:bg-emerald-700 text-white",
    },
    info: {
      icon: <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      badgeBg: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-300",
      btnConfirm: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950",
    },
  }[dialog.type];

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Theme Modal Dialog */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header: Icon & Close */}
            <div className="flex items-start justify-between gap-3">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${typeConfig.badgeBg}`}
              >
                {typeConfig.icon}
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Body Message */}
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                {dialog.title}
              </h3>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto pr-1">
                {dialog.message}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {dialog.isConfirm && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs sm:text-sm transition cursor-pointer flex-1"
                >
                  {dialog.cancelText}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer ${
                  dialog.isConfirm ? "flex-1" : "w-full"
                } ${typeConfig.btnConfirm}`}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      showAlert: async (opt: string | AlertOptions) => {
        if (typeof window !== "undefined") {
          window.alert(typeof opt === "string" ? opt : opt.message);
        }
      },
      showConfirm: async (opt: string | ConfirmOptions) => {
        if (typeof window !== "undefined") {
          return window.confirm(typeof opt === "string" ? opt : opt.message);
        }
        return false;
      },
    };
  }
  return context;
}
