const depositCurrency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export type WaterProductDetails = { volumeLitres: number; returnable: boolean; depositAmount: number };

export function WaterProductNote({ details }: { details?: WaterProductDetails | null }) {
  if (!details || details.volumeLitres <= 0) return null;
  return <p className="rounded-lg bg-sky-50 p-2 text-xs leading-relaxed text-sky-950">
    {details.volumeLitres} L per {details.returnable ? 'returnable can' : 'bottle'}.
    {details.returnable && details.depositAmount > 0 && ` The vendor handles the ${depositCurrency.format(details.depositAmount)} refundable deposit per can separately from the refill price.`}
  </p>;
}
