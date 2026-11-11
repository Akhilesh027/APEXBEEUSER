export const subscriptionToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function subscriptionTomorrow() { const date = new Date(`${subscriptionToday()}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); }
export function estimateSubscriptionDeliveries(frequency: string, customDays: string[], startDate: string, cycle: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isFinite(start.getTime())) return 0;
  const end = cycle === 'weekly' ? new Date(start.getTime() + 6 * 86400000) : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  let count = 0;
  for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    const offset = (day.getTime() - start.getTime()) / 86400000;
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.getUTCDay()];
    if (frequency === 'daily' || (frequency === 'alternate' && offset % 2 === 0) || (frequency === 'weekly' && offset % 7 === 0) ||
      (frequency === 'monthly' && day.getUTCDate() === start.getUTCDate()) ||
      (frequency === 'custom' && customDays.some(value => value.slice(0, 3).toLowerCase() === weekday.toLowerCase()))) count++;
  }
  return count;
}
