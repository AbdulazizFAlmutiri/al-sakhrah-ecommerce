import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-royal-600 text-white hover:bg-royal-700 disabled:bg-mist-300",
  secondary: "bg-white text-navy-700 border border-mist-300 hover:border-royal-600 disabled:text-mist-300",
  danger: "bg-bad-600 text-white hover:brightness-95 disabled:bg-mist-300",
  ghost: "bg-transparent text-navy-700 hover:bg-royal-50",
};
const SIZES: Record<Size, string> = { md: "h-10 px-4 text-sm", lg: "h-14 px-6 text-lg" };

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
