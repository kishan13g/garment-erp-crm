// Legacy types for old components (kept for backwards compatibility)
// These were previously in backend.d.ts but no longer exist in the new ERP backend

export interface Measurements {
  bust: number;
  waist: number;
  hip: number;
  length: number;
}

export interface PatternPiece {
  name: string;
  cutOnFold?: boolean;
  instructions?: string;
}

export interface GarmentType {
  name: string;
  description: string;
  patternPieces: PatternPiece[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  bust: number;
  waist: number;
  hip: number;
  length: number;
}

export interface Order {
  id: string;
  customerName: string;
  garmentName: string;
  status: string;
  createdAt: number;
  bust: number;
  waist: number;
  hip: number;
  length: number;
  notes: string;
}

export enum OrderPriority {
  Low = "Low",
  Normal = "Normal",
  High = "High",
}

export enum ProductionStatus {
  Queued = "Queued",
  Cutting = "Cutting",
  Stitching = "Stitching",
  QualityCheck = "QualityCheck",
  Ready = "Ready",
}

export interface MadeToOrder {
  id: bigint;
  customerName: string;
  garmentName: string;
  measurements: Measurements;
  priority: OrderPriority;
  productionStatus: ProductionStatus;
  deliveryDeadline: string;
  notes: string;
  createdAt: string;
}

export interface D2CProduct {
  id: bigint;
  name: string;
  description: string;
  price: number;
  fabricType: string;
  sizesAvailable: string[];
  inStock: boolean;
}

export enum BillingCycle {
  Monthly = "Monthly",
  Quarterly = "Quarterly",
  Yearly = "Yearly",
}

export enum SubscriberStatus {
  Active = "Active",
  Paused = "Paused",
  Cancelled = "Cancelled",
}

export interface SubscriptionPlan {
  id: bigint;
  name: string;
  description: string;
  price: number;
  billingCycle: BillingCycle;
  includedServices: string[];
  isActive?: boolean;
}

export interface Subscriber {
  id: bigint;
  name: string;
  phone: string;
  planId: bigint;
  planName: string;
  startDate: string;
  status: SubscriberStatus;
}
