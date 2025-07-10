import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, type: "expense" | "deposit"): string {
  const formattedAmount = amount.toFixed(2);
  if (type === "expense") {
    return `- ${formattedAmount} €`;
  } else {
    return `+ ${formattedAmount} €`;
  }
}
