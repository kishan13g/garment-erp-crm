import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileUp,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useCreateGarment,
  useDeleteGarment,
  useListGarments,
  useUpdateGarment,
} from "../hooks/useQueries";
import type { GarmentType, PatternPiece } from "../legacy-types";

const DEFAULT_PIECES: PatternPiece[] = [
  { name: "Front Body", instructions: "Cut 1 on fold", cutOnFold: true },
  { name: "Back Body", instructions: "Cut 1 on fold", cutOnFold: true },
];

const FALLBACK_GARMENTS: GarmentType[] = [
  {
    name: "Salwar",
    description: "Traditional drawstring trousers with a tapered leg",
    patternPieces: [
      { name: "Front Leg", instructions: "Cut 2 pieces", cutOnFold: false },
      { name: "Back Leg", instructions: "Cut 2 pieces", cutOnFold: false },
      { name: "Waistband", instructions: "Cut 1 on fold", cutOnFold: true },
    ],
  },
  {
    name: "Kameez",
    description: "Long tunic shirt worn over salwar",
    patternPieces: [
      { name: "Front Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Back Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Sleeve", instructions: "Cut 2 pieces", cutOnFold: false },
      {
        name: "Front Neckline Facing",
        instructions: "Cut 1 on fold",
        cutOnFold: true,
      },
    ],
  },
  {
    name: "Kurti",
    description: "Short decorative tunic, hip-length or knee-length",
    patternPieces: [
      { name: "Front Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Back Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Sleeve", instructions: "Cut 2 pieces", cutOnFold: false },
    ],
  },
  {
    name: "Blouse",
    description: "Fitted blouse worn with saree or lehenga",
    patternPieces: [
      { name: "Front Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Back Body", instructions: "Cut 1 on fold", cutOnFold: true },
      { name: "Sleeve", instructions: "Cut 2 pieces", cutOnFold: false },
      {
        name: "Collar",
        instructions: "Cut 2 pieces (1 interfacing)",
        cutOnFold: false,
      },
    ],
  },
];

interface GarmentFormData {
  name: string;
  description: string;
  patternPieces: PatternPiece[];
}

interface ImportedPiece {
  name: string;
  width: number;
  height: number;
  quantity: number;
  notes: string;
}

const SAMPLE_JSON_TEMPLATE: ImportedPiece[] = [
  {
    name: "Front Body",
    width: 45,
    height: 100,
    quantity: 1,
    notes: "Cut on fold",
  },
  {
    name: "Back Body",
    width: 45,
    height: 100,
    quantity: 1,
    notes: "Cut on fold",
  },
  { name: "Sleeve", width: 35, height: 60, quantity: 2, notes: "" },
];

function downloadJsonTemplate() {
  const blob = new Blob([JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pattern-template.json";
  a.click();
  URL.revokeObjectURL(url);
}

function parseJson(text: string): ImportedPiece[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON must be an array");
  return data.map((row: Record<string, unknown>) => ({
    name: String(row.name ?? ""),
    width: Number(row.width ?? 0),
    height: Number(row.height ?? 0),
    quantity: Number(row.quantity ?? 1),
    notes: String(row.notes ?? ""),
  }));
}

function parseCsv(text: string): ImportedPiece[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2)
    throw new Error("CSV must have a header and at least one data row");
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const get = (key: string) => cols[headers.indexOf(key)] ?? "";
    return {
      name: get("name"),
      width: Number(get("width")) || 0,
      height: Number(get("height")) || 0,
      quantity: Number(get("quantity")) || 1,
      notes: get("notes"),
    };
  });
}

