// Legacy hooks using localStorage (backend methods no longer exist in ERP backend)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BillingCycle,
  Customer,
  GarmentType,
  MadeToOrder,
  Measurements,
  Order,
  OrderPriority,
  PatternPiece,
  ProductionStatus,
  Subscriber,
  SubscriberStatus,
  SubscriptionPlan,
} from "../legacy-types";

// ── LocalStorage helpers ──────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Default garments ──────────────────────────────────────────────────────────

const DEFAULT_GARMENTS: GarmentType[] = [
  {
    name: "Salwar",
    description: "Traditional drawstring trousers with a tapered leg",
    patternPieces: [
      { name: "Front Leg", cutOnFold: true },
      { name: "Back Leg", cutOnFold: true },
      { name: "Waistband", cutOnFold: false },
    ],
  },
  {
    name: "Kameez",
    description: "Long tunic shirt with side slits, worn over salwar",
    patternPieces: [
      { name: "Front Body", cutOnFold: true },
      { name: "Back Body", cutOnFold: true },
      { name: "Sleeve", cutOnFold: false },
      { name: "Neckline Facing", cutOnFold: true },
    ],
  },
  {
    name: "Kurti",
    description: "Short decorative tunic, hip-length or knee-length",
    patternPieces: [
      { name: "Front Body", cutOnFold: true },
      { name: "Back Body", cutOnFold: true },
      { name: "Sleeve", cutOnFold: false },
      { name: "Collar", cutOnFold: false },
    ],
  },
  {
    name: "Blouse",
    description: "Fitted blouse worn with saree or lehenga",
    patternPieces: [
      { name: "Front Body", cutOnFold: false },
      { name: "Back Body", cutOnFold: false },
      { name: "Sleeve", cutOnFold: false },
      { name: "Collar", cutOnFold: false },
    ],
  },
];

// ── Garments ──────────────────────────────────────────────────────────────────

export function useListGarments() {
  return useQuery<GarmentType[]>({
    queryKey: ["garments"],
    queryFn: async () =>
      lsGet<GarmentType>("legacy_garments", DEFAULT_GARMENTS),
  });
}

export function useCalculatePattern(
  garmentName: string,
  measurements: Measurements | null,
) {
  return useQuery<Array<[PatternPiece, Measurements]>>({
    queryKey: ["pattern", garmentName, measurements],
    queryFn: async () => {
      if (!measurements || !garmentName) return [];
      const garments = lsGet<GarmentType>("legacy_garments", DEFAULT_GARMENTS);
      const garment = garments.find(
        (g) => g.name.toLowerCase() === garmentName.toLowerCase(),
      );
      const pieces = garment?.patternPieces ?? [
        { name: "Front Body", cutOnFold: true },
        { name: "Back Body", cutOnFold: true },
        { name: "Sleeve", cutOnFold: false },
      ];
      return pieces.map(
        (p) => [p, measurements] as [PatternPiece, Measurements],
      );
    },
    enabled: !!measurements && !!garmentName,
  });
}

export function useCreateGarment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      patternPieces,
    }: {
      name: string;
      description: string;
      patternPieces: PatternPiece[];
    }) => {
      const garments = lsGet<GarmentType>("legacy_garments", DEFAULT_GARMENTS);
      const newGarment: GarmentType = { name, description, patternPieces };
      lsSet("legacy_garments", [...garments, newGarment]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garments"] }),
  });
}

export function useUpdateGarment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      patternPieces,
    }: {
      name: string;
      description: string;
      patternPieces: PatternPiece[];
    }) => {
      const garments = lsGet<GarmentType>("legacy_garments", DEFAULT_GARMENTS);
      const updated = garments.map((g) =>
        g.name === name ? { name, description, patternPieces } : g,
      );
      lsSet("legacy_garments", updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garments"] }),
  });
}

export function useDeleteGarment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const garments = lsGet<GarmentType>("legacy_garments", DEFAULT_GARMENTS);
      lsSet(
        "legacy_garments",
        garments.filter((g) => g.name !== name),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garments"] }),
  });
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function useListCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => lsGet<Customer>("legacy_customers", []),
  });
}

