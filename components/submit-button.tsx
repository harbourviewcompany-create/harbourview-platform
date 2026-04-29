"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button type="submit" className={`hv-btn ${className}`.trim()} disabled={isDisabled}>
      {pending ? "Working..." : children}
    </button>
  );
}
