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
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateOrder,
  useDeleteOrder,
  useListGarments,
  useListOrders,
  useUpdateOrderStatus,
} from "@/hooks/useQueries";
import { ClipboardList, Loader2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Order } from "../legacy-types";

const STATUS_OPTIONS = ["Pending", "In Progress", "Completed", "Delivered"];
const FILTER_OPTIONS = ["All", ...STATUS_OPTIONS];

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Delivered: "bg-purple-100 text-purple-800 border-purple-200",
};

function formatDate(ts: number) {
  return new Date(ts / 1_000_000).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface OrderFormData {
  customerName: string;
  garmentName: string;
  bust: string;
  waist: string;
  hip: string;
  length: string;
  notes: string;
}

const emptyForm = (): OrderFormData => ({
  customerName: "",
  garmentName: "",
  bust: "",
  waist: "",
  hip: "",
  length: "",
  notes: "",
});

export function OrderManager() {
  const { data: orders = [], isLoading } = useListOrders();
  const { data: garments = [] } = useListGarments();
  const createOrder = useCreateOrder();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();

  const [filter, setFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<OrderFormData>(emptyForm());

  const filtered =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const setField = (k: keyof OrderFormData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleCreate = async () => {
    if (!form.customerName || !form.garmentName) {
      toast.error("Customer name and garment are required");
      return;
    }
    try {
      await createOrder.mutateAsync({
        customerName: form.customerName,
        garmentName: form.garmentName,
        bust: Number.parseFloat(form.bust) || 0,
        waist: Number.parseFloat(form.waist) || 0,
        hip: Number.parseFloat(form.hip) || 0,
        length: Number.parseFloat(form.length) || 0,
        notes: form.notes,
      });
      toast.success("Order created successfully");
      setForm(emptyForm());
      setDialogOpen(false);
    } catch {
      toast.error("Failed to create order");
    }
  };

  const handleStatusChange = async (order: Order, status: string) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOrder.mutateAsync(id);
      toast.success("Order deleted");
    } catch {
      toast.error("Failed to delete order");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Orders
            </h2>
            <p className="text-sm text-muted-foreground">
              {orders.length} total orders
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="order.new.open_modal_button" className="gap-2">
              <Plus className="w-4 h-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg" data-ocid="order.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">
                Create New Order
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Customer Name</Label>
                  <Input
                    placeholder="e.g. Priya Sharma"
                    value={form.customerName}
                    onChange={(e) => setField("customerName", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Garment</Label>
                  <Select
                    value={form.garmentName}
                    onValueChange={(v) => setField("garmentName", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select garment" />
                    </SelectTrigger>
                    <SelectContent>
                      {garments.map((g) => (
                        <SelectItem key={g.name} value={g.name}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Bust (cm)</Label>
                  <Input
                    type="number"
                    placeholder="86"
                    value={form.bust}
                    onChange={(e) => setField("bust", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Waist (cm)</Label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={form.waist}
                    onChange={(e) => setField("waist", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Hip (cm)</Label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={form.hip}
                    onChange={(e) => setField("hip", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Length (cm)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={form.length}
                    onChange={(e) => setField("length", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any special instructions..."
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                data-ocid="order.submit_button"
                onClick={handleCreate}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" data-ocid="order.filter.tab">
        {FILTER_OPTIONS.map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
            }`}
          >
            {f}
            {f !== "All" && (
              <span className="ml-1.5 opacity-60 text-xs">
                ({orders.filter((o) => o.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="order.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="order.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No orders found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {filter === "All"
              ? "Create your first order"
              : `No ${filter} orders`}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-3">
            {filtered.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                data-ocid={`order.item.${idx + 1}`}
              >
                <Card className="border-border/60 hover:border-border transition-colors">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground truncate">
                            {order.customerName}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ·
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {order.garmentName}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                              STATUS_COLORS[order.status] ??
                              "bg-muted text-muted-foreground"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          <span>
                            B: {order.bust} · W: {order.waist} · H: {order.hip}{" "}
                            · L: {order.length}
                          </span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {order.notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground italic">
                            {order.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusChange(order, v)}
                        >
                          <SelectTrigger
                            className="h-8 text-xs w-32"
                            data-ocid={`order.status.select.${idx + 1}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              data-ocid={`order.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the order for{" "}
                                {order.customerName}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="order.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="order.confirm_button"
                                onClick={() => handleDelete(order.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