export function useAddCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Omit<Customer, "id">) => {
      const customers = lsGet<Customer>("legacy_customers", []);
      const newCustomer: Customer = { ...c, id: Date.now().toString() };
      lsSet("legacy_customers", [...customers, newCustomer]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Customer) => {
      const customers = lsGet<Customer>("legacy_customers", []);
      lsSet(
        "legacy_customers",
        customers.map((x) => (x.id === c.id ? c : x)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const customers = lsGet<Customer>("legacy_customers", []);
      lsSet(
        "legacy_customers",
        customers.filter((c) => c.id !== id),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export function useListOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      const raw = lsGet<any>("legacy_orders", []);
      return raw.map((o: any) => ({
        ...o,
        createdAt: BigInt(o.createdAt ?? 0),
      }));
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: Omit<Order, "id" | "createdAt" | "status">) => {
      const orders = lsGet<Order>("legacy_orders", []);
      const newOrder: Order = {
        ...o,
        id: Date.now().toString(),
        status: "Pending",
        createdAt: Date.now() * 1_000_000,
      };
      lsSet("legacy_orders", [...orders, newOrder]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const orders = lsGet<Order>("legacy_orders", []);
      lsSet(
        "legacy_orders",
        orders.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const orders = lsGet<Order>("legacy_orders", []);
      lsSet(
        "legacy_orders",
        orders.filter((o) => o.id !== id),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

// ── Made-to-Order ─────────────────────────────────────────────────────────────

export function useListMadeToOrder() {
  return useQuery<MadeToOrder[]>({
    queryKey: ["mto"],
    queryFn: async () => {
      const raw = lsGet<any>("legacy_mto", []);
      // Convert id back to bigint
      return raw.map((r: any) => ({ ...r, id: BigInt(r.id ?? 0) }));
    },
  });
}

export function useCreateMadeToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      o: Omit<MadeToOrder, "id" | "createdAt" | "productionStatus">,
    ) => {
      const items = lsGet<any>("legacy_mto", []);
      const newItem = {
        ...o,
        id: Date.now().toString(),
        productionStatus: "Queued" as ProductionStatus,
        createdAt: new Date().toISOString(),
      };
      lsSet("legacy_mto", [...items, newItem]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mto"] }),
  });
}

export function useUpdateProductionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: bigint;
      newStatus: ProductionStatus;
    }) => {
      const items = lsGet<any>("legacy_mto", []);
      lsSet(
        "legacy_mto",
        items.map((i: any) =>
          i.id === id.toString() ? { ...i, productionStatus: newStatus } : i,
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mto"] }),
  });
}

export function useDeleteMadeToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const items = lsGet<any>("legacy_mto", []);
      lsSet(
        "legacy_mto",
        items.filter((i: any) => i.id !== id.toString()),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mto"] }),
  });
}

// ── D2C Catalog ───────────────────────────────────────────────────────────────

export function useListD2CProducts() {
  return useQuery<any[]>({
    queryKey: ["d2c"],
    queryFn: async () => lsGet("legacy_d2c", []),
  });
}

export function useCreateD2CProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<any, "id">) => {
      const items = lsGet<any>("legacy_d2c", []);
      lsSet("legacy_d2c", [...items, { ...p, id: Date.now() }]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["d2c"] }),
  });
}

export function useUpdateD2CProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: any) => {
      const items = lsGet<any>("legacy_d2c", []);
      lsSet(
        "legacy_d2c",
        items.map((i: any) => (i.id === p.id ? p : i)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["d2c"] }),
  });
}

export function useDeleteD2CProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const items = lsGet<any>("legacy_d2c", []);
      lsSet(
        "legacy_d2c",
        items.filter((i: any) => i.id !== Number(id)),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["d2c"] }),
  });
}

// ── Subscription Plans ────────────────────────────────────────────────────────

export function useListSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["plans"],
    queryFn: async () => {
      const raw = lsGet<any>("legacy_plans", []);
      return raw.map((r: any) => ({ ...r, id: BigInt(r.id ?? 0) }));
    },
  });
}

export function useCreateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      p: Omit<SubscriptionPlan, "id"> & { billingCycle: BillingCycle },
    ) => {
      const items = lsGet<any>("legacy_plans", []);
      lsSet("legacy_plans", [
        ...items,
        { ...p, id: Date.now().toString(), isActive: true },
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useUpdateSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: SubscriptionPlan) => {
      const items = lsGet<any>("legacy_plans", []);
      lsSet(
        "legacy_plans",
        items.map((i: any) =>
          i.id === p.id.toString() ? { ...p, id: p.id.toString() } : i,
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

export function useDeleteSubscriptionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const items = lsGet<any>("legacy_plans", []);
      lsSet(
        "legacy_plans",
        items.filter((i: any) => i.id !== id.toString()),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plans"] }),
  });
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export function useListSubscribers() {
  return useQuery<Subscriber[]>({
    queryKey: ["subscribers"],
    queryFn: async () => {
      const raw = lsGet<any>("legacy_subscribers", []);
      return raw.map((r: any) => ({
        ...r,
        id: BigInt(r.id ?? 0),
        planId: BigInt(r.planId ?? 0),
      }));
    },
  });
}

export function useCreateSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Omit<Subscriber, "id" | "status">) => {
      const items = lsGet<any>("legacy_subscribers", []);
      lsSet("legacy_subscribers", [
        ...items,
        {
          ...s,
          id: Date.now().toString(),
          planId: s.planId.toString(),
          status: "Active" as SubscriberStatus,
        },
      ]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });
}

export function useUpdateSubscriberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newStatus,
    }: {
      id: bigint;
      newStatus: SubscriberStatus;
    }) => {
      const items = lsGet<any>("legacy_subscribers", []);
      lsSet(
        "legacy_subscribers",
        items.map((i: any) =>
          i.id === id.toString() ? { ...i, status: newStatus } : i,
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });
}

export function useDeleteSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      const items = lsGet<any>("legacy_subscribers", []);
      lsSet(
        "legacy_subscribers",
        items.filter((i: any) => i.id !== id.toString()),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscribers"] }),
  });
}
