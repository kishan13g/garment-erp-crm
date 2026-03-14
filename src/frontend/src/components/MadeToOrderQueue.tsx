import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Factory, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateMadeToOrder,
  useDeleteMadeToOrder,
  useListMadeToOrder,
  useUpdateProductionStatus,
} from "../hooks/useQueries";
import { OrderPriority, ProductionStatus } from "../legacy-types";
import type { MadeToOrder } from "../legacy-types";

const PRIORITY_STYLES: Record<OrderPriority, string> = {
  [OrderPriority.High]: "bg-red-100 text-red-700 border-red-200",
  [OrderPriority.Normal]: "bg-blue-100 text-blue-700 border-blue-200",
  [OrderPriority.Low]: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_STYLES: Record<ProductionStatus, string> = {
  [ProductionStatus.Queued]: "bg-amber-100 text-amber-700 border-amber-200",
  [ProductionStatus.Cutting]: "bg-orange-100 text-orange-700 border-orange-200",
  [ProductionStatus.Stitching]:
    "bg-violet-100 text-violet-700 border-violet-200",
  [ProductionStatus.QualityCheck]: "bg-cyan-100 text-cyan-700 border-cyan-200",
  [ProductionStatus.Ready]: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_ORDER: ProductionStatus[] = [
  ProductionStatus.Queued,
  ProductionStatus.Cutting,
  ProductionStatus.Stitching,
  ProductionStatus.QualityCheck,
  ProductionStatus.Ready,
];

const STATUS_LABELS: Record<ProductionStatus, string> = {
  [ProductionStatus.Queued]: "Queued",
  [ProductionStatus.Cutting]: "Cutting",
  [ProductionStatus.Stitching]: "Stitching",
  [ProductionStatus.QualityCheck]: "Quality Check",
  [ProductionStatus.Ready]: "Ready",
};

function EmptyState() {
  return (
    <div
      data-ocid="mto.empty_state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        <Factory className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
        Queue is Empty
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        Made-to-order manufacturing means zero overstock. Add your first order
        to start the production pipeline.
      </p>
    </div>
  );
}

function AddOrderDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateMadeToOrder();

  const [form, setForm] = useState({
    customerName: "",
    garmentName: "",
    bust: "",
    waist: "",
    hip: "",
    length: "",
    priority: OrderPriority.Normal,
    deliveryDeadline: "",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!form.customerName || !form.garmentName) {
      toast.error("Customer name and garment name are required");
      return;
    }
    try {
      await create.mutateAsync({
        customerName: form.customerName,
        garmentName: form.garmentName,
        measurements: {
          bust: Number(form.bust) || 0,
          waist: Number(form.waist) || 0,
          hip: Number(form.hip) || 0,
          length: Number(form.length) || 0,
        },
        priority: form.priority,
        deliveryDeadline: form.deliveryDeadline,
        notes: form.notes,
      });
      toast.success("Order added to production queue");
      setOpen(false);
      setForm({
        customerName: "",
        garmentName: "",
        bust: "",
        waist: "",
        hip: "",
        length: "",
        priority: OrderPriority.Normal,
        deliveryDeadline: "",
        notes: "",
      });
    } catch {
      toast.error("Failed to add order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-ocid="mto.new.open_modal_button" className="gap-2">
          <Plus className="w-4 h-4" />
          Add to Queue
        </Button>
      </DialogTrigger>
      <DialogContent
        data-ocid="mto.dialog"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-display">New Made-to-Order</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mto-customer">Customer Name *</Label>
              <Input
                id="mto-customer"
                data-ocid="mto.new.input"
                value={form.customerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customerName: e.target.value }))
                }
                placeholder="Priya Sharma"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mto-garment">Garment *</Label>
              <Input
                id="mto-garment"
                value={form.garmentName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, garmentName: e.target.value }))
                }
                placeholder="Salwar Kameez"
              />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Measurements (cm)</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["bust", "waist", "hip", "length"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label
                    htmlFor={`mto-${field}`}
                    className="text-xs capitalize text-muted-foreground"
                  >
                    {field}
                  </Label>
                  <Input
                    id={`mto-${field}`}
                    type="number"
                    value={form[field]}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [field]: e.target.value }))
                    }
                    placeholder="0"
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, priority: v as OrderPriority }))
                }
              >
                <SelectTrigger data-ocid="mto.new.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderPriority.High}>High</SelectItem>
                  <SelectItem value={OrderPriority.Normal}>Normal</SelectItem>
                  <SelectItem value={OrderPriority.Low}>Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mto-deadline">Delivery Deadline</Label>
              <Input
                id="mto-deadline"
                type="date"
                value={form.deliveryDeadline}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deliveryDeadline: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mto-notes">Notes</Label>
            <Textarea
              id="mto-notes"
              data-ocid="mto.new.textarea"
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Special instructions, fabric preferences..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="mto.new.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
            data-ocid="mto.new.submit_button"
          >
            {create.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add to Queue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QueueCard({ item, index }: { item: MadeToOrder; index: number }) {
  const updateStatus = useUpdateProductionStatus();
  const deleteItem = useDeleteMadeToOrder();

  const currentIdx = STATUS_ORDER.indexOf(item.productionStatus);
  const nextStatus =
    currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleAdvance = async () => {
    if (!nextStatus) return;
    try {
      await updateStatus.mutateAsync({ id: item.id, newStatus: nextStatus });
      toast.success(`Status updated to ${STATUS_LABELS[nextStatus]}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(item.id);
      toast.success("Order removed from queue");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  return (
    <Card
      data-ocid={`mto.item.${index}`}
      className="border border-border/60 bg-card hover:shadow-xs transition-shadow"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-foreground truncate">
                {item.customerName}
              </span>
              <Badge
                variant="outline"
                className={`text-xs border ${PRIORITY_STYLES[item.priority]}`}
              >
                {item.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {item.garmentName}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                data-ocid={`mto.status.select.${index}`}
                variant="outline"
                className={`text-xs border ${STATUS_STYLES[item.productionStatus]}`}
              >
                {STATUS_LABELS[item.productionStatus]}
              </Badge>
              {item.deliveryDeadline && (
                <span className="text-xs text-muted-foreground">
                  Due: {item.deliveryDeadline}
                </span>
              )}
            </div>
            {item.measurements && (
              <p className="text-xs text-muted-foreground mt-1.5">
                B:{item.measurements.bust} W:{item.measurements.waist} H:
                {item.measurements.hip} L:{item.measurements.length}
              </p>
            )}
            {item.notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                {item.notes}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            {nextStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAdvance}
                disabled={updateStatus.isPending}
                className="text-xs"
                data-ocid={`mto.status.button.${index}`}
              >
                → {STATUS_LABELS[nextStatus]}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteItem.isPending}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              data-ocid={`mto.delete_button.${index}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MadeToOrderQueue() {
  const { data: items = [], isLoading } = useListMadeToOrder();

  const readyCount = items.filter(
    (i) => i.productionStatus === ProductionStatus.Ready,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Made-to-Order Queue
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            On-demand manufacturing — zero overstock, zero waste
          </p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {items.length}
              </span>{" "}
              in queue
              {readyCount > 0 && (
                <>
                  ,{" "}
                  <span className="font-semibold text-green-600">
                    {readyCount}
                  </span>{" "}
                  ready
                </>
              )}
            </div>
          )}
          <AddOrderDialog />
        </div>
      </div>

      {isLoading ? (
        <div
          data-ocid="mto.loading_state"
          className="flex items-center justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <QueueCard key={String(item.id)} item={item} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
