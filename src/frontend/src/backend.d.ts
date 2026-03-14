import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Photo {
    id: bigint;
    date: bigint;
    category: string;
    photoLabel: string;
}
export interface CompanyProfile {
    bankDetails: string;
    gstNumber: string;
    name: string;
    email: string;
    address: string;
    phone: string;
}
export interface ProductionPlan {
    id: bigint;
    stages: Array<ProductionStage>;
    deliveryDate: bigint;
    styleName: string;
    totalQuantity: bigint;
}
export interface FabricIssue {
    id: bigint;
    meters: number;
    fabricType: string;
    date: bigint;
    issuedTo: string;
}
export interface LedgerEntry {
    id: bigint;
    entryType: LedgerEntryType;
    date: bigint;
    description: string;
    category: string;
    amount: number;
}
export interface FabricPurchase {
    id: bigint;
    meters: number;
    fabricType: string;
    date: bigint;
    color: string;
    rate: number;
    invoiceNumber: string;
    vendor: string;
    amount: number;
}
export interface Design {
    id: bigint;
    fabricType: string;
    name: string;
    description: string;
    season: string;
    number: string;
    category: string;
}
export interface QualityCheck {
    id: bigint;
    jobType: string;
    date: bigint;
    passCount: bigint;
    jobReference: string;
    failCount: bigint;
    remarks: string;
    inspector: string;
}
export interface KarigarLedgerEntry {
    id: bigint;
    balance: number;
    entries: Array<LedgerEntry>;
    karigarName: string;
}
export interface ProductionStage {
    completionDate: bigint;
    assignedKarigar: string;
    targetQuantity: bigint;
    stageName: string;
}
export interface Job {
    id: bigint;
    status: JobStatus;
    date: bigint;
    rate: number;
    karigarName: string;
    style: string;
    quantity: bigint;
    partyName: string;
    amount: number;
    jobNumber: string;
    fabricLot: string;
}
export interface GSTBill {
    id: bigint;
    lineItems: Array<BillLineItem>;
    total: number;
    date: bigint;
    billNumber: string;
    buyerGST: string;
    buyerName: string;
}
export interface Challan {
    id: bigint;
    challanNumber: string;
    jobType: string;
    date: bigint;
    partyName: string;
    items: Array<ChallanItem>;
}
export interface BillLineItem {
    qty: bigint;
    rate: number;
    description: string;
    gstPercentage: number;
}
export interface FabricStock {
    fabricType: string;
    color: string;
    availableMeters: number;
    issuedMeters: number;
    totalMeters: number;
}
export interface Dispatch {
    id: bigint;
    status: string;
    trackingNumber: string;
    date: bigint;
    style: string;
    quantity: bigint;
    transportName: string;
    buyerName: string;
}
export interface ChallanItem {
    qty: bigint;
    description: string;
}
export enum JobStatus {
    InProgress = "InProgress",
    Completed = "Completed",
    Pending = "Pending"
}
export enum LedgerEntryType {
    Debit = "Debit",
    Credit = "Credit"
}
export interface backendInterface {
    addAccountLedgerEntry(entryType: LedgerEntryType, category: string, amount: number, description: string, date: bigint): Promise<bigint>;
    addChallan(challanNumber: string, jobType: string, partyName: string, items: Array<ChallanItem>, date: bigint): Promise<bigint>;
    addDesign(number: string, name: string, category: string, season: string, fabricType: string, description: string): Promise<bigint>;
    addDispatch(style: string, buyerName: string, quantity: bigint, transportName: string, trackingNumber: string, status: string, date: bigint): Promise<bigint>;
    addFabricPurchase(vendor: string, fabricType: string, color: string, meters: number, rate: number, amount: number, invoiceNumber: string, date: bigint): Promise<bigint>;
    addGSTBill(billNumber: string, buyerName: string, buyerGST: string, date: bigint, lineItems: Array<BillLineItem>, total: number): Promise<bigint>;
    addJob(jobNumber: string, style: string, partyName: string, fabricLot: string, quantity: bigint, rate: number, amount: number, karigarName: string, status: JobStatus, date: bigint): Promise<bigint>;
    addKarigarLedgerEntry(karigarName: string, entries: Array<LedgerEntry>, balance: number): Promise<bigint>;
    addPhoto(photoLabel: string, category: string, date: bigint): Promise<bigint>;
    addProductionPlan(styleName: string, totalQuantity: bigint, deliveryDate: bigint, stages: Array<ProductionStage>): Promise<bigint>;
    addQualityCheck(jobReference: string, jobType: string, inspector: string, passCount: bigint, failCount: bigint, remarks: string, date: bigint): Promise<bigint>;
    getAccountLedgerEntry(id: bigint): Promise<LedgerEntry | null>;
    getChallan(id: bigint): Promise<Challan | null>;
    getCompanyProfile(): Promise<CompanyProfile | null>;
    getDesign(id: bigint): Promise<Design | null>;
    getDispatch(id: bigint): Promise<Dispatch | null>;
    getFabricIssue(id: bigint): Promise<FabricIssue | null>;
    getFabricPurchase(id: bigint): Promise<FabricPurchase | null>;
    getFabricStock(fabricType: string): Promise<FabricStock | null>;
    getGSTBill(id: bigint): Promise<GSTBill | null>;
    getJob(id: bigint): Promise<Job | null>;
    getKarigarLedger(id: bigint): Promise<KarigarLedgerEntry | null>;
    getPhoto(id: bigint): Promise<Photo | null>;
    getProductionPlan(id: bigint): Promise<ProductionPlan | null>;
    getQualityCheck(id: bigint): Promise<QualityCheck | null>;
    issueFabric(fabricType: string, meters: number, issuedTo: string, date: bigint): Promise<bigint>;
    listAccountLedgerEntries(): Promise<Array<LedgerEntry>>;
    listChallans(): Promise<Array<Challan>>;
    listDesigns(): Promise<Array<Design>>;
    listDispatches(): Promise<Array<Dispatch>>;
    listFabricIssues(): Promise<Array<FabricIssue>>;
    listFabricPurchases(): Promise<Array<FabricPurchase>>;
    listFabricStocks(): Promise<Array<FabricStock>>;
    listGSTBills(): Promise<Array<GSTBill>>;
    listJobs(): Promise<Array<Job>>;
    listKarigarLedgers(): Promise<Array<KarigarLedgerEntry>>;
    listPhotos(): Promise<Array<Photo>>;
    listProductionPlans(): Promise<Array<ProductionPlan>>;
    listQualityChecks(): Promise<Array<QualityCheck>>;
    updateCompanyProfile(name: string, address: string, gstNumber: string, phone: string, email: string, bankDetails: string): Promise<void>;
}
