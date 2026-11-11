import { Check, Store } from 'lucide-react';

export function VendorApplicationHeader({ step }: { step: number }) {
  const steps = ['Categories', 'Subcategories', 'Business details', 'Review'];
  return <header className="space-y-6">
    <div className="flex gap-4 items-center">
      <div className="rounded-2xl bg-navy p-3.5 text-amber-400 shadow-sm"><Store size={26} /></div>
      <div><p className="text-[10px] uppercase tracking-[.2em] font-bold text-slate-500 mb-1">ApexBee business partners</p><h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">Apply as a Vendor</h2><p className="text-sm text-slate-500 mt-1">Tell us about your business. We’ll guide you through each step.</p></div>
    </div>
    <ol aria-label="Application progress" className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      {steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? 'step' : undefined} className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-xs font-semibold ${step === index + 1 ? 'bg-navy text-white' : step > index + 1 ? 'text-navy bg-amber-50' : 'text-slate-400'}`}>
        <span className={`h-6 w-6 shrink-0 rounded-full grid place-items-center text-[11px] ${step === index + 1 ? 'bg-amber-400 text-navy' : step > index + 1 ? 'bg-amber-200 text-navy' : 'bg-slate-100'}`}>{step > index + 1 ? <Check size={13} /> : index + 1}</span>{label}
      </li>)}
    </ol>
  </header>;
}
