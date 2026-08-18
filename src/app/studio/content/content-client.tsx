"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { savePageContent } from "@/lib/actions/page-content";
import type { Block, ManifestoContent, CareContent } from "@/lib/page-content";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "font-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

function BlockList({
  label,
  blocks,
  onChange,
}: {
  label: string;
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  const update = (i: number, patch: Partial<Block>) =>
    onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...blocks, { title: "", body: "" }]);

  return (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="mt-3 space-y-4">
        {blocks.map((b, i) => (
          <div key={i} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                value={b.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="Block title"
              />
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(i)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <textarea
                className={`${inputCls} min-h-28 resize-y font-mono text-xs`}
                value={b.body}
                onChange={(e) => update(i, { body: e.target.value })}
                placeholder="Body — markdown supported. Bengali + English can be mixed freely."
              />
              <div className="rounded-lg border border-dashed border-border p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Preview</p>
                <div className="prose-editorial mt-1.5 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground">
        <Plus className="h-3.5 w-3.5" /> Add block
      </button>
    </div>
  );
}

export function ContentEditor({
  manifesto,
  care,
}: {
  manifesto: ManifestoContent;
  care: CareContent;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"manifesto" | "care">("manifesto");
  const [m, setM] = useState<ManifestoContent>(manifesto);
  const [c, setC] = useState<CareContent>(care);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = tab === "manifesto"
        ? await savePageContent("manifesto", m)
        : await savePageContent("care", c);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${tab === "manifesto" ? "Manifesto" : "Care guide"} saved`);
      router.refresh();
    });

  return (
    <div>
      <div className="flex gap-2">
        {(["manifesto", "care"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.14em] transition-colors ${
              tab === t ? "border border-foreground bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {t === "manifesto" ? "Manifesto" : "Care guide"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {tab === "manifesto" ? (
          <>
            <BlockList label="Story parts (numbered I, II, III…)" blocks={m.storyParts} onChange={(storyParts) => setM({ ...m, storyParts })} />
            <BlockList label="Values (icon cards)" blocks={m.values} onChange={(values) => setM({ ...m, values })} />
          </>
        ) : (
          <BlockList label="Care sections (icon cards)" blocks={c.sections} onChange={(sections) => setC({ ...c, sections })} />
        )}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="mt-8 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-40"
      >
        {pending ? "Saving…" : `Save ${tab === "manifesto" ? "manifesto" : "care guide"}`}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        The page&rsquo;s hero, pull-quote, and layout stay fixed; these blocks are the editable copy. Edits appear on the live site within a minute.
      </p>
    </div>
  );
}
