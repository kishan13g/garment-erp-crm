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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddCustomer,
  useDeleteCustomer,
  useListCustomers,
  useUpdateCustomer,
} from "@/hooks/useQueries";
import {
  Loader2,
  Pencil,
  Phone,
  Plus,
  Ruler,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../legacy-types";

interface CustomerFormData {
  name: string;
  phone: string;
  bust: string;
  waist: string;
  hip: string;
  length: string;
}

const emptyForm = (): CustomerFormData => ({
  name: "",
  phone: "",
  bust: "",
  waist: "",
  hip: "",
  length: "",
});

function customerToForm(c: Customer): CustomerFormData {
  return {
    name: c.name,
    phone: c.phone,
    bust: String(c.bust),
    waist: String(c.waist),
    hip: String(c.hip),
    length: String(c.length),
  };
}

export function CustomerManager() {
  const { data: customers = [], isLoading } = useListCustomers();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyForm());

  const setField = (k: keyof CustomerFormData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm(customerToForm(c));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      toast.error("Customer name is required");
      return;
    }
    const payload = {
      name: form.name,
      phone: form.phone,
      bust: Number.parseFloat(form.bust) || 0,
      waist: Number.parseFloat(form.waist) || 0,
      hip: Number.parseFloat(form.hip) || 0,
      length: Number.parseFloat(form.length) || 0,
    };
    try {
      if (editing) {
        await updateCustomer.mutateAsync({ id: editing.id, ...payload });
        toast.success("Customer updated");
      } else {
        await addCustomer.mutateAsync(payload);
        toast.success("Customer added");
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm());
    } catch {
      toast.error("Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer.mutateAsync(id);
      toast.success("Customer deleted");
    } catch {
      toast.error("Failed to delete customer");
    }
  };

  const isPending = addCustomer.isPending || updateCustomer.isPending;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <Users className="w-4 h-4 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Customers
            </h2>
            <p className="text-sm text-muted-foreground">
              {customers.length} customers saved
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="customer.add.open_modal_button"
              className="gap-2"
              onClick={openAdd}
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" data-ocid="customer.dialog">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editing ? "Edit Customer" : "Add New Customer"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="e.g. 98765 43210"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                  />
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                data-ocid="customer.submit_button"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editing ? "Save Changes" : "Add Customer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="customer.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div
          data-ocid="customer.empty_state"
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No customers yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add your first customer to get started
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="grid gap-3 sm:grid-cols-2">
            {customers.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                data-ocid={`customer.item.${idx + 1}`}
              >
                <Card className="border-border/60 hover:border-border transition-colors h-full">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {c.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground truncate">
                              {c.name}
                            </p>
                            {c.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {c.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <Ruler className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            B:{c.bust} · W:{c.waist} · H:{c.hip} · L:{c.length}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          data-ocid={`customer.edit_button.${idx + 1}`}
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              data-ocid={`customer.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Customer?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {c.name}&apos;s
                                record and measurements.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="customer.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="customer.confirm_button"
                                onClick={() => handleDelete(c.id)}
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
