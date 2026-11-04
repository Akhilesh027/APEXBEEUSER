import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ScrollableTabsBar({ children, activeValue }: { children: ReactNode; activeValue: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflow: false, left: false, right: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      const availableWidth = viewport.parentElement?.clientWidth ?? viewport.clientWidth;
      setEdges({ overflow: viewport.scrollWidth > availableWidth + 1, left: viewport.scrollLeft > 1, right: viewport.scrollLeft < maxScroll - 1 });
    };
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      viewport.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const selected = viewport?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!viewport || !selected) return;
    const bounds = viewport.getBoundingClientRect();
    const tab = selected.getBoundingClientRect();
    const delta = tab.left < bounds.left ? tab.left - bounds.left : tab.right > bounds.right ? tab.right - bounds.right : 0;
    if (delta) viewport.scrollBy({ left: delta, behavior: "smooth" });
  }, [activeValue]);

  const scroll = (direction: number) => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollBy({ left: direction * Math.max(160, viewport.clientWidth * 0.75), behavior: "smooth" });
  };

  return (
    <div className="flex w-full min-w-0 items-center gap-1.5 pb-1">
      {edges.overflow && (
        <button type="button" aria-label="Scroll referral tabs left" disabled={!edges.left} onClick={() => scroll(-1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy shadow-sm hover:bg-slate-100 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      <div ref={viewportRef} className="min-w-0 flex-1 overflow-x-auto scrollbar-none" onFocusCapture={(event) => {
        const target = event.target as HTMLElement;
        if (target.getAttribute("role") === "tab") target.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}>
        {children}
      </div>
      {edges.overflow && (
        <button type="button" aria-label="Scroll referral tabs right" disabled={!edges.right} onClick={() => scroll(1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-navy shadow-sm hover:bg-slate-100 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
