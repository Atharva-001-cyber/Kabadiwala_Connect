/**
 * Formatting utilities for Kabadiwala Connect
 */

/**
 * Formats a weight or decimal number cleanly:
 * - Eliminates floating point precision artifacts (e.g. 2690.6000000000004 -> 2,690.6)
 * - Adds standard thousands separator (e.g. 1000 -> 1,000)
 * - Omits unnecessary trailing zeroes (e.g. 40 -> 40, 40.5 -> 40.5)
 * - Retains genuine decimal precision up to 2 decimal places
 */
export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '0';
  }
  if (weight === 0) {
    return '0';
  }

  // Round to at most 2 decimal places to eliminate floating point artifacts
  const rounded = Math.round(weight * 100) / 100;

  // If whole integer (e.g. 40, 1000)
  if (rounded % 1 === 0) {
    return rounded.toLocaleString('en-IN');
  }

  // Check if 1 decimal place is sufficient (e.g. 40.5, 2690.6)
  const rounded1 = Math.round(weight * 10) / 10;
  if (Math.abs(rounded - rounded1) < 0.001) {
    const parts = rounded1.toFixed(1).split('.');
    return `${Number(parts[0]).toLocaleString('en-IN')}.${parts[1]}`;
  }

  // 2 decimal places (e.g. 25.75)
  const parts = rounded.toFixed(2).split('.');
  return `${Number(parts[0]).toLocaleString('en-IN')}.${parts[1]}`;
}

/**
 * Formats currency amounts with standard Indian locale formatting
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
