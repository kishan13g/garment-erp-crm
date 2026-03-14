import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateSubscriber,
  useCreateSubscriptionPlan,
  useDeleteSubscriber,
  useDeleteSubscriptionPlan,
  useListSubscribers,
  useListSubscriptionPlans,
  useUpdateSubscriberStatus,
  useUpdateSubscriptionPlan,
} from "../hooks/useQueries";
import { BillingCycle, SubscriberStatus } from "../legacy-types";
import type { Subscriber, SubscriptionPlan } from "../legacy-types";

const BILLING_LABELS: Record<BillingCycle, string> = {
  [BillingCycle.Monthly]: "Monthly",
  [BillingCycle.Quarterly]: "Quarterly",
  [BillingCycle.Yearly]: "Yearly",
};

const STATUS_STYLES: Record<SubscriberStatus, string> = {
  [SubscriberStatus.Active]: "bg-green-100 text-green-700 border-green-200",
  [SubscriberStatus.Paused]: "bg-amber-100 text-amber-700 border-amber-200",
  [SubscriberStatus.Cancelled]: "bg-gray-100 text-gray-500 border-gray-200",
};

// ── Plans ────────────────────────────────────────────────────────────────────

function AddPlanDialog() {
  const [open, setOpen] = useState(false);
  const create = useCreateSubscriptionPlan();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    billingCycle: BillingCycle.Monthly,
    servicesInput: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    const services = form.servicesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await create.mutateAsync({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        billingCycle: form.billingCycle,
        includedServices: services,
      });
      toast.success("Plan created");
      setOpen(false);
      setForm({
        name: "",
        description: "",
        price: "",
        billingCycle: BillingCycle.Monthly,
        servicesInput: "",
      });
    } catch {
      toast.error("Failed to create plan");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-ocid="sub.plan.open_modal_button" className="gap-2">
          <Plus className="w-4 h-4" />
          New Plan
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="sub.plan.dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            Create Subscription Plan
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="plan-name">Plan Name *</Label>
            <Input
              id="plan-name"
              data-ocid="sub.plan.input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Monthly Stitching"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-desc">Description</Label>
            <Textarea
              id="plan-desc"
              data-ocid="sub.plan.textarea"
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="What does this plan include..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-price">Price (₹) *</Label>
              <Input
                id="plan-price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="999"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Billing Cycle</Label>
              <Select
                value={form.billingCycle}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, billingCycle: v as BillingCycle }))
                }
              >
                <SelectTrigger data-ocid="sub.plan.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BillingCycle.Monthly}>Monthly</SelectItem>
                  <SelectItem value={BillingCycle.Quarterly}>
                    Quarterly
                  </SelectItem>
                  <SelectItem value={BillingCycle.Yearly}>Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="plan-services">
              Included Services (comma-separated)
            </Label>
            <Input
              id="plan-services"
              value={form.servicesInput}
              onChange={(e) =>
                setForm((p) => ({ ...p, servicesInput: e.target.value }))
              }
              placeholder="2 blouses, 1 kurti, alterations"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="sub.plan.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
            data-ocid="sub.plan.submit_button"
          >
            {create.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanCard({
  plan,
  index,
  subscriberCount,
}: {
  plan: SubscriptionPlan;
  index: number;
  subscriberCount: number;
}) {
  const updatePlan = useUpdateSubscriptionPlan();
  const deletePlan = useDeleteSubscriptionPlan();

  const handleToggleActive = async () => {
    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle,
        includedServices: plan.includedServices,
        isActive: !plan.isActive,
      });
      toast.success(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
    } catch {
      toast.error("Failed to update plan");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <Card
      data-ocid={`sub.plan.item.${index}`}
      className={`border flex flex-col ${
        plan.isActive ? "border-border/60" : "border-border/30 opacity-60"
      }`}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">
              {plan.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {BILLING_LABELS[plan.billingCycle]}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-semibold text-primary">
              ₹{plan.price.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">
              {subscriberCount} subscribers
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-2 flex-1">
        {plan.description && (
          <p className="text-sm text-muted-foreground mb-2">
            {plan.description}
          </p>
        )}
        {plan.includedServices.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {plan.includedServices.map((s) => (
              <Badge key={s} variant="outline" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-3 pt-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={handleToggleActive}
          disabled={updatePlan.isPending}
          data-ocid={`sub.plan.toggle.${index}`}
        >
          {plan.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={deletePlan.isPending}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          data-ocid={`sub.plan.delete_button.${index}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Subscribers ──────────────────────────────────────────────────────────────

function AddSubscriberDialog({ plans }: { plans: SubscriptionPlan[] }) {
  const [open, setOpen] = useState(false);
  const create = useCreateSubscriber();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    planId: "",
    startDate: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.planId) {
      toast.error("Name and plan are required");
      return;
    }
    const plan = plans.find((p) => String(p.id) === form.planId);
    if (!plan) {
      toast.error("Invalid plan selected");
      return;
    }
    try {
      await create.mutateAsync({
        name: form.name,
        phone: form.phone,
        planId: plan.id,
        planName: plan.name,
        startDate: form.startDate,
      });
      toast.success("Subscriber added");
      setOpen(false);
      setForm({ name: "", phone: "", planId: "", startDate: "" });
    } catch {
      toast.error("Failed to add subscriber");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-ocid="sub.subscriber.open_modal_button" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Subscriber
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="sub.subscriber.dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Subscriber</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name">Name *</Label>
              <Input
                id="sub-name"
                data-ocid="sub.subscriber.input"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Kavya Reddy"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-phone">Phone</Label>
              <Input
                id="sub-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+91 9876543210"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Plan *</Label>
            <Select
              value={form.planId}
              onValueChange={(v) => setForm((p) => ({ ...p, planId: v }))}
            >
              <SelectTrigger data-ocid="sub.subscriber.select">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={String(plan.id)} value={String(plan.id)}>
                    {plan.name} — ₹{plan.price} /{" "}
                    {BILLING_LABELS[plan.billingCycle]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sub-start">Start Date</Label>
            <Input
              id="sub-start"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-ocid="sub.subscriber.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending}
            data-ocid="sub.subscriber.submit_button"
          >
            {create.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Add Subscriber
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubscriberRow({
  subscriber,
  index,
}: {
  subscriber: Subscriber;
  index: number;
}) {
  const updateStatus = useUpdateSubscriberStatus();
  const deleteSubscriber = useDeleteSubscriber();

  const handleStatusChange = async (newStatus: SubscriberStatus) => {
    try {
      await updateStatus.mutateAsync({ id: subscriber.id, newStatus });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSubscriber.mutateAsync(subscriber.id);
      toast.success("Subscriber removed");
    } catch {
      toast.error("Failed to delete subscriber");
    }
  };

  return (
    <div
      data-ocid={`sub.subscriber.item.${index}`}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card hover:bg-secondary/20 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground text-sm">
            {subscriber.name}
          </span>
          <Badge
            variant="outline"
            className={`text-xs border ${STATUS_STYLES[subscriber.status]}`}
          >
            {subscriber.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {subscriber.phone && (
            <span className="text-xs text-muted-foreground">
              {subscriber.phone}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {subscriber.planName}
          </span>
          {subscriber.startDate && (
            <span className="text-xs text-muted-foreground">
              Since {subscriber.startDate}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Select
          value={subscriber.status}
          onValueChange={(v) => handleStatusChange(v as SubscriberStatus)}
        >
          <SelectTrigger
            className="h-7 text-xs w-28"
            data-ocid={`sub.subscriber.select.${index}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SubscriberStatus.Active}>Active</SelectItem>
            <SelectItem value={SubscriberStatus.Paused}>Paused</SelectItem>
            <SelectItem value={SubscriberStatus.Cancelled}>
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          disabled={deleteSubscriber.isPending}
          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          data-ocid={`sub.subscriber.delete_button.${index}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SubscriptionManager() {
  const { data: plans = [], isLoading: plansLoading } =
    useListSubscriptionPlans();
  const { data: subscribers = [], isLoading: subsLoading } =
    useListSubscribers();

  const subsByPlan = (planId: bigint) =>
    subscribers.filter((s) => s.planId === planId).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Subscription Services
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recurring revenue through subscription-based fashion services
        </p>
      </div>

      <Tabs defaultValue="plans">
        <TabsList className="bg-secondary/50 border border-border/60 rounded-xl p-1">
          <TabsTrigger
            value="plans"
            data-ocid="sub.plans_tab"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Plans
            {plans.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {plans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="subscribers"
            data-ocid="sub.subscribers_tab"
            className="gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-xs"
          >
            <Users className="w-3.5 h-3.5" />
            Subscribers
            {subscribers.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {subscribers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Manage subscription tiers for your fashion services
            </p>
            <AddPlanDialog />
          </div>
          {plansLoading ? (
            <div
              data-ocid="sub.plans.loading_state"
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div
              data-ocid="sub.plans.empty_state"
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                No Plans Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create subscription tiers to offer recurring fashion services to
                your customers.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <PlanCard
                  key={String(plan.id)}
                  plan={plan}
                  index={i + 1}
                  subscriberCount={subsByPlan(plan.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribers" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Track and manage your active subscribers
            </p>
            <AddSubscriberDialog plans={plans} />
          </div>
          {subsLoading ? (
            <div
              data-ocid="sub.subscribers.loading_state"
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscribers.length === 0 ? (
            <div
              data-ocid="sub.subscribers.empty_state"
              className="flex flex-col items-center justify-center py-14 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                No Subscribers Yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Add your first subscriber to start tracking recurring fashion
                service memberships.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {subscribers.map((sub, i) => (
                <SubscriberRow
                  key={String(sub.id)}
                  subscriber={sub}
                  index={i + 1}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
