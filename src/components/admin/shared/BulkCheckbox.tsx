"use client";

interface BulkCheckboxProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

/** CHECKBOX موحّد لاختيار صفوف الجداول بشكل RTL. */
export function BulkCheckbox({ checked, onChange, label, disabled = false }: BulkCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
      style={{ accentColor: "var(--color-primary)" }}
    />
  );
}
