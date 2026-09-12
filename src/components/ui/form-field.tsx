import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-zinc-300 uppercase tracking-wider font-semibold">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl h-10 text-sm transition-all"
      />
    </div>
  );
}

