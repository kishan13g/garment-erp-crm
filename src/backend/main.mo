import Map "mo:core/Map";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Nat "mo:core/Nat";



actor {
  // Reuse existing types from original system
  type PatternPiece = {
    name : Text;
    instructions : Text;
    cutOnFold : Bool;
  };

  module PatternPiece {
    public func compare(piece1 : PatternPiece, piece2 : PatternPiece) : Order.Order {
      Text.compare(piece1.name, piece2.name);
    };
  };

  type GarmentType = {
    name : Text;
    description : Text;
    patternPieces : [PatternPiece];
  };

  module GarmentType {
    public func compareByName(garment1 : GarmentType, garment2 : GarmentType) : Order.Order {
      Text.compare(garment1.name, garment2.name);
    };
  };

  type Measurements = {
    bust : Float;
    waist : Float;
    hip : Float;
    length : Float;
  };

  type Customer = {
    id : Text;
    name : Text;
    phone : Text;
    bust : Float;
    waist : Float;
    hip : Float;
    length : Float;
    createdAt : Int;
  };

  type Order = {
    id : Text;
    customerName : Text;
    garmentName : Text;
    bust : Float;
    waist : Float;
    hip : Float;
    length : Float;
    status : Text; // "Pending", "In Progress", "Completed", "Delivered"
    notes : Text;
    createdAt : Int;
  };

  type ProductionStatus = {
    #Queued;
    #Cutting;
    #Stitching;
    #QualityCheck;
    #Ready;
  };

  type OrderPriority = {
    #High;
    #Normal;
    #Low;
  };

  type MadeToOrder = {
    id : Nat;
    customerName : Text;
    garmentName : Text;
    measurements : Measurements;
    priority : OrderPriority;
    deliveryDeadline : Text;
    productionStatus : ProductionStatus;
    notes : Text;
    createdAt : Int;
  };

  type D2CProduct = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    fabricType : Text;
    sizesAvailable : [Text];
    inStock : Bool;
    createdAt : Int;
  };

  type BillingCycle = {
    #Monthly;
    #Quarterly;
    #Yearly;
  };

  type SubscriptionPlan = {
    id : Nat;
    name : Text;
    description : Text;
    price : Float;
    billingCycle : BillingCycle;
    includedServices : [Text];
    isActive : Bool;
    createdAt : Int;
  };

  type SubscriberStatus = {
    #Active;
    #Paused;
    #Cancelled;
  };

  type Subscriber = {
    id : Nat;
    name : Text;
    phone : Text;
    planId : Nat;
    planName : Text;
    startDate : Text;
    status : SubscriberStatus;
    createdAt : Int;
  };

  // Karni specific types
  type CompanyProfile = {
    name : Text;
    address : Text;
    gstNumber : Text;
    phone : Text;
    email : Text;
    bankDetails : Text;
  };

  type Photo = {
    id : Nat;
    photoLabel : Text;
    category : Text;
    date : Int;
  };

  type Design = {
    id : Nat;
    number : Text;
    name : Text;
    category : Text;
    season : Text;
    fabricType : Text;
    description : Text;
  };

  type FabricPurchase = {
    id : Nat;
    vendor : Text;
    fabricType : Text;
    color : Text;
    meters : Float;
    rate : Float;
    amount : Float;
    invoiceNumber : Text;
    date : Int;
  };

  type FabricStock = {
    fabricType : Text;
    color : Text;
    totalMeters : Float;
    issuedMeters : Float;
    availableMeters : Float;
  };

  type FabricIssue = {
    id : Nat;
    fabricType : Text;
    meters : Float;
    issuedTo : Text;
    date : Int;
  };

  type JobStatus = {
    #Pending;
    #InProgress;
    #Completed;
  };

  type Job = {
    id : Nat;
    jobNumber : Text;
    style : Text;
    partyName : Text;
    fabricLot : Text;
    quantity : Int;
    rate : Float;
    amount : Float;
    karigarName : Text;
    status : JobStatus;
    date : Int;
  };

  type QualityCheck = {
    id : Nat;
    jobReference : Text;
    jobType : Text;
    inspector : Text;
    passCount : Int;
    failCount : Int;
    remarks : Text;
    date : Int;
  };

  type Dispatch = {
    id : Nat;
    style : Text;
    buyerName : Text;
    quantity : Int;
    transportName : Text;
    trackingNumber : Text;
    status : Text;
    date : Int;
  };

  type LedgerEntryType = {
    #Debit;
    #Credit;
  };

  type LedgerEntry = {
    id : Nat;
    entryType : LedgerEntryType;
    category : Text;
    amount : Float;
    description : Text;
    date : Int;
  };

  type KarigarLedgerEntry = {
    id : Nat;
    karigarName : Text;
    entries : [LedgerEntry];
    balance : Float;
  };

  type GSTBill = {
    id : Nat;
    billNumber : Text;
    buyerName : Text;
    buyerGST : Text;
    date : Int;
    lineItems : [BillLineItem];
    total : Float;
  };

  type BillLineItem = {
    description : Text;
    qty : Int;
    rate : Float;
    gstPercentage : Float;
  };

  type Challan = {
    id : Nat;
    challanNumber : Text;
    jobType : Text;
    partyName : Text;
    items : [ChallanItem];
    date : Int;
  };

  type ChallanItem = {
    description : Text;
    qty : Int;
  };

  type ProductionStage = {
    stageName : Text;
    assignedKarigar : Text;
    targetQuantity : Int;
    completionDate : Int;
  };

  type ProductionPlan = {
    id : Nat;
    styleName : Text;
    totalQuantity : Int;
    deliveryDate : Int;
    stages : [ProductionStage];
  };

  var nextPhotoId = 0;
  var nextDesignId = 0;
  var nextFabricPurchaseId = 0;
  var nextFabricIssueId = 0;
  var nextJobId = 0;
  var nextQualityCheckId = 0;
  var nextDispatchId = 0;
  var nextLedgerEntryId = 0;
  var nextKarigarLedgerId = 0;
  var nextGSTBillId = 0;
  var nextChallanId = 0;
  var nextProductionPlanId = 0;

  let garments = Map.empty<Text, GarmentType>();
  let customers = Map.empty<Text, Customer>();
  let orders = Map.empty<Text, Order>();
  let madeToOrderQueue = Map.empty<Nat, MadeToOrder>();
  let d2cCatalog = Map.empty<Nat, D2CProduct>();
  let subscriptionPlans = Map.empty<Nat, SubscriptionPlan>();
  let subscribers = Map.empty<Nat, Subscriber>();

  // Karni specific maps
  var companyProfile : ?CompanyProfile = null;
  let photos = Map.empty<Nat, Photo>();
  let designs = Map.empty<Nat, Design>();
  let fabricPurchases = Map.empty<Nat, FabricPurchase>();
  let fabricStocks = Map.empty<Text, FabricStock>();
  let fabricIssues = Map.empty<Nat, FabricIssue>();
  let allJobs = Map.empty<Nat, Job>();
  let qualityChecks = Map.empty<Nat, QualityCheck>();
  let dispatches = Map.empty<Nat, Dispatch>();
  let karigarLedgers = Map.empty<Nat, KarigarLedgerEntry>();
  let accountLedger = Map.empty<Nat, LedgerEntry>();
  let gstBills = Map.empty<Nat, GSTBill>();
  let challans = Map.empty<Nat, Challan>();
  let productionPlans = Map.empty<Nat, ProductionPlan>();

  // Company Profile methods
  public shared ({ caller }) func updateCompanyProfile(name : Text, address : Text, gstNumber : Text, phone : Text, email : Text, bankDetails : Text) : async () {
    companyProfile := ?{
      name;
      address;
      gstNumber;
      phone;
      email;
      bankDetails;
    };
  };

  public query ({ caller }) func getCompanyProfile() : async ?CompanyProfile {
    companyProfile;
  };

  // Photo Master methods
  public shared ({ caller }) func addPhoto(photoLabel : Text, category : Text, date : Int) : async Nat {
    let id = nextPhotoId;
    nextPhotoId += 1;

    let photo : Photo = {
      id;
      photoLabel;
      category;
      date;
    };

    photos.add(id, photo);
    id;
  };

  public query ({ caller }) func getPhoto(id : Nat) : async ?Photo {
    photos.get(id);
  };

  public query ({ caller }) func listPhotos() : async [Photo] {
    photos.values().toArray();
  };

  // Design Register methods
  public shared ({ caller }) func addDesign(number : Text, name : Text, category : Text, season : Text, fabricType : Text, description : Text) : async Nat {
    let id = nextDesignId;
    nextDesignId += 1;

    let design : Design = {
      id;
      number;
      name;
      category;
      season;
      fabricType;
      description;
    };

    designs.add(id, design);
    id;
  };

  public query ({ caller }) func getDesign(id : Nat) : async ?Design {
    designs.get(id);
  };

  public query ({ caller }) func listDesigns() : async [Design] {
    designs.values().toArray();
  };

  // Fabric Purchase & Stock methods
  public shared ({ caller }) func addFabricPurchase(vendor : Text, fabricType : Text, color : Text, meters : Float, rate : Float, amount : Float, invoiceNumber : Text, date : Int) : async Nat {
    let id = nextFabricPurchaseId;
    nextFabricPurchaseId += 1;

    let purchase : FabricPurchase = {
      id;
      vendor;
      fabricType;
      color;
      meters;
      rate;
      amount;
      invoiceNumber;
      date;
    };

    fabricPurchases.add(id, purchase);

    switch (fabricStocks.get(fabricType)) {
      case (null) {
        let newStock : FabricStock = {
          fabricType;
          color;
          totalMeters = meters;
          issuedMeters = 0.0;
          availableMeters = meters;
        };
        fabricStocks.add(fabricType, newStock);
      };
      case (?stock) {
        let updatedStock : FabricStock = {
          stock with
          totalMeters = stock.totalMeters + meters;
          availableMeters = stock.availableMeters + meters;
        };
        fabricStocks.add(fabricType, updatedStock);
      };
    };
    id;
  };

  public query ({ caller }) func getFabricPurchase(id : Nat) : async ?FabricPurchase {
    fabricPurchases.get(id);
  };

  public query ({ caller }) func listFabricPurchases() : async [FabricPurchase] {
    fabricPurchases.values().toArray();
  };

  public query ({ caller }) func getFabricStock(fabricType : Text) : async ?FabricStock {
    fabricStocks.get(fabricType);
  };

  public query ({ caller }) func listFabricStocks() : async [FabricStock] {
    fabricStocks.values().toArray();
  };

  // Fabric Issue methods
  public shared ({ caller }) func issueFabric(fabricType : Text, meters : Float, issuedTo : Text, date : Int) : async Nat {
    let id = nextFabricIssueId;
    nextFabricIssueId += 1;

    let issue : FabricIssue = {
      id;
      fabricType;
      meters;
      issuedTo;
      date;
    };

    fabricIssues.add(id, issue);

    switch (fabricStocks.get(fabricType)) {
      case (null) { Runtime.trap("Fabric not found in stock") };
      case (?stock) {
        if (stock.availableMeters < meters) {
          Runtime.trap("Not enough fabric in stock");
        };
        let updatedStock : FabricStock = {
          stock with
          issuedMeters = stock.issuedMeters + meters;
          availableMeters = stock.availableMeters - meters;
        };
        fabricStocks.add(fabricType, updatedStock);
      };
    };
    id;
  };

  public query ({ caller }) func getFabricIssue(id : Nat) : async ?FabricIssue {
    fabricIssues.get(id);
  };

  public query ({ caller }) func listFabricIssues() : async [FabricIssue] {
    fabricIssues.values().toArray();
  };

  // Job methods
  public shared ({ caller }) func addJob(jobNumber : Text, style : Text, partyName : Text, fabricLot : Text, quantity : Int, rate : Float, amount : Float, karigarName : Text, status : JobStatus, date : Int) : async Nat {
    let id = nextJobId;
    nextJobId += 1;

    let job : Job = {
      id;
      jobNumber;
      style;
      partyName;
      fabricLot;
      quantity;
      rate;
      amount;
      karigarName;
      status;
      date;
    };

    allJobs.add(id, job);
    id;
  };

  public query ({ caller }) func getJob(id : Nat) : async ?Job {
    allJobs.get(id);
  };

  public query ({ caller }) func listJobs() : async [Job] {
    allJobs.values().toArray();
  };

  // Quality Check methods
  public shared ({ caller }) func addQualityCheck(jobReference : Text, jobType : Text, inspector : Text, passCount : Int, failCount : Int, remarks : Text, date : Int) : async Nat {
    let id = nextQualityCheckId;
    nextQualityCheckId += 1;

    let check : QualityCheck = {
      id;
      jobReference;
      jobType;
      inspector;
      passCount;
      failCount;
      remarks;
      date;
    };

    qualityChecks.add(id, check);
    id;
  };

  public query ({ caller }) func getQualityCheck(id : Nat) : async ?QualityCheck {
    qualityChecks.get(id);
  };

  public query ({ caller }) func listQualityChecks() : async [QualityCheck] {
    qualityChecks.values().toArray();
  };

  // Dispatch methods
  public shared ({ caller }) func addDispatch(style : Text, buyerName : Text, quantity : Int, transportName : Text, trackingNumber : Text, status : Text, date : Int) : async Nat {
    let id = nextDispatchId;
    nextDispatchId += 1;

    let dispatch : Dispatch = {
      id;
      style;
      buyerName;
      quantity;
      transportName;
      trackingNumber;
      status;
      date;
    };

    dispatches.add(id, dispatch);
    id;
  };

  public query ({ caller }) func getDispatch(id : Nat) : async ?Dispatch {
    dispatches.get(id);
  };

  public query ({ caller }) func listDispatches() : async [Dispatch] {
    dispatches.values().toArray();
  };

  // Karigar Ledger methods
  public shared ({ caller }) func addKarigarLedgerEntry(karigarName : Text, entries : [LedgerEntry], balance : Float) : async Nat {
    let id = nextKarigarLedgerId;
    nextKarigarLedgerId += 1;

    let ledgerEntry : KarigarLedgerEntry = {
      id;
      karigarName;
      entries;
      balance;
    };

    karigarLedgers.add(id, ledgerEntry);
    id;
  };

  public query ({ caller }) func getKarigarLedger(id : Nat) : async ?KarigarLedgerEntry {
    karigarLedgers.get(id);
  };

  public query ({ caller }) func listKarigarLedgers() : async [KarigarLedgerEntry] {
    karigarLedgers.values().toArray();
  };

  // Account Ledger methods
  public shared ({ caller }) func addAccountLedgerEntry(entryType : LedgerEntryType, category : Text, amount : Float, description : Text, date : Int) : async Nat {
    let id = nextLedgerEntryId;
    nextLedgerEntryId += 1;

    let entry : LedgerEntry = {
      id;
      entryType;
      category;
      amount;
      description;
      date;
    };

    accountLedger.add(id, entry);
    id;
  };

  public query ({ caller }) func getAccountLedgerEntry(id : Nat) : async ?LedgerEntry {
    accountLedger.get(id);
  };

  public query ({ caller }) func listAccountLedgerEntries() : async [LedgerEntry] {
    accountLedger.values().toArray();
  };

  // GST Bill methods
  public shared ({ caller }) func addGSTBill(billNumber : Text, buyerName : Text, buyerGST : Text, date : Int, lineItems : [BillLineItem], total : Float) : async Nat {
    let id = nextGSTBillId;
    nextGSTBillId += 1;

    let bill : GSTBill = {
      id;
      billNumber;
      buyerName;
      buyerGST;
      date;
      lineItems;
      total;
    };

    gstBills.add(id, bill);
    id;
  };

  public query ({ caller }) func getGSTBill(id : Nat) : async ?GSTBill {
    gstBills.get(id);
  };

  public query ({ caller }) func listGSTBills() : async [GSTBill] {
    gstBills.values().toArray();
  };

  // Challan methods
  public shared ({ caller }) func addChallan(challanNumber : Text, jobType : Text, partyName : Text, items : [ChallanItem], date : Int) : async Nat {
    let id = nextChallanId;
    nextChallanId += 1;

    let challan : Challan = {
      id;
      challanNumber;
      jobType;
      partyName;
      items;
      date;
    };

    challans.add(id, challan);
    id;
  };

  public query ({ caller }) func getChallan(id : Nat) : async ?Challan {
    challans.get(id);
  };

  public query ({ caller }) func listChallans() : async [Challan] {
    challans.values().toArray();
  };

  // Production Plan methods
  public shared ({ caller }) func addProductionPlan(styleName : Text, totalQuantity : Int, deliveryDate : Int, stages : [ProductionStage]) : async Nat {
    let id = nextProductionPlanId;
    nextProductionPlanId += 1;

    let plan : ProductionPlan = {
      id;
      styleName;
      totalQuantity;
      deliveryDate;
      stages;
    };

    productionPlans.add(id, plan);
    id;
  };

  public query ({ caller }) func getProductionPlan(id : Nat) : async ?ProductionPlan {
    productionPlans.get(id);
  };

  public query ({ caller }) func listProductionPlans() : async [ProductionPlan] {
    productionPlans.values().toArray();
  };
};
