"use client";

import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-xs">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
}
