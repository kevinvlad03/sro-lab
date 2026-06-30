"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileBox,
  Link as LinkIcon,
  Sliders,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { submitJob } from "@/lib/jobs-actions";
import { createClient } from "@/lib/supabase/client";
import { fadeUp, stagger, transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type SourceMode = "file" | "link";
type SettingsMode = "creator" | "custom";

const sourceTabs: { id: SourceMode; label: string; icon: typeof FileBox }[] = [
  { id: "file", label: "Upload file", icon: FileBox },
  { id: "link", label: "Paste link", icon: LinkIcon },
];

const settingsTabs: {
  id: SettingsMode;
  label: string;
  icon: typeof Sparkles;
  blurb: string;
}[] = [
  {
    id: "creator",
    label: "Creator's preset",
    icon: Sparkles,
    blurb: "Use whatever the file or the link suggests. Easiest.",
  },
  {
    id: "custom",
    label: "Custom",
    icon: Sliders,
    blurb: "Tune slicer parameters yourself.",
  },
];

const materials = ["PLA", "PETG", "ABS", "TPU", "Any"] as const;

const ALLOWED_EXT = ["stl", "3mf", "obj", "step", "stp"];
const MAX_BYTES = 100 * 1024 * 1024;

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SubmitForm() {
  const [mode, setMode] = useState<SourceMode>("file");
  const [settingsMode, setSettingsMode] = useState<SettingsMode>("creator");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [infill, setInfill] = useState(20);
  const [visibility, setVisibility] = useState<"team" | "private">("team");

  const [pending, setPending] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setFile(f);
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      if (f) dt.items.add(f);
      fileInputRef.current.files = dt.files;
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    // Capture the form element synchronously. After any await below,
    // React nullifies e.currentTarget, which would make `new
    // FormData(e.currentTarget)` throw "Failed to construct FormData:
    // parameter 1 is not of type HTMLFormElement".
    const form = e.currentTarget;

    if (mode === "file") {
      if (!file) {
        setError("Drop in a file or switch to the link tab.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("File is too large (max 100 MB).");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXT.includes(ext)) {
        setError(
          `Unsupported file type. Use ${ALLOWED_EXT.join(", ").toUpperCase()}.`,
        );
        return;
      }
    }

    setPending(true);

    const supabase = createClient();
    let uploadedPath: string | null = null;

    try {
      if (mode === "file" && file) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError("Please sign in again and retry.");
          setPending(false);
          return;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "stl";
        const safeName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .slice(0, 80);
        const folder = crypto.randomUUID();
        const finalName = safeName.endsWith(`.${ext}`)
          ? safeName
          : `${folder}.${ext}`;
        uploadedPath = `${user.id}/${folder}/${finalName}`;

        setUploadPct(0);
        const { error: upErr } = await supabase.storage
          .from("prints")
          .upload(uploadedPath, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });
        setUploadPct(null);

        if (upErr) {
          setError(`Upload failed: ${upErr.message}`);
          setPending(false);
          return;
        }
      }

      const formData = new FormData(form);
      if (uploadedPath) formData.set("file_path", uploadedPath);

      const result = await submitJob(null, formData);

      if (result?.error) {
        setError(result.error);
        if (uploadedPath) {
          await supabase.storage.from("prints").remove([uploadedPath]);
        }
        setPending(false);
      }
      // On success, submitJob redirects — no further work here.
    } catch (err) {
      // submitJob calls redirect("/") on success, which Next.js
      // implements by throwing a special error with a NEXT_REDIRECT
      // digest. Don't intercept it: it has to bubble up to the
      // framework so the navigation actually happens. If we caught it,
      // the redirect never fires and the cleanup below would also wipe
      // the freshly uploaded STL out from under the job we just
      // created.
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof (err as { digest?: unknown }).digest === "string" &&
        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw err;
      }

      setError(err instanceof Error ? err.message : "Something went wrong.");
      if (uploadedPath) {
        await supabase.storage.from("prints").remove([uploadedPath]);
      }
      setPending(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="mx-auto w-full max-w-2xl px-6 py-12 flex flex-col gap-5"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-3xl font-semibold tracking-tight">Submit a print</h1>
        <p className="mt-1 text-sm text-muted">
          Drop in a file or a link. Add a quick description so the admin knows what to expect.
        </p>
      </motion.div>

      <motion.label variants={fadeUp} className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Title</span>
        <input
          type="text"
          name="title"
          required
          maxLength={120}
          placeholder="e.g. Phone stand for my desk"
          className="h-11 rounded-xl border border-border bg-surface px-4 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
        />
      </motion.label>

      <motion.label variants={fadeUp} className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Description</span>
        <textarea
          name="description"
          maxLength={1000}
          rows={3}
          placeholder="Anything the admin should know — orientation, finish, deadline, etc."
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20 resize-none"
        />
      </motion.label>

      <motion.div variants={fadeUp} className="flex flex-col gap-2.5">
        <div className="relative grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {sourceTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setMode(t.id)}
              className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
                mode === t.id ? "text-foreground" : "text-muted hover:text-foreground",
              )}
            >
              {mode === t.id && (
                <motion.span
                  layoutId="source-tab"
                  className="absolute inset-0 rounded-full bg-bambu-500/10 ring-1 ring-bambu-500/30"
                  transition={transitions.spring}
                />
              )}
              <t.icon className="relative h-4 w-4" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {mode === "file" ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transitions.smooth}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-surface px-6 py-10 text-center transition-all duration-300 cursor-pointer",
                  dragging
                    ? "border-bambu-500 bg-bambu-500/5"
                    : "border-border hover:border-bambu-500/40",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".stl,.3mf,.obj,.step,.stp"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileBox className="h-6 w-6 text-bambu-500" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted">{prettySize(file.size)}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        pickFile(null);
                      }}
                      className="mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted hover:bg-bambu-500/10 hover:text-bambu-700 dark:hover:text-bambu-300 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted" />
                    <p className="text-sm font-medium">
                      Drop a file here or <span className="text-bambu-600 dark:text-bambu-400">browse</span>
                    </p>
                    <p className="text-xs text-muted">
                      STL, 3MF, OBJ, STEP — up to 100 MB
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.label
              key="link"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={transitions.smooth}
              className="flex flex-col gap-1.5"
            >
              <span className="text-xs font-medium text-muted">Link</span>
              <input
                type="url"
                name="source_url"
                placeholder="https://www.printables.com/model/..."
                className="h-11 rounded-xl border border-border bg-surface px-4 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
              />
              <span className="text-[11px] text-muted">
                We&apos;ll pull a thumbnail from the page automatically.
              </span>
            </motion.label>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Color</span>
          <input
            type="text"
            name="color"
            placeholder="any"
            maxLength={40}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Material</span>
          <select
            name="material"
            defaultValue=""
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          >
            <option value="">No preference</option>
            {materials.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Quantity</span>
          <input
            type="number"
            name="quantity"
            min={1}
            max={100}
            defaultValue={1}
            className="h-10 rounded-xl border border-border bg-surface px-3 text-sm transition-colors focus:border-bambu-500 focus:outline-none focus:ring-2 focus:ring-bambu-500/20"
          />
        </label>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-2.5">
        <span className="text-xs font-medium text-muted">Settings</span>
        <div className="relative grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {settingsTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSettingsMode(t.id)}
              className={cn(
                "relative inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
                settingsMode === t.id
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {settingsMode === t.id && (
                <motion.span
                  layoutId="settings-tab"
                  className="absolute inset-0 rounded-full bg-bambu-500/10 ring-1 ring-bambu-500/30"
                  transition={transitions.spring}
                />
              )}
              <t.icon className="relative h-4 w-4" />
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
        <input type="hidden" name="settings_mode" value={settingsMode} />
        <p className="text-[11px] text-muted">
          {settingsTabs.find((t) => t.id === settingsMode)?.blurb}
        </p>

        <AnimatePresence initial={false}>
          {settingsMode === "custom" && (
            <motion.div
              key="custom-settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={transitions.smooth}
              className="overflow-hidden"
            >
              <label className="mt-3 flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">
                  Infill <span className="text-foreground">{infill}%</span>
                </span>
                <input
                  type="range"
                  name="infill"
                  min={0}
                  max={100}
                  step={5}
                  value={infill}
                  onChange={(e) => setInfill(Number(e.target.value))}
                  className="h-10 accent-bambu-500"
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={fadeUp} className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Visibility</span>
        <div className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface p-1">
          {(["team", "private"] as const).map((v) => {
            const Icon = v === "team" ? Eye : EyeOff;
            const label = v === "team" ? "Visible to team" : "Private";
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={cn(
                  "relative inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-300",
                  visibility === v ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {visibility === v && (
                  <motion.span
                    layoutId="visibility-tab"
                    className="absolute inset-0 rounded-full bg-bambu-500/10 ring-1 ring-bambu-500/30"
                    transition={transitions.spring}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="visibility" value={visibility} />
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={transitions.smooth}
            className="rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={pending}
          className="group inline-flex h-12 items-center gap-2 rounded-full bg-bambu-500 px-6 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-out hover:bg-bambu-600 hover:shadow-lg hover:gap-3 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? uploadPct !== null
              ? "Uploading..."
              : "Submitting..."
            : "Add to queue"}
          {!pending && (
            <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}
