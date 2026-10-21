export function calculateDiscount(base: number, rawPercentage: string) {
  const baseCents = Math.round(base * 100);
  const percentage = Number(rawPercentage || "0");
  const discountCents = Math.round((baseCents * percentage) / 100);
  return {
    percentage,
    discountCents,
    finalCents: baseCents - discountCents,
    valid: Number.isFinite(percentage) && percentage >= 0 && percentage <= 100,
  };
}
