"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import { savePageContent } from "@/lib/actions/page-content";
import type { Block, StoryBlock, ManifestoContent, ManifestoHero, CareContent, HomeContent, ShopContent, ContactContent } from "@/lib/page-content";
import { HeroImagesEditor } from "@/components/studio/HeroImagesEditor";
import { HeroOverlayEditor } from "@/components/studio/HeroOverlayEditor";
import { overlayStyle } from "@/lib/hero";
import { UploadHint } from "@/components/studio/UploadHint";
import { uploadToCloudinary } from "@/lib/cloudinary";

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const labelCls = "font-display text-[11px] uppercase tracking-[0.06em] text-muted-foreground";

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
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Preview</p>
                <div className="prose-editorial mt-1.5 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground">
        <Plus className="h-3.5 w-3.5" /> Add block
      </button>
    </div>
  );
}

// Like BlockList, but each story part also has a paired image (Cloudinary
// upload) shown in the scroll-driven editorial on the manifesto page.
function StoryBlockList({
  label,
  blocks,
  onChange,
}: {
  label: string;
  blocks: StoryBlock[];
  onChange: (next: StoryBlock[]) => void;
}) {
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);
  const update = (i: number, patch: Partial<StoryBlock>) =>
    onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...blocks, { title: "", body: "", image: "" }]);

  const onUpload = async (i: number, file: File) => {
    setUploadingAt(i);
    try {
      const url = await uploadToCloudinary(file);
      update(i, { image: url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAt(null);
    }
  };

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
                <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground">Preview</p>
                <div className="prose-editorial mt-1.5 text-sm leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{ __html: renderMarkdown(b.body) }} />
              </div>
            </div>
            {/* Paired image — sticks/transitions beside this section as it scrolls */}
            <UploadHint spec="manifestoStory" className="mt-3" />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.image} alt="" className="h-16 w-14 shrink-0 rounded object-cover ring-1 ring-border" />
              ) : (
                <div className="grid h-16 w-14 shrink-0 place-items-center rounded bg-muted text-[9px] uppercase tracking-wide text-muted-foreground">No image</div>
              )}
              <label className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm hover:border-primary">
                {uploadingAt === i ? "Uploading…" : b.image ? "Replace image" : "Upload paired image"}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingAt === i} onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(i, f); }} />
              </label>
              {b.image && (
                <button type="button" onClick={() => update(i, { image: "" })} className="text-sm text-muted-foreground hover:text-foreground">Remove image</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-3 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.05em] text-muted-foreground hover:text-foreground">
        <Plus className="h-3.5 w-3.5" /> Add block
      </button>
    </div>
  );
}

