"use client";

interface ToastProps {
  msg: string;
  type: "success" | "error";
}

export function Toast({ msg, type }: ToastProps) {
  if (!msg) return null;
  return (
    <div className={`fixed top-4 left-4 right-4 z-50 rounded-xl py-3 px-4 text-center text-xs font-semibold shadow-soft-lg animate-[slide-up_0.3s_ease-out] ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`}>
      {msg}
    </div>
  );
}
