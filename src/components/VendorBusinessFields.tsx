import { useState } from 'react';
import { Clock3, ImagePlus, CheckCircle2 } from 'lucide-react';

export const emptyVendorBusiness = {
  logoUrl: '', shopPhotos: [] as string[], openingTime: '09:00', closingTime: '21:00',
  serviceRadiusKm: '5', acceptsOrders: true, fssaiNumber: '',
};
export type VendorBusinessFieldsValue = typeof emptyVendorBusiness;

export function vendorBusinessError(value: VendorBusinessFieldsValue) {
  if (!value.openingTime || !value.closingTime) return 'Enter opening and closing times.';
  if (!Number.isFinite(Number(value.serviceRadiusKm)) || Number(value.serviceRadiusKm) <= 0 || Number(value.serviceRadiusKm) > 1000) return 'Enter a service radius greater than zero and no more than 1000 km.';
  return '';
}

export function VendorBusinessFields({ value, onChange, apiBase, onUploadingChange }: { value: VendorBusinessFieldsValue; onChange: (value: VendorBusinessFieldsValue) => void; apiBase: string; onUploadingChange: (value: boolean) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const set = (key: keyof VendorBusinessFieldsValue, next: string | boolean) => onChange({ ...value, [key]: next });
  async function upload(files: FileList | null, logo: boolean) {
    if (!files?.length) return;
    const list = Array.from(files);
    if (list.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError('Choose JPG, PNG, or WebP images up to 5 MB each.'); return; }
    if (!logo && value.shopPhotos.length + list.length > 6) { setError('You can add up to six shop photos.'); return; }
    setUploading(true); onUploadingChange(true); setError('');
    try {
      const urls: string[] = [];
      for (const file of list) {
        const form = new FormData(); form.append('file', file);
        const response = await fetch(`${apiBase}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: form });
        const data = await response.json();
        if (!response.ok || !data.url) throw new Error(data.message || 'Image upload failed.');
        urls.push(data.url);
      }
      onChange({ ...value, ...(logo ? { logoUrl: urls[0] } : { shopPhotos: [...value.shopPhotos, ...urls] }) });
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to upload images.'); }
    finally { setUploading(false); onUploadingChange(false); }
  }
  const field = (key: keyof VendorBusinessFieldsValue, label: string, type = 'text') => <label className="block text-sm" key={key}>{label}<input type={type} value={String(value[key])} onChange={event => set(key, event.target.value)} className="block w-full border rounded-lg p-2 mt-1 bg-white" disabled={uploading} /></label>;
  return <fieldset disabled={uploading} className="space-y-5 text-left">
    <legend className="sr-only">Business operations</legend>
    <section className="application-section space-y-4">
    <h4 className="flex items-center gap-2 text-sm font-bold text-navy"><Clock3 size={18} className="text-amber-600" />Hours & service area</h4>
    <p className="text-xs text-slate-500">Let customers know when you operate and how far you deliver.</p>
    <div className="grid sm:grid-cols-2 gap-4">{field('openingTime', 'Opening time *', 'time')}{field('closingTime', 'Closing time *', 'time')}{field('serviceRadiusKm', 'Service radius in kilometres *', 'number')}{field('fssaiNumber', 'FSSAI number (optional)')}</div>
    <label className="flex items-center gap-3 text-sm rounded-xl bg-slate-50 p-3"><input type="checkbox" checked={value.acceptsOrders} onChange={event => set('acceptsOrders', event.target.checked)} />Accept orders after activation</label>
    </section>
    <section className="application-section space-y-4">
    <h4 className="flex items-center gap-2 text-sm font-bold text-navy"><ImagePlus size={18} className="text-amber-600" />Business photos <span className="ml-auto text-xs font-normal text-slate-400">Optional</span></h4>
    <p className="text-xs text-slate-500">JPG, PNG or WebP, up to 5 MB each. Add up to six shop or farm photos.</p>
    <div className="grid sm:grid-cols-2 gap-4">
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3 min-w-0">
    <label className="block text-sm">Business logo if available<input className="block mt-2 text-xs" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => upload(event.target.files, true)} /></label>
    {value.logoUrl && <p className="text-xs text-emerald-700 flex items-center gap-1"><CheckCircle2 size={14} />Logo uploaded <button type="button" onClick={() => onChange({ ...value, logoUrl: '' })} className="underline ml-2">Remove</button></p>}
    </div><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 space-y-3 min-w-0">
    <label className="block text-sm">Shop or farm photos if available<input className="block mt-2 text-xs" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => upload(event.target.files, false)} /></label>
    {!!value.shopPhotos.length && <div className="flex flex-wrap gap-2">{value.shopPhotos.map((url, index) => <button type="button" className="text-xs underline" key={`${url}-${index}`} onClick={() => onChange({ ...value, shopPhotos: value.shopPhotos.filter((_, item) => item !== index) })}>Remove photo {index + 1}</button>)}</div>}
    </div></div></section>
    {uploading && <p role="status" className="text-sm">Uploading images. Please wait before continuing.</p>}{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
  </fieldset>;
}
