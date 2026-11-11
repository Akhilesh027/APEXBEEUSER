import { useState, useEffect, useCallback } from 'react';
import { subscriptionToday } from '@/lib/subscriptionPlan';

export function SubscriptionDeliveryCode({ subscriptionId }: { subscriptionId: string }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<string>('pending');
  const [statusLabel, setStatusLabel] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!subscriptionId) return;
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://server.apexbee.in/api'}/local-shop/subscriptions/${encodeURIComponent(subscriptionId)}/tasks`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to load delivery status.');

      const todayStr = subscriptionToday();
      const task = result.tasks?.find((item: any) => item.date === todayStr);

      if (task) {
        setStatus(task.status || 'pending');
        if (task.status === 'delivered') {
          setStatusLabel('✅ Delivered Today');
          setMessage(`Delivered and verified via OTP${task.confirmedAt ? ` on ${new Date(task.confirmedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}.`);
        } else if (task.status === 'started') {
          setStatusLabel('🚚 Out for Delivery Today');
          setMessage('Rider is on the way to your doorstep. Share your code after receiving delivery.');
          if (/^\d{6}$/.test(task.otp || '')) setCode(task.otp);
        } else if (task.status === 'assigned') {
          setStatusLabel('🚴 Rider Assigned for Today');
          setMessage('A delivery rider has been assigned for today\'s slot. Share code upon delivery.');
          if (/^\d{6}$/.test(task.otp || '')) setCode(task.otp);
        } else if (task.status === 'failed') {
          setStatusLabel('❌ Failed to Deliver (Slot Expired)');
          setMessage(task.failedReason || task.notes || 'The scheduled delivery window expired without delivery or time extension.');
        } else if (task.slotExtended) {
          const extTimeStr = task.slotExtendedUntil
            ? new Date(task.slotExtendedUntil).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })
            : '';
          setStatusLabel(`⏳ Delivery Window Extended ${extTimeStr ? `until ${extTimeStr}` : ''}`);
          setMessage(task.slotExtensionReason ? `Vendor Notice: ${task.slotExtensionReason}` : 'Delivery time has been extended by the vendor. Share OTP upon delivery.');
          if (/^\d{6}$/.test(task.otp || '')) setCode(task.otp);
        } else if (task.status === 'pending') {
          setStatusLabel('📦 Scheduled for Today');
          setMessage('Waiting for store dispatch. Your OTP code is ready below.');
          if (/^\d{6}$/.test(task.otp || '')) setCode(task.otp);
        }
      } else {
        setStatus('not_scheduled');
        setStatusLabel('🗓️ No Delivery Scheduled Today');
        setMessage('Deliveries follow your scheduled frequency (e.g. alternate days). Next run scheduled soon.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load today’s delivery status.');
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const isDelivered = status === 'delivered';

  return (
    <section className={`mt-4 rounded-2xl border p-4 space-y-3 transition-all ${isDelivered
        ? 'border-emerald-300 bg-emerald-50/90'
        : status === 'failed'
          ? 'border-rose-300 bg-rose-50/90'
          : status === 'started'
            ? 'border-sky-300 bg-sky-50/90'
            : status === 'assigned'
              ? 'border-indigo-300 bg-indigo-50/90'
              : 'border-amber-300 bg-amber-50/70'
      }`}>
      {/* Header bar with Live Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{isDelivered ? '✅' : status === 'failed' ? '❌' : status === 'started' ? '🚚' : status === 'assigned' ? '🚴' : '📦'}</span>
          <div>
            <p className="font-extrabold text-xs text-navy tracking-tight">Today’s Delivery Status</p>
            {statusLabel && (
              <span className={`text-[11px] font-black uppercase tracking-wider block mt-0.5 ${isDelivered ? 'text-emerald-800' : status === 'failed' ? 'text-rose-800' : status === 'started' ? 'text-sky-800' : 'text-amber-900'
                }`}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-slate-50 shadow-2xs transition-all disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : '↻ Refresh Status'}
        </button>
      </div>

      {/* Code Display (When pending/active, hide if already delivered) */}
      {!isDelivered && code && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-center shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
            Verification OTP for Rider Handover
          </span>
          <p className="font-mono text-2xl sm:text-3xl tracking-[.35em] font-black text-navy mt-1">
            {code}
          </p>
        </div>
      )}

      {/* Status Message Explanation */}
      {message && (
        <p role="status" className={`text-xs font-medium leading-relaxed ${isDelivered ? 'text-emerald-800' : 'text-slate-700'
          }`}>
          {message}
        </p>
      )}

      {!isDelivered && (
        <p className="text-[11px] font-semibold text-amber-800/90 flex items-center gap-1.5">
          <span>🔒</span>
          <span>Share the 6-digit code with your rider only after receiving your package.</span>
        </p>
      )}
    </section>
  );
}
