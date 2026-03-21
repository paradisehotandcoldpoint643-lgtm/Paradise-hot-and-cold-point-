import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function calculatePriceByWeight(basePrice: number, weight: string): number {
  if (weight === '500g') return basePrice / 2;
  const kgMatch = weight.match(/(\d+)kg/);
  if (kgMatch) {
    const kg = parseInt(kgMatch[1]);
    // The user requested: "it will be doubled again and again till the price of 10 kg"
    // This implies 1kg = basePrice, 2kg = 2 * basePrice, 3kg = 4 * basePrice, etc.
    // However, "double in 2kg and 3kg" is ambiguous.
    // Let's implement exponential doubling: basePrice * 2^(kg-1)
    return basePrice * Math.pow(2, kg - 1);
  }
  return basePrice;
}