function PatternImporter({ garmentList }: { garmentList: GarmentType[] }) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pieces, setPieces] = useState<ImportedPiece[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [targetGarment, setTargetGarment] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateGarment = useUpdateGarment();

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setPieces(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsed: ImportedPiece[];
        if (file.name.endsWith(".json")) {
          parsed = parseJson(text);
        } else if (file.name.endsWith(".csv")) {
          parsed = parseCsv(text);
        } else {
          throw new Error("Unsupported file type. Please use .json or .csv");
        }
        if (parsed.length === 0)
          throw new Error("No pattern pieces found in file");
        setPieces(parsed);
      } catch (err) {
        setParseError(
          err instanceof Error ? err.message : "Failed to parse file",
        );
      }
    };
    reader.readAsText(file);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleClear() {
    setPieces(null);
    setParseError(null);
    setFileName(null);
    setTargetGarment("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleAddToLibrary() {
    if (!pieces || !targetGarment) return;
    const garment = garmentList.find((g) => g.name === targetGarment);
    if (!garment) return;
    setIsAdding(true);
    const newPieces: PatternPiece[] = pieces.map((p) => ({
      name: p.name,
      instructions: `Cut ${p.quantity} piece${p.quantity !== 1 ? "s" : ""}${p.notes ? ` – ${p.notes}` : ""}`,
      cutOnFold: p.notes.toLowerCase().includes("fold"),
    }));
    updateGarment.mutate(
      {
        name: garment.name,
        description: garment.description,
        patternPieces: [...garment.patternPieces, ...newPieces],
      },
      {
        onSuccess: () => {
          toast.success(`${pieces.length} pieces added to "${targetGarment}"`);
          handleClear();
          setOpen(false);
          setIsAdding(false);
        },
        onError: () => {
          toast.error("Failed to add pattern pieces");
          setIsAdding(false);
        },
      },
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/60 overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
        data-ocid="import.toggle"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <FileUp className="w-4 h-4 text-accent-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">
              Import Patterns
            </p>
            <p className="text-xs text-muted-foreground">
              Load from JSON or CSV file
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/40 px-5 py-5 space-y-4"
        >
          {/* Upload area */}
          {!pieces && !parseError && (
            <div
              data-ocid="import.dropzone"
              aria-label="Pattern file upload dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/50 hover:bg-muted/20"
              }`}
            >
              <FileUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">
                Drag & drop or{" "}
                <button
                  type="button"
                  data-ocid="import.upload_button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-primary hover:underline focus:outline-none"
                >
                  browse file
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                JSON or CSV format supported
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadJsonTemplate();
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3 h-3" />
                Download JSON template
              </button>
            </div>
          )}

          {/* Error state */}
          {parseError && (
            <div
              data-ocid="import.error_state"
              className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
            >
              <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">
                  Parse Error
                </p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {parseError}
                </p>
              </div>
              <button
                type="button"
                data-ocid="import.cancel_button"
                onClick={handleClear}
                className="text-destructive/60 hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Preview table */}
          {pieces && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {pieces.length} pattern pieces found
                  </Badge>
                  {fileName && (
                    <span className="text-xs text-muted-foreground">
                      {fileName}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  data-ocid="import.cancel_button"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear import"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-lg border border-border/60 overflow-hidden">
                <Table data-ocid="import.table">
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold">
                        Name
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        W (cm)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        H (cm)
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Qty
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Notes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pieces.map((piece, idx) => (
                      <TableRow
                        key={`import-${idx}-${piece.name}`}
                        data-ocid={`import.row.${idx + 1}`}
                        className="text-sm"
                      >
                        <TableCell className="font-medium">
                          {piece.name}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {piece.width}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {piece.height}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {piece.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[120px] truncate">
                          {piece.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Garment select + submit */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-1">
                <Select value={targetGarment} onValueChange={setTargetGarment}>
                  <SelectTrigger
                    data-ocid="import.garment.select"
                    className="flex-1 bg-background text-sm"
                  >
                    <SelectValue placeholder="Select garment to add pieces to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {garmentList.map((g) => (
                      <SelectItem key={g.name} value={g.name}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  data-ocid="import.submit_button"
                  onClick={handleAddToLibrary}
                  disabled={!targetGarment || isAdding}
                  className="gap-2 whitespace-nowrap"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add to Garment Library
                </Button>
              </div>
            </motion.div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleInputChange}
          />
        </motion.div>
      )}
    </div>
  );
}

function PieceEditor({
  pieces,
  onChange,
}: {
  pieces: PatternPiece[];
  onChange: (pieces: PatternPiece[]) => void;
}) {
  function addPiece() {
    onChange([...pieces, { name: "", instructions: "", cutOnFold: false }]);
  }

  function removePiece(idx: number) {
    onChange(pieces.filter((_, i) => i !== idx));
  }

  function updatePiece(idx: number, updates: Partial<PatternPiece>) {
    onChange(pieces.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Pattern Pieces</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid="admin.piece.button"
          onClick={addPiece}
          className="gap-1 text-xs"
        >
          <Plus className="w-3 h-3" /> Add Piece
        </Button>
      </div>
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {pieces.map((piece, idx) => (
          <div
            key={`edit-${idx}-${piece.name}`}
            className="p-3 bg-muted/40 rounded-lg border border-border/50 space-y-2"
          >
            <div className="flex gap-2">
              <Input
                placeholder="Piece name (e.g. Front Body)"
                value={piece.name}
                data-ocid={`admin.piece.input.${idx + 1}`}
                onChange={(e) => updatePiece(idx, { name: e.target.value })}
                className="flex-1 text-sm bg-background h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-ocid={`admin.piece.delete_button.${idx + 1}`}
                onClick={() => removePiece(idx)}
                className="px-2 h-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Input
              placeholder="Instructions (e.g. Cut 2 pieces)"
              value={piece.instructions}
              onChange={(e) =>
                updatePiece(idx, { instructions: e.target.value })
              }
              className="text-sm bg-background h-8"
            />
            <div className="flex items-center gap-2">
              <Switch
                id={`fold-${idx}`}
                checked={piece.cutOnFold}
                data-ocid={`admin.piece.switch.${idx + 1}`}
                onCheckedChange={(v) => updatePiece(idx, { cutOnFold: v })}
              />
              <Label htmlFor={`fold-${idx}`} className="text-xs cursor-pointer">
                Cut on fold
              </Label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GarmentDialog({
  trigger,
  garment,
  onSave,
  isPending,
}: {
  trigger: React.ReactNode;
  garment?: GarmentType;
  onSave: (data: GarmentFormData) => void;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GarmentFormData>(
    garment
      ? {
          name: garment.name,
          description: garment.description,
          patternPieces: garment.patternPieces,
        }
      : { name: "", description: "", patternPieces: DEFAULT_PIECES },
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
    if (!isPending) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        data-ocid="admin.dialog"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {garment ? "Edit Garment" : "Add New Garment"}
          </DialogTitle>
          <DialogDescription>
            {garment
              ? "Update the garment details and pattern pieces."
              : "Add a new garment type with its pattern pieces."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="garment-name" className="text-sm font-semibold">
              Garment Name
            </Label>
            <Input
              id="garment-name"
              data-ocid="admin.garment.input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Anarkali"
              disabled={!!garment}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garment-desc" className="text-sm font-semibold">
              Description
            </Label>
            <Textarea
              id="garment-desc"
              data-ocid="admin.garment.textarea"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Brief description of the garment style..."
              rows={2}
            />
          </div>
          <PieceEditor
            pieces={form.patternPieces}
            onChange={(pieces) =>
              setForm((p) => ({ ...p, patternPieces: pieces }))
            }
          />
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="admin.dialog.cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="admin.dialog.save_button"
              disabled={isPending || !form.name.trim()}
              className="gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {garment ? "Save Changes" : "Create Garment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GarmentCard({
  garment,
  index,
}: { garment: GarmentType; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const updateGarment = useUpdateGarment();
  const deleteGarment = useDeleteGarment();

  function handleUpdate(data: GarmentFormData) {
    updateGarment.mutate(
      {
        name: garment.name,
        description: data.description,
        patternPieces: data.patternPieces,
      },
      {
        onSuccess: () =>
          toast.success(`"${garment.name}" updated successfully`),
        onError: () => toast.error("Failed to update garment"),
      },
    );
  }

  function handleDelete() {
    deleteGarment.mutate(garment.name, {
      onSuccess: () => toast.success(`"${garment.name}" deleted`),
      onError: () => toast.error("Failed to delete garment"),
    });
  }

  return (
    <motion.div
      data-ocid={`admin.garment.item.${index + 1}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="bg-card rounded-xl border border-border/60 shadow-xs overflow-hidden"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base font-semibold text-foreground">
              {garment.name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {garment.patternPieces.length} piece
              {garment.patternPieces.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {garment.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {garment.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <GarmentDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`admin.garment.edit_button.${index + 1}`}
                className="px-2"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            }
            garment={garment}
            onSave={handleUpdate}
            isPending={updateGarment.isPending}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                data-ocid={`admin.garment.delete_button.${index + 1}`}
                className="px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-ocid="admin.garment.dialog">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">
                  Delete &ldquo;{garment.name}&rdquo;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the garment and all its pattern
                  pieces. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="admin.garment.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  data-ocid="admin.garment.confirm_button"
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteGarment.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            variant="ghost"
            size="sm"
            data-ocid={`admin.garment.toggle.${index + 1}`}
            onClick={() => setExpanded((v) => !v)}
            className="px-2"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-border/40 px-5 py-4 bg-muted/20"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pattern Pieces
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {garment.patternPieces.map((piece, pi) => (
              <div
                key={`${piece.name}-${pi}`}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-card border border-border/50"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {piece.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {piece.instructions}
                  </p>
                  {piece.cutOnFold && (
                    <span className="text-xs text-primary font-medium">
                      &#9986; Cut on fold
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function AdminPanel() {
  const { data: garments, isLoading, isError } = useListGarments();
  const createGarment = useCreateGarment();

  const garmentList =
    garments && garments.length > 0 ? garments : FALLBACK_GARMENTS;

  function handleCreate(data: GarmentFormData) {
    createGarment.mutate(data, {
      onSuccess: () => toast.success(`"${data.name}" created successfully`),
      onError: () => toast.error("Failed to create garment"),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Garment Library
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage garment types and their pattern piece templates.
          </p>
        </div>
        <GarmentDialog
          trigger={
            <Button
              data-ocid="admin.open_modal_button"
              className="gap-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Garment
            </Button>
          }
          onSave={handleCreate}
          isPending={createGarment.isPending}
        />
      </div>

      {/* Import Patterns section */}
      <PatternImporter garmentList={garmentList} />

      {isLoading && (
        <div data-ocid="admin.loading_state" className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl border border-border/60 p-5"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div
          data-ocid="admin.error_state"
          className="text-center py-12 text-destructive"
        >
          <p className="font-medium">Failed to load garments</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please refresh the page and try again.
          </p>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {garmentList.length === 0 ? (
            <div
              data-ocid="admin.garment.empty_state"
              className="text-center py-16 rounded-xl border-2 border-dashed border-border/60"
            >
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-display text-lg text-foreground mb-1">
                No Garments Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Click &ldquo;Add Garment&rdquo; to create your first garment
                type.
              </p>
            </div>
          ) : (
            garmentList.map((garment, i) => (
              <GarmentCard key={garment.name} garment={garment} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