function HeroEditor({ hero, onChange }: { hero: ManifestoHero; onChange: (h: ManifestoHero) => void }) {
  const set = <K extends keyof ManifestoHero>(k: K, v: ManifestoHero[K]) => onChange({ ...hero, [k]: v });
  const light = hero.textTheme === "light";
  const bg = hero.images.desktop;
  const manifestoOverlay = overlayStyle(hero.overlay);

  return (
    <div className="rounded-xl border border-border p-5">
      <p className={labelCls}>Hero</p>

      {/* Live preview (desktop image) */}
      <div
        className={`mt-3 overflow-hidden rounded-lg ${!bg ? (light ? "bg-foreground" : "bg-background border border-border") : ""} relative`}
        style={bg ? { backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {bg && manifestoOverlay && <div className="absolute inset-0" style={manifestoOverlay} />}
        <div className={`relative px-5 py-10 ${light ? "text-background" : "text-foreground"}`}>
          {hero.eyebrow && <p className="text-[10px] uppercase tracking-[0.08em] opacity-70">{hero.eyebrow}</p>}
          <p className="mt-2 whitespace-pre-line font-editorial text-2xl leading-tight">{hero.heading || "Heading"}</p>
          {hero.subcopy && <p className="mt-2 text-sm opacity-80">{hero.subcopy}</p>}
        </div>
      </div>

      {/* 3-breakpoint background images */}
      <div className="mt-4">
        <HeroImagesEditor value={hero.images} onChange={(images) => set("images", images)} />
      </div>

      {/* Overlay */}
      <div className="mt-4">
        <HeroOverlayEditor value={hero.overlay} onChange={(overlay) => set("overlay", overlay)} previewImage={bg || undefined} />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input className={`${inputCls} mt-1`} value={hero.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Heading <span className="normal-case tracking-normal">(line breaks allowed)</span></label>
          <textarea className={`${inputCls} mt-1 resize-y`} rows={2} value={hero.heading} onChange={(e) => set("heading", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Subcopy (optional)</label>
          <textarea className={`${inputCls} mt-1 resize-y`} rows={2} value={hero.subcopy} onChange={(e) => set("subcopy", e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Text colour</label>
          <div className="mt-1 flex gap-2">
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set("textTheme", t)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize ${hero.textTheme === t ? "bg-foreground text-background" : "border border-border"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentEditor({
  manifesto,
  care,
  home,
  drop,
  shop,
  contact,
}: {
  manifesto: ManifestoContent;
  care: CareContent;
  home: HomeContent;
  drop: HomeContent;
  shop: ShopContent;
  contact: ContactContent;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "drop" | "shop" | "manifesto" | "care" | "contact">("home");
  const [m, setM] = useState<ManifestoContent>(manifesto);
  const [c, setC] = useState<CareContent>(care);
  const [h, setH] = useState<HomeContent>(home);
  const [dr, setDr] = useState<HomeContent>(drop);
  const [sh, setSh] = useState<ShopContent>(shop);
  const [ct, setCt] = useState<ContactContent>(contact);
  const [pending, startTransition] = useTransition();

  const tabLabel = (t: typeof tab) =>
    ({ home: "Home", drop: "Drop", shop: "Shop", manifesto: "Manifesto", care: "Care guide", contact: "Contact" })[t];

  const save = () =>
    startTransition(async () => {
      const res =
        tab === "manifesto" ? await savePageContent("manifesto", m)
        : tab === "care" ? await savePageContent("care", c)
        : tab === "drop" ? await savePageContent("drop", dr)
        : tab === "shop" ? await savePageContent("shop", sh)
        : tab === "contact" ? await savePageContent("contact", ct)
        : await savePageContent("home", h);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${tabLabel(tab)} saved`);
      router.refresh();
    });

  const homeBody = h.body ?? {
    featuredHeading: "", featuredSubcopy: "", storyQuote: "",
    trust: ["", "", ""], menu: ["", "", ""], scrapbookHeading: "", scrapbookSubcopy: "",
  };
  const setBody = (patch: Partial<NonNullable<HomeContent["body"]>>) =>
    setH({ ...h, body: { ...homeBody, ...patch } });

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["home", "drop", "shop", "manifesto", "care", "contact"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-[0.05em] transition-colors ${
              tab === t ? "border border-foreground bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-8">
        {tab === "home" ? (
          <>
            <HeroPageEditor value={h} onChange={setH} note="The big image behind the homepage headline. The buttons stay fixed." />
            <div className="space-y-4 rounded-xl border border-border p-5">
              <p className={labelCls}>Home page copy</p>
              <TextRow label="Featured heading" value={homeBody.featuredHeading} onChange={(v) => setBody({ featuredHeading: v })} />
              <TextRow label="Featured subcopy" value={homeBody.featuredSubcopy} onChange={(v) => setBody({ featuredSubcopy: v })} />
              <TextRow label="Story quote" value={homeBody.storyQuote} onChange={(v) => setBody({ storyQuote: v })} />
              <div className="grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <TextRow key={i} label={`Trust line ${i + 1}`} value={homeBody.trust[i] ?? ""} onChange={(v) => { const t = [...homeBody.trust]; t[i] = v; setBody({ trust: t }); }} />
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <TextRow key={i} label={`Menu label ${i + 1}`} value={homeBody.menu[i] ?? ""} onChange={(v) => { const t = [...homeBody.menu]; t[i] = v; setBody({ menu: t }); }} />
                ))}
              </div>
              <TextRow label="Scrapbook heading" value={homeBody.scrapbookHeading} onChange={(v) => setBody({ scrapbookHeading: v })} />
              <TextRow label="Scrapbook subcopy" value={homeBody.scrapbookSubcopy} onChange={(v) => setBody({ scrapbookSubcopy: v })} />
            </div>
          </>
        ) : tab === "shop" ? (
          <div className="space-y-4 rounded-xl border border-border p-5">
            <p className={labelCls}>Shop page copy</p>
            <TextRow label="Heading" value={sh.heading} onChange={(v) => setSh({ ...sh, heading: v })} />
            <TextRow label="Subcopy" value={sh.subcopy} onChange={(v) => setSh({ ...sh, subcopy: v })} />
          </div>
        ) : tab === "contact" ? (
          <div className="space-y-4 rounded-xl border border-border p-5">
            <p className={labelCls}>Contact page copy</p>
            <TextRow label="Heading" value={ct.heading} onChange={(v) => setCt({ ...ct, heading: v })} />
            <TextRow label="Subcopy" value={ct.subcopy} onChange={(v) => setCt({ ...ct, subcopy: v })} />
            <TextRow label="Support email" value={ct.email} onChange={(v) => setCt({ ...ct, email: v })} />
            <TextRow label="Studio location" value={ct.studioLocation} onChange={(v) => setCt({ ...ct, studioLocation: v })} />
            <TextRow label="Studio note" value={ct.studioNote} onChange={(v) => setCt({ ...ct, studioNote: v })} />
            <TextRow label="Instagram handle" value={ct.instagram} onChange={(v) => setCt({ ...ct, instagram: v })} />
          </div>
        ) : tab === "drop" ? (
          <HeroPageEditor value={dr} onChange={setDr} note="The hero at the top of the Drop page (above the countdown). Per-product drop dates are set on each product." />
        ) : tab === "manifesto" ? (
          <>
            <HeroEditor hero={m.hero} onChange={(hero) => setM({ ...m, hero })} />
            <StoryBlockList label="Story parts (numbered I, II, III… — each with a paired image)" blocks={m.storyParts} onChange={(storyParts) => setM({ ...m, storyParts })} />
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
        className="mt-8 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.08em] text-white disabled:opacity-40"
      >
        {pending ? "Saving…" : `Save ${tabLabel(tab).toLowerCase()}`}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        Page layout and copy chrome stay fixed; these are the editable pieces. Edits appear on the live site within a minute.
      </p>
    </div>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-16 rounded border border-border bg-transparent px-1 py-0.5 text-center text-[11px]" />
    </div>
  );
}

// Shared editor for a page hero (home + drop): image, overlay, heading/subcopy + colours.
function HeroPageEditor({ value, onChange, note }: { value: HomeContent; onChange: (v: HomeContent) => void; note: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-5">
        <p className={labelCls}>Hero background</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        <div className="mt-4">
          <HeroImagesEditor value={value.hero} onChange={(hero) => onChange({ ...value, hero })} />
        </div>
      </div>
      <HeroOverlayEditor value={value.overlay} onChange={(overlay) => onChange({ ...value, overlay })} previewImage={value.hero.desktop || undefined} />
      <div className="space-y-4 rounded-xl border border-border p-5">
        <p className={labelCls}>Hero text</p>
        <div>
          <label className={labelCls}>Heading <span className="normal-case tracking-normal">(line breaks allowed)</span></label>
          <div className="mt-1 flex items-start gap-3">
            <textarea className={`${inputCls} resize-y`} rows={2} value={value.heading} onChange={(e) => onChange({ ...value, heading: e.target.value })} />
            <ColorField value={value.headingColor} onChange={(headingColor) => onChange({ ...value, headingColor })} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Subcopy (optional)</label>
          <div className="mt-1 flex items-start gap-3">
            <input className={inputCls} value={value.subcopy} onChange={(e) => onChange({ ...value, subcopy: e.target.value })} />
            <ColorField value={value.subcopyColor} onChange={(subcopyColor) => onChange({ ...value, subcopyColor })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TextRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <input className={`${inputCls} mt-1`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
