export type FilamentSpool = {
  id: string;
  material: string;
  color_name: string;
  color_hex: string;
  brand: string | null;
  grams_total: number;
  grams_remaining: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const MATERIAL_OPTIONS = [
  "PLA",
  "PETG",
  "ABS",
  "TPU",
  "PA",
  "PC",
  "ASA",
  "Other",
] as const;

// Curated palette for the admin's "quick add" picker. Hex values
// roughly match Bambu's matte palette so the rendered spools look
// like the spools sitting next to the printer.
export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Black", hex: "#1a1a1a" },
  { name: "White", hex: "#f3f4f6" },
  { name: "Gray", hex: "#737373" },
  { name: "Silver", hex: "#9ca3af" },
  { name: "Red", hex: "#dc2626" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Yellow", hex: "#facc15" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Bambu Green", hex: "#00ae42" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Brown", hex: "#92400e" },
  { name: "Beige", hex: "#d6c5a3" },
  { name: "Transparent", hex: "#e5e7eb" },
];
