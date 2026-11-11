import { Button } from '@/components/ui/button';
import { ShoppingBasket, ShoppingBag, Flower2, Utensils, Building2, Store, Check, ArrowRight, ArrowLeft } from 'lucide-react';

export type ApplicationCategory = {
  _id: string;
  name: string;
  slug?: string;
  level: number;
  parentId?: string | { _id: string } | null;
  isActive?: boolean;
};

export const categoryParentId = (category: ApplicationCategory) =>
  String(typeof category.parentId === 'object' ? category.parentId?._id || '' : category.parentId || '');

export const vendorApplicationCategories = (categories: ApplicationCategory[]) =>
  categories.filter(category => category.isActive !== false && category.level === 1 &&
    !['services', 'apexbee-academy', 'academy'].includes(category.slug || '') &&
    !['services', 'apexbee academy'].includes(category.name.toLowerCase()));

type Props = {
  step: 'categories' | 'subcategories';
  categories: ApplicationCategory[];
  selectedCategories: string[];
  selectedSubcategories: string[];
  onCategoriesChange: (names: string[]) => void;
  onSubcategoriesChange: (names: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onRetry: () => void;
  loading: boolean;
  error: string;
};

export function VendorCategorySteps(props: Props) {
  const parents = vendorApplicationCategories(props.categories);
  const selectedParents = parents.filter(category => props.selectedCategories.includes(category.name));
  const children = props.categories.filter(category => category.level === 2 && category.isActive !== false);
  const complete = selectedParents.length > 0 && selectedParents.every(parent =>
    children.some(child => categoryParentId(child) === String(parent._id) && props.selectedSubcategories.includes(child.name)));
  const toggle = (items: string[], name: string) => items.includes(name) ? items.filter(item => item !== name) : [...items, name];
  const categoryIcon = (slug?: string) => slug === 'daily-needs' ? ShoppingBasket : slug === 'devotional' ? Flower2 : slug === 'restaurant' ? Utensils : slug === 'shopping' ? ShoppingBag : slug === 'business-hub' ? Building2 : Store;

  return <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6 text-left shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
      <h3 className="text-xl font-bold text-navy">{props.step === 'categories' ? 'Select business categories' : 'Select your subcategories'}</h3>
      <p className="text-sm text-slate-600 mt-2">{props.step === 'categories'
        ? 'Choose all categories your business operates in. You can select more than one.'
        : 'Choose at least one subcategory under each selected category.'}</p>
      </div>
      <span className="rounded-full bg-amber-50 text-navy border border-amber-200 px-3 py-1.5 text-xs font-semibold">{props.step === 'categories' ? props.selectedCategories.length : props.selectedSubcategories.length} selected</span>
    </div>
    {props.loading ? <p role="status">Loading available categories…</p> : props.error || !parents.length ?
      <div role="alert" className="space-y-3"><p>{props.error || 'Categories are not available yet. Please try again.'}</p><Button variant="outline" onClick={props.onRetry}>Try again</Button></div> :
      props.step === 'categories' ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {parents.map(category => <button key={category._id} type="button" aria-pressed={props.selectedCategories.includes(category.name)}
          onClick={() => {
            const next = toggle(props.selectedCategories, category.name);
            props.onCategoriesChange(next);
            const parentIds = new Set(parents.filter(parent => next.includes(parent.name)).map(parent => String(parent._id)));
            props.onSubcategoriesChange(props.selectedSubcategories.filter(name => children.some(child => child.name === name && parentIds.has(categoryParentId(child)))));
          }}
          className={`group rounded-2xl border p-5 text-left font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${props.selectedCategories.includes(category.name) ? 'border-amber-400 bg-amber-50/70 text-navy shadow-sm' : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50'}`}>
          <span className="flex justify-between items-center mb-4"><span className={`rounded-xl p-2.5 ${props.selectedCategories.includes(category.name) ? 'bg-amber-200/60' : 'bg-slate-100 text-slate-500'}`}>{(() => { const Icon = categoryIcon(category.slug); return <Icon size={22} />; })()}</span><span className={`h-6 w-6 rounded-full border grid place-items-center ${props.selectedCategories.includes(category.name) ? 'bg-navy border-navy text-white' : 'border-slate-300 bg-white'}`}>{props.selectedCategories.includes(category.name) && <Check size={13} />}</span></span>
          <span className="text-sm">{category.name}</span><span className="block text-xs font-normal text-slate-500 mt-1">{props.selectedCategories.includes(category.name) ? 'Added to your application' : 'Select this business category'}</span>
        </button>)}
      </div> : <div className="space-y-6">{selectedParents.map(parent => {
        const options = children.filter(child => categoryParentId(child) === String(parent._id));
        return <fieldset key={parent._id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"><legend className="font-bold text-navy px-2 text-sm">{parent.name}</legend>
          {parent.slug === 'restaurant' && <p className="text-xs text-slate-600">Food & Dining uses a separate food partner portal. Food portal updates will follow later.</p>}
          {!options.length && <p role="alert" className="text-sm text-amber-800">No subcategories are available for this category. Go back to change your selection or contact support.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">{options.map(child => <label key={child._id} className={`flex items-center gap-3 rounded-xl border p-4 text-sm cursor-pointer transition-colors ${props.selectedSubcategories.includes(child.name) ? 'bg-amber-50 border-amber-300 text-navy font-semibold' : 'bg-white border-slate-200 hover:border-slate-400'}`}>
            <input type="checkbox" className="mt-1 accent-amber-600" checked={props.selectedSubcategories.includes(child.name)}
              onChange={() => props.onSubcategoriesChange(toggle(props.selectedSubcategories, child.name))} />
            <span>{child.name}</span>
          </label>)}</div>
        </fieldset>;
      })}</div>}
    <div className="application-footer flex justify-between gap-3">
      <Button variant="outline" className="rounded-xl h-11 px-5" onClick={props.onBack}><ArrowLeft size={15} className="mr-2" />Back</Button>
      <Button className="bg-navy hover:bg-navy/90 text-white rounded-xl h-11 px-6" disabled={props.loading || !!props.error || (props.step === 'categories' ? !selectedParents.length : !complete)} onClick={props.onNext}>Next<ArrowRight size={15} className="ml-2" /></Button>
    </div>
  </section>;
}
