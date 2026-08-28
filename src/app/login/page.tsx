"use client";

import { useState, useRef, useEffect } from "react";
import { login, loginWithPin } from "./actions";
import { Lock, Mail, Sparkles, Loader2, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<"pin" | "password">("pin");
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first PIN input on mount or mode switch
  useEffect(() => {
    if (loginMode === "pin") {
      setPin(["", "", "", "", "", ""]);
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [loginMode]);

  // Handle individual PIN input change
  function handlePinChange(index: number, value: string) {
    if (loading) return;

    // Handle paste of 6 digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (digits.length > 0) {
        const nextPin = ["", "", "", "", "", ""];
        digits.forEach((d, i) => {
          if (i < 6) nextPin[i] = d;
        });
        setPin(nextPin);
        if (digits.length === 6) {
          triggerPinLogin(nextPin.join(""));
        } else {
          inputRefs.current[Math.min(digits.length, 5)]?.focus();
        }
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when 6 digits are complete
    if (digit && index === 5 && nextPin.every((d) => d !== "")) {
      triggerPinLogin(nextPin.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function triggerPinLogin(fullPin: string) {
    setError(null);
    setLoading(true);

    const result = await loginWithPin(fullPin);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      setPin(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const isPinComplete = pin.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 selection:bg-zinc-800">
      {/* Background glowing effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-zinc-800/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-zinc-700/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">
            Stitch and Moral
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Sistem Manajemen Sewa Jas & Inventori PKY
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setLoginMode("pin")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              loginMode === "pin"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN 6 Digit</span>
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("password")}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              loginMode === "password"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-medium text-center animate-shake">
            {error}
          </div>
        )}

        {/* PIN LOGIN MODE */}
        {loginMode === "pin" && (
          <div className="space-y-6">
            <div className="text-center py-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-4">
                Ketik 6 Digit PIN Akses Anda
              </label>

              {/* 6 Digit Input Boxes */}
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {pin.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handlePinChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold bg-zinc-950 border rounded-2xl outline-none transition font-mono ${
                      digit
                        ? "border-zinc-300 bg-zinc-900 text-zinc-100 ring-1 ring-zinc-400"
                        : "border-zinc-800 text-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
                    } disabled:opacity-50`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => isPinComplete && triggerPinLogin(pin.join(""))}
              disabled={loading || !isPinComplete}
              className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi PIN...</span>
                </>
              ) : (
                <span>Masuk dengan PIN</span>
              )}
            </button>
          </div>
        )}

        {/* EMAIL & PASSWORD LOGIN MODE */}
        {loginMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@stitchandmoral.com"
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/60 border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <span>Masuk ke Sistem</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-500">
            Akses khusus staf dan admin Stitch and Moral PKY
          </p>
        </div>
      </div>
    </div>
  );
}

