import { useCallback, useEffect, useState } from "react";
import type {
  Challan,
  CompanyProfile,
  Design,
  Dispatch,
  FabricIssue,
  FabricPurchase,
  FabricStock,
  GSTBill,
  Job,
  KarigarLedgerEntry,
  LedgerEntry,
  ProductionPlan,
  QualityCheck,
} from "./backend.d";
import { JobStatus, LedgerEntryType } from "./backend.d";
import { useBackend } from "./backendContext";

// ---- Types ----
type Module =
  | "dashboard"
  | "company"
  | "photo"
  | "design"
  | "karigar-master"
  | "fabric-purchase"
  | "fabric-stock"
  | "fabric-issue"
  | "marker"
  | "production-plan"
  | "dyeing"
  | "print"
  | "embroidery"
  | "handwork"
  | "cutting"
  | "stitching"
  | "quality"
  | "pressing"
  | "packing"
  | "dispatch"
  | "gst-bill"
  | "karigar-ledger"
  | "account-ledger"
  | "pl-account"
  | "pattern-ai"
  | "fabric-ai"
  | "social"
  | "challan-list";

interface KarigarLocal {
  id: string;
  name: string;
  phone: string;
  specialization: string;
  rate: number;
}
interface PhotoLocal {
  id: string;
  label: string;
  category: string;
  date: string;
}
interface MarkerLocal {
  id: string;
  markerNo: string;
  design: string;
  fabricWidth: number;
  layLength: number;
  plies: number;
  date: string;
}

const NAV_GROUPS = [
  {
    label: "DASHBOARD",
    items: [{ id: "dashboard", label: "Dashboard", icon: "📊" }],
  },
  {
    label: "MASTERS",
    items: [
      { id: "company", label: "KARNI IMPEX", icon: "🏢" },
      { id: "photo", label: "Photo Master", icon: "📷" },
      { id: "design", label: "Design Register", icon: "🎨" },
      { id: "karigar-master", label: "Karigar Master", icon: "👷" },
    ],
  },
  {
    label: "FABRIC",
    items: [
      { id: "fabric-purchase", label: "Fabric Purchase", icon: "🛒" },
      { id: "fabric-stock", label: "Fabric Stock", icon: "📦" },
      { id: "fabric-issue", label: "Fabric Issue", icon: "📤" },
      { id: "marker", label: "Marker Planning", icon: "📐" },
    ],
  },
  {
    label: "PRODUCTION",
    items: [
      { id: "production-plan", label: "Production Plan", icon: "📋" },
      { id: "dyeing", label: "Dyeing Job", icon: "🎨" },
      { id: "print", label: "Print Job", icon: "🖨️" },
      { id: "embroidery", label: "Embroidery Job", icon: "🧵" },
      { id: "handwork", label: "Handwork Job", icon: "✋" },
      { id: "cutting", label: "Cutting Job", icon: "✂️" },
      { id: "stitching", label: "Stitching Job", icon: "🧷" },
      { id: "quality", label: "Quality Check", icon: "✅" },
      { id: "pressing", label: "Pressing", icon: "🌡️" },
      { id: "packing", label: "Packing", icon: "📫" },
      { id: "dispatch", label: "Dispatch", icon: "🚚" },
    ],
  },
  {
    label: "ACCOUNTS",
    items: [
      { id: "gst-bill", label: "GST Bill", icon: "🧾" },
      { id: "challan-list", label: "Challans", icon: "📄" },
      { id: "karigar-ledger", label: "Karigar Ledger", icon: "📒" },
      { id: "account-ledger", label: "Account Ledger", icon: "📖" },
      { id: "pl-account", label: "P/L Account", icon: "💰" },
    ],
  },
  {
    label: "AI TOOLS",
    items: [
      { id: "pattern-ai", label: "Pattern Planning AI", icon: "🤖" },
      { id: "fabric-ai", label: "Fabric Consumption AI", icon: "🧮" },
    ],
  },
  {
    label: "OTHER",
    items: [{ id: "social", label: "Social Media", icon: "📱" }],
  },
];

const fmtDate = (ts: bigint) =>
  new Date(Number(ts)).toLocaleDateString("en-IN");
const fmtAmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
const today = () => BigInt(Date.now());
const todayStr = () => new Date().toISOString().slice(0, 10);

// ---- Print CSS ----
const PRINT_STYLE =
  "@media print { body * { visibility: hidden; } .printable, .printable * { visibility: visible; } .printable { position: fixed; top: 0; left: 0; width: 100%; } }";

function injectPrintStyle() {
  if (!document.getElementById("print-style")) {
    const s = document.createElement("style");
    s.id = "print-style";
    s.textContent = PRINT_STYLE;
    document.head.appendChild(s);
  }
}

function printElement(id: string) {
  injectPrintStyle();
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("printable");
    window.print();
    el.classList.remove("printable");
  }
}

// ---- Challan Modal ----
function ChallanModal({
  challan,
  company,
  onClose,
}: { challan: Challan; company: CompanyProfile | null; onClose: () => void }) {
  const pid = `challan-print-${challan.id}`;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div id={pid} className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">
              {company?.name || "KARNI IMPEX"}
            </h2>
            <p className="text-sm text-gray-600">{company?.address}</p>
            <p className="text-sm text-gray-600">
              GST: {company?.gstNumber} | {company?.phone}
            </p>
          </div>
          <div className="border-t border-b border-gray-800 py-2 mb-4 text-center">
            <h3 className="font-bold text-lg">DELIVERY CHALLAN</h3>
          </div>
          <div className="flex justify-between mb-4 text-sm">
            <div>
              <strong>Challan No:</strong> {challan.challanNumber}
            </div>
            <div>
              <strong>Date:</strong> {fmtDate(challan.date)}
            </div>
          </div>
          <div className="mb-4 text-sm">
            <strong>To:</strong> {challan.partyName}
            <br />
            <strong>Job Type:</strong> {challan.jobType}
          </div>
          <table className="w-full border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-2 text-left">#</th>
                <th className="border border-gray-400 p-2 text-left">
                  Description
                </th>
                <th className="border border-gray-400 p-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, i) => (
                <tr key={`${item.description}-${i}`}>
                  <td className="border border-gray-400 p-2">{i + 1}</td>
                  <td className="border border-gray-400 p-2">
                    {item.description}
                  </td>
                  <td className="border border-gray-400 p-2 text-right">
                    {item.qty.toString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-6 text-sm">
            <p>
              <strong>Receiver Signature:</strong> _______________________
            </p>
          </div>
        </div>
        <div className="flex gap-2 p-4 border-t no-print">
          <button
            type="button"
            data-ocid="challan.print_button"
            onClick={() => printElement(pid)}
            className="btn-primary"
          >
            🖨️ Print Challan
          </button>
          <button
            type="button"
            data-ocid="challan.close_button"
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Generic Job Module ----
function JobModule({
  jobTypeLabel,
  prefix,
  company,
  karigars,
}: {
  jobTypeLabel: string;
  prefix: string;
  company: CompanyProfile | null;
  karigars: KarigarLocal[];
}) {
  const backend = useBackend();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [form, setForm] = useState({
    jobNumber: "",
    style: "",
    partyName: "",
    fabricLot: "",
    quantity: "",
    rate: "",
    karigarName: "",
    status: "Pending",
    date: todayStr(),
  });
  const [viewChallan, setViewChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend
      .listJobs()
      .then((all) =>
        setJobs(all.filter((j) => j.jobNumber.startsWith(`${prefix}-`))),
      );
    backend.listChallans().then(setChallans);
    // auto-generate job number
    backend.listJobs().then((all) => {
      const cnt =
        all.filter((j) => j.jobNumber.startsWith(`${prefix}-`)).length + 1;
      setForm((f) => ({
        ...f,
        jobNumber: `${prefix}-${String(cnt).padStart(3, "0")}`,
      }));
    });
  }, [prefix]);

  const save = async () => {
    if (!form.style || !form.partyName) return;
    setLoading(true);
    const amt =
      Number.parseFloat(form.rate) * Number.parseInt(form.quantity || "0");
    const statusMap: Record<string, JobStatus> = {
      Pending: JobStatus.Pending,
      InProgress: JobStatus.InProgress,
      Completed: JobStatus.Completed,
    };
    const _jobId = await backend.addJob(
      form.jobNumber,
      form.style,
      form.partyName,
      form.fabricLot,
      BigInt(form.quantity || "0"),
      Number.parseFloat(form.rate || "0"),
      amt,
      form.karigarName,
      statusMap[form.status] || JobStatus.Pending,
      today(),
    );
    // Create challan
    const challanNo = `CH-${form.jobNumber}`;
    await backend.addChallan(
      challanNo,
      jobTypeLabel,
      form.partyName,
      [
        {
          description: `${jobTypeLabel} - ${form.style}`,
          qty: BigInt(form.quantity || "0"),
        },
      ],
      today(),
    );
    const [updatedJobs, updatedChallans] = await Promise.all([
      backend.listJobs(),
      backend.listChallans(),
    ]);
    setJobs(updatedJobs.filter((j) => j.jobNumber.startsWith(`${prefix}-`)));
    setChallans(updatedChallans);
    const cnt =
      updatedJobs.filter((j) => j.jobNumber.startsWith(`${prefix}-`)).length +
      1;
    setForm({
      jobNumber: `${prefix}-${String(cnt).padStart(3, "0")}`,
      style: "",
      partyName: "",
      fabricLot: "",
      quantity: "",
      rate: "",
      karigarName: "",
      status: "Pending",
      date: todayStr(),
    });
    setLoading(false);
  };

  const getChallan = (jobNum: string) =>
    challans.find((c) => c.challanNumber === `CH-${jobNum}`);

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">New {jobTypeLabel} Job</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="job-jobno" className="label">
              Job Number
            </label>
            <input
              id="job-jobno"
              data-ocid={`${prefix}.jobno.input`}
              className="input"
              value={form.jobNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="job-style" className="label">
              Style / Design
            </label>
            <input
              id="job-style"
              data-ocid={`${prefix}.style.input`}
              className="input"
              value={form.style}
              onChange={(e) =>
                setForm((f) => ({ ...f, style: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="job-party" className="label">
              Party Name
            </label>
            <input
              id="job-party"
              data-ocid={`${prefix}.party.input`}
              className="input"
              value={form.partyName}
              onChange={(e) =>
                setForm((f) => ({ ...f, partyName: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="job-lot" className="label">
              Fabric Lot
            </label>
            <input
              id="job-lot"
              data-ocid={`${prefix}.lot.input`}
              className="input"
              value={form.fabricLot}
              onChange={(e) =>
                setForm((f) => ({ ...f, fabricLot: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="job-qty" className="label">
              Quantity (pcs)
            </label>
            <input
              id="job-qty"
              data-ocid={`${prefix}.qty.input`}
              type="number"
              className="input"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="job-rate" className="label">
              Rate per piece (₹)
            </label>
            <input
              id="job-rate"
              data-ocid={`${prefix}.rate.input`}
              type="number"
              className="input"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="job-karigar" className="label">
              Karigar
            </label>
            <select
              id="job-karigar"
              data-ocid={`${prefix}.karigar.select`}
              className="input"
              value={form.karigarName}
              onChange={(e) =>
                setForm((f) => ({ ...f, karigarName: e.target.value }))
              }
            >
              <option value="">Select Karigar</option>
              {karigars
                .filter(
                  (k) =>
                    k.specialization === jobTypeLabel ||
                    k.specialization === "General",
                )
                .map((k) => (
                  <option key={k.id} value={k.name}>
                    {k.name}
                  </option>
                ))}
              {karigars.length === 0 && (
                <option value="">-- Add karigars in Karigar Master --</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="job-status" className="label">
              Status
            </label>
            <select
              id="job-status"
              data-ocid={`${prefix}.status.select`}
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              <option>Pending</option>
              <option>InProgress</option>
              <option>Completed</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Amount: ₹
            {fmtAmt(
              Number.parseFloat(form.rate || "0") *
                Number.parseInt(form.quantity || "0"),
            )}
          </div>
          <button
            type="button"
            data-ocid={`${prefix}.save.primary_button`}
            onClick={save}
            disabled={loading}
            className="btn-primary ml-auto"
          >
            {loading ? "Saving..." : "Save Job & Create Challan"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">
          {jobTypeLabel} Jobs ({jobs.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Job No</th>
                <th className="th">Style</th>
                <th className="th">Party</th>
                <th className="th">Qty</th>
                <th className="th">Amount</th>
                <th className="th">Karigar</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr
                  key={j.id.toString()}
                  className="tr"
                  data-ocid={`${prefix}.job.item.${i + 1}`}
                >
                  <td className="td">{j.jobNumber}</td>
                  <td className="td">{j.style}</td>
                  <td className="td">{j.partyName}</td>
                  <td className="td">{j.quantity.toString()}</td>
                  <td className="td">₹{fmtAmt(j.amount)}</td>
                  <td className="td">{j.karigarName}</td>
                  <td className="td">
                    <span
                      className={`badge ${j.status === JobStatus.Completed ? "badge-green" : j.status === JobStatus.InProgress ? "badge-yellow" : "badge-gray"}`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="td">
                    {getChallan(j.jobNumber) && (
                      <button
                        type="button"
                        data-ocid={`${prefix}.challan_button.${i + 1}`}
                        onClick={() =>
                          setViewChallan(getChallan(j.jobNumber) ?? null)
                        }
                        className="btn-xs"
                      >
                        📄 Challan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="td text-center text-gray-400"
                    data-ocid={`${prefix}.empty_state`}
                  >
                    No jobs yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {viewChallan && (
        <ChallanModal
          challan={viewChallan}
          company={company}
          onClose={() => setViewChallan(null)}
        />
      )}
    </div>
  );
}

// ---- Dashboard ----
function Dashboard({ setModule }: { setModule: (m: Module) => void }) {
  const backend = useBackend();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [stocks, setStocks] = useState<FabricStock[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bills, setBills] = useState<GSTBill[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([
      backend.listDesigns(),
      backend.listFabricStocks(),
      backend.listJobs(),
      backend.listGSTBills(),
    ]).then(([d, s, j, b]) => {
      setDesigns(d);
      setStocks(s);
      setJobs(j);
      setBills(b);
    });
  }, []);

  const activeJobs = jobs.filter(
    (j) => j.status === JobStatus.InProgress,
  ).length;
  const lowStock = stocks.filter((s) => s.availableMeters < 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          className="card text-center cursor-pointer hover:shadow-md"
          onClick={() => setModule("design")}
          data-ocid="dashboard.design.card"
        >
          <div className="text-3xl font-bold text-blue-600">
            {designs.length}
          </div>
          <div className="text-sm text-gray-600">Total Designs</div>
        </button>
        <button
          type="button"
          className="card text-center cursor-pointer hover:shadow-md"
          onClick={() => setModule("fabric-stock")}
          data-ocid="dashboard.fabric.card"
        >
          <div className="text-3xl font-bold text-green-600">
            {stocks.reduce((a, s) => a + s.availableMeters, 0).toFixed(0)}m
          </div>
          <div className="text-sm text-gray-600">Fabric in Stock</div>
        </button>
        <button
          type="button"
          className="card text-center cursor-pointer hover:shadow-md"
          onClick={() => setModule("cutting")}
          data-ocid="dashboard.jobs.card"
        >
          <div className="text-3xl font-bold text-orange-600">{activeJobs}</div>
          <div className="text-sm text-gray-600">Active Jobs</div>
        </button>
        <button
          type="button"
          className="card text-center cursor-pointer hover:shadow-md"
          onClick={() => setModule("gst-bill")}
          data-ocid="dashboard.bills.card"
        >
          <div className="text-3xl font-bold text-purple-600">
            {bills.length}
          </div>
          <div className="text-sm text-gray-600">GST Bills</div>
        </button>
      </div>

      {lowStock.length > 0 && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4"
          data-ocid="dashboard.stock_alert.panel"
        >
          <h3 className="font-semibold text-red-700">⚠️ Low Stock Alert</h3>
          <ul className="mt-2 text-sm text-red-600">
            {lowStock.map((s) => (
              <li key={s.fabricType}>
                • {s.fabricType} ({s.color}): {s.availableMeters.toFixed(1)}m
                remaining
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h3 className="font-semibold mb-3">Recent Jobs</h3>
        <div className="space-y-2">
          {jobs
            .slice(-5)
            .reverse()
            .map((j) => (
              <div
                key={j.id.toString()}
                className="flex justify-between items-center py-2 border-b last:border-0 text-sm"
              >
                <span className="font-medium">
                  {j.jobNumber} - {j.style}
                </span>
                <span
                  className={`badge ${j.status === JobStatus.Completed ? "badge-green" : j.status === JobStatus.InProgress ? "badge-yellow" : "badge-gray"}`}
                >
                  {j.status}
                </span>
              </div>
            ))}
          {jobs.length === 0 && (
            <p
              className="text-sm text-gray-400"
              data-ocid="dashboard.jobs.empty_state"
            >
              No jobs yet. Start from Production modules.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["fabric-purchase", "🛒 Fabric Purchase"],
          ["design", "🎨 New Design"],
          ["cutting", "✂️ Cutting Job"],
          ["gst-bill", "🧾 GST Bill"],
        ].map(([mod, label]) => (
          <button
            type="button"
            key={mod}
            data-ocid={`dashboard.${mod}.primary_button`}
            onClick={() => setModule(mod as Module)}
            className="card text-center hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- Company Profile ----
function CompanyProfilePage() {
  const backend = useBackend();
  const [form, setForm] = useState({
    name: "KARNI IMPEX",
    address: "",
    gstNumber: "",
    phone: "",
    email: "",
    bankDetails: "",
  });
  const [saved, setSaved] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.getCompanyProfile().then((p) => {
      if (p)
        setForm({
          name: p.name,
          address: p.address,
          gstNumber: p.gstNumber,
          phone: p.phone,
          email: p.email,
          bankDetails: p.bankDetails,
        });
    });
  }, []);

  const save = async () => {
    await backend.updateCompanyProfile(
      form.name,
      form.address,
      form.gstNumber,
      form.phone,
      form.email,
      form.bankDetails,
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="card">
        <h3 className="font-semibold text-lg mb-4">Company Details</h3>
        <div className="space-y-3">
          {(
            [
              ["name", "Company Name"],
              ["gstNumber", "GST Number"],
              ["phone", "Phone"],
              ["email", "Email"],
            ] as [keyof typeof form, string][]
          ).map(([k, label]) => (
            <div key={k}>
              <label htmlFor={`company-${k}`} className="label">
                {label}
              </label>
              <input
                id={`company-${k}`}
                data-ocid={`company.${k}.input`}
                className="input"
                value={form[k]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <div>
            <label htmlFor="company-address" className="label">
              Address
            </label>
            <textarea
              id="company-address"
              data-ocid="company.address.textarea"
              className="input"
              rows={3}
              value={form.address}
              onChange={(e) =>
                setForm((f) => ({ ...f, address: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="company-bank" className="label">
              Bank Details
            </label>
            <textarea
              id="company-bank"
              data-ocid="company.bank.textarea"
              className="input"
              rows={2}
              value={form.bankDetails}
              onChange={(e) =>
                setForm((f) => ({ ...f, bankDetails: e.target.value }))
              }
            />
          </div>
          <button
            type="button"
            data-ocid="company.save.primary_button"
            onClick={save}
            className="btn-primary"
          >
            {saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </div>
      </div>

      <div id="company-card-print" className="card border-2">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{form.name}</h2>
          <p className="text-gray-600">{form.address}</p>
          <p className="text-gray-600">
            {form.phone} | {form.email}
          </p>
          <p className="text-gray-600">GST: {form.gstNumber}</p>
          <p className="text-gray-600 text-sm mt-1">{form.bankDetails}</p>
        </div>
      </div>
    </div>
  );
}

// ---- Photo Master ----
function PhotoMasterPage() {
  const [photos, setPhotos] = useState<PhotoLocal[]>(() =>
    JSON.parse(localStorage.getItem("photos") || "[]"),
  );
  const [form, setForm] = useState({
    label: "",
    category: "Design",
    date: todayStr(),
  });

  const save = () => {
    if (!form.label) return;
    const newPhotos = [...photos, { id: Date.now().toString(), ...form }];
    setPhotos(newPhotos);
    localStorage.setItem("photos", JSON.stringify(newPhotos));
    setForm({ label: "", category: "Design", date: todayStr() });
  };

  const del = (id: string) => {
    const p = photos.filter((x) => x.id !== id);
    setPhotos(p);
    localStorage.setItem("photos", JSON.stringify(p));
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Photo</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="photo-label" className="label">
              Photo Label
            </label>
            <input
              id="photo-label"
              data-ocid="photo.label.input"
              className="input"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="photo-category" className="label">
              Category
            </label>
            <select
              id="photo-category"
              data-ocid="photo.category.select"
              className="input"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {["Design", "Sample", "Fabric", "Reference"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="photo-date" className="label">
              Date
            </label>
            <input
              id="photo-date"
              data-ocid="photo.date.input"
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="photo.add.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Add Photo
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className="card text-center"
            data-ocid={`photo.item.${i + 1}`}
          >
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl mb-2">
              📷
            </div>
            <p className="font-medium text-sm">{p.label}</p>
            <span className="badge badge-blue text-xs">{p.category}</span>
            <p className="text-xs text-gray-400 mt-1">{p.date}</p>
            <button
              type="button"
              data-ocid={`photo.delete_button.${i + 1}`}
              onClick={() => del(p.id)}
              className="btn-xs text-red-500 mt-2"
            >
              Delete
            </button>
          </div>
        ))}
        {photos.length === 0 && (
          <div
            className="col-span-4 text-center text-gray-400 py-8"
            data-ocid="photo.empty_state"
          >
            No photos yet
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Design Register ----
function DesignRegister() {
  const backend = useBackend();
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    number: "",
    name: "",
    category: "Kurti",
    season: "",
    fabricType: "",
    description: "",
  });
  const [showForm, setShowForm] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listDesigns().then(setDesigns);
  }, []);

  const save = async () => {
    if (!form.number || !form.name) return;
    await backend.addDesign(
      form.number,
      form.name,
      form.category,
      form.season,
      form.fabricType,
      form.description,
    );
    backend.listDesigns().then(setDesigns);
    setForm({
      number: "",
      name: "",
      category: "Kurti",
      season: "",
      fabricType: "",
      description: "",
    });
    setShowForm(false);
  };

  const filtered = filter
    ? designs.filter((d) => d.category === filter)
    : designs;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          data-ocid="design.add.primary_button"
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          + Add Design
        </button>
        {["", "Kurti", "Salwar", "Saree", "Blouse", "Other"].map((c) => (
          <button
            type="button"
            key={c}
            data-ocid={"design.filter.tab"}
            onClick={() => setFilter(c)}
            className={`badge cursor-pointer ${filter === c ? "badge-blue" : "badge-gray"}`}
          >
            {c || "All"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="design-number" className="label">
                Design No
              </label>
              <input
                id="design-number"
                data-ocid="design.number.input"
                className="input"
                value={form.number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, number: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="design-name" className="label">
                Name
              </label>
              <input
                id="design-name"
                data-ocid="design.name.input"
                className="input"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="design-category" className="label">
                Category
              </label>
              <select
                id="design-category"
                data-ocid="design.category.select"
                className="input"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {["Kurti", "Salwar", "Saree", "Blouse", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="design-season" className="label">
                Season
              </label>
              <input
                id="design-season"
                data-ocid="design.season.input"
                className="input"
                value={form.season}
                onChange={(e) =>
                  setForm((f) => ({ ...f, season: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="design-fabric" className="label">
                Fabric Type
              </label>
              <input
                id="design-fabric"
                data-ocid="design.fabric.input"
                className="input"
                value={form.fabricType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fabricType: e.target.value }))
                }
              />
            </div>
            <div>
              <label htmlFor="design-desc" className="label">
                Description
              </label>
              <input
                id="design-desc"
                data-ocid="design.desc.input"
                className="input"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
          </div>
          <button
            type="button"
            data-ocid="design.save.primary_button"
            onClick={save}
            className="btn-primary mt-3"
          >
            Save Design
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Design No</th>
              <th className="th">Name</th>
              <th className="th">Category</th>
              <th className="th">Season</th>
              <th className="th">Fabric</th>
              <th className="th">Description</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr
                key={d.id.toString()}
                className="tr"
                data-ocid={`design.item.${i + 1}`}
              >
                <td className="td font-medium">{d.number}</td>
                <td className="td">{d.name}</td>
                <td className="td">{d.category}</td>
                <td className="td">{d.season}</td>
                <td className="td">{d.fabricType}</td>
                <td className="td">{d.description}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="td text-center text-gray-400"
                  data-ocid="design.empty_state"
                >
                  No designs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Karigar Master ----
function KarigarMaster({
  karigars,
  setKarigars,
}: { karigars: KarigarLocal[]; setKarigars: (k: KarigarLocal[]) => void }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    specialization: "Cutting",
    rate: "",
  });

  const save = () => {
    if (!form.name) return;
    const updated = [
      ...karigars,
      {
        id: Date.now().toString(),
        name: form.name,
        phone: form.phone,
        specialization: form.specialization,
        rate: Number.parseFloat(form.rate || "0"),
      },
    ];
    setKarigars(updated);
    localStorage.setItem("karigars", JSON.stringify(updated));
    setForm({ name: "", phone: "", specialization: "Cutting", rate: "" });
  };

  const del = (id: string) => {
    const k = karigars.filter((x) => x.id !== id);
    setKarigars(k);
    localStorage.setItem("karigars", JSON.stringify(k));
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Add Karigar</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="karigar-name" className="label">
              Name
            </label>
            <input
              id="karigar-name"
              data-ocid="karigar.name.input"
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="karigar-phone" className="label">
              Phone
            </label>
            <input
              id="karigar-phone"
              data-ocid="karigar.phone.input"
              className="input"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="karigar-spec" className="label">
              Specialization
            </label>
            <select
              id="karigar-spec"
              data-ocid="karigar.spec.select"
              className="input"
              value={form.specialization}
              onChange={(e) =>
                setForm((f) => ({ ...f, specialization: e.target.value }))
              }
            >
              {[
                "Dyeing",
                "Print",
                "Embroidery",
                "Handwork",
                "Cutting",
                "Stitching",
                "Pressing",
                "Packing",
                "General",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="karigar-rate" className="label">
              Rate (₹/day or piece)
            </label>
            <input
              id="karigar-rate"
              data-ocid="karigar.rate.input"
              type="number"
              className="input"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="karigar.add.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Add Karigar
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Name</th>
              <th className="th">Phone</th>
              <th className="th">Specialization</th>
              <th className="th">Rate</th>
              <th className="th">Action</th>
            </tr>
          </thead>
          <tbody>
            {karigars.map((k, i) => (
              <tr key={k.id} className="tr" data-ocid={`karigar.item.${i + 1}`}>
                <td className="td">{k.name}</td>
                <td className="td">{k.phone}</td>
                <td className="td">{k.specialization}</td>
                <td className="td">₹{k.rate}</td>
                <td className="td">
                  <button
                    type="button"
                    data-ocid={`karigar.delete_button.${i + 1}`}
                    onClick={() => del(k.id)}
                    className="btn-xs text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {karigars.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="td text-center text-gray-400"
                  data-ocid="karigar.empty_state"
                >
                  No karigars yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Fabric Purchase ----
function FabricPurchasePage() {
  const backend = useBackend();
  const [purchases, setPurchases] = useState<FabricPurchase[]>([]);
  const [form, setForm] = useState({
    vendor: "",
    fabricType: "",
    color: "",
    meters: "",
    rate: "",
    invoiceNumber: "",
    date: todayStr(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listFabricPurchases().then(setPurchases);
  }, []);

  const save = async () => {
    if (!form.vendor || !form.fabricType) return;
    const amt =
      Number.parseFloat(form.meters || "0") *
      Number.parseFloat(form.rate || "0");
    await backend.addFabricPurchase(
      form.vendor,
      form.fabricType,
      form.color,
      Number.parseFloat(form.meters || "0"),
      Number.parseFloat(form.rate || "0"),
      amt,
      form.invoiceNumber,
      today(),
    );
    backend.listFabricPurchases().then(setPurchases);
    setForm({
      vendor: "",
      fabricType: "",
      color: "",
      meters: "",
      rate: "",
      invoiceNumber: "",
      date: todayStr(),
    });
  };

  const total = purchases.reduce((a, p) => a + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Fabric Purchase</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fp-vendor" className="label">
              Vendor
            </label>
            <input
              id="fp-vendor"
              data-ocid="fp.vendor.input"
              className="input"
              value={form.vendor}
              onChange={(e) =>
                setForm((f) => ({ ...f, vendor: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="fp-type" className="label">
              Fabric Type
            </label>
            <input
              id="fp-type"
              data-ocid="fp.type.input"
              className="input"
              value={form.fabricType}
              onChange={(e) =>
                setForm((f) => ({ ...f, fabricType: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="fp-color" className="label">
              Color/Shade
            </label>
            <input
              id="fp-color"
              data-ocid="fp.color.input"
              className="input"
              value={form.color}
              onChange={(e) =>
                setForm((f) => ({ ...f, color: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="fp-meters" className="label">
              Meters
            </label>
            <input
              id="fp-meters"
              data-ocid="fp.meters.input"
              type="number"
              className="input"
              value={form.meters}
              onChange={(e) =>
                setForm((f) => ({ ...f, meters: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="fp-rate" className="label">
              Rate/meter (₹)
            </label>
            <input
              id="fp-rate"
              data-ocid="fp.rate.input"
              type="number"
              className="input"
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="fp-invoice" className="label">
              Invoice No
            </label>
            <input
              id="fp-invoice"
              data-ocid="fp.invoice.input"
              className="input"
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Amount: ₹
          {fmtAmt(
            Number.parseFloat(form.meters || "0") *
              Number.parseFloat(form.rate || "0"),
          )}
        </div>
        <button
          type="button"
          data-ocid="fp.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save Purchase
        </button>
      </div>
      <div className="card overflow-x-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Purchases ({purchases.length})</h3>
          <button
            type="button"
            data-ocid="fp.print.secondary_button"
            onClick={() => printElement("fp-table")}
            className="btn-secondary text-sm"
          >
            🖨️ Print
          </button>
        </div>
        <div id="fp-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Date</th>
                <th className="th">Vendor</th>
                <th className="th">Fabric</th>
                <th className="th">Color</th>
                <th className="th">Meters</th>
                <th className="th">Rate</th>
                <th className="th">Amount</th>
                <th className="th">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p, i) => (
                <tr
                  key={p.id.toString()}
                  className="tr"
                  data-ocid={`fp.item.${i + 1}`}
                >
                  <td className="td">{fmtDate(p.date)}</td>
                  <td className="td">{p.vendor}</td>
                  <td className="td">{p.fabricType}</td>
                  <td className="td">{p.color}</td>
                  <td className="td">{p.meters}m</td>
                  <td className="td">₹{p.rate}</td>
                  <td className="td">₹{fmtAmt(p.amount)}</td>
                  <td className="td">{p.invoiceNumber}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="td text-center text-gray-400"
                    data-ocid="fp.empty_state"
                  >
                    No purchases
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="td" colSpan={6}>
                  Total
                </td>
                <td className="td">₹{fmtAmt(total)}</td>
                <td className="td" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Fabric Stock ----
function FabricStockPage() {
  const backend = useBackend();
  const [stocks, setStocks] = useState<FabricStock[]>([]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listFabricStocks().then(setStocks);
  }, []);
  return (
    <div className="card overflow-x-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Fabric Stock</h3>
        <button
          type="button"
          data-ocid="stock.print.secondary_button"
          onClick={() => printElement("stock-table")}
          className="btn-secondary text-sm"
        >
          🖨️ Print
        </button>
      </div>
      <div id="stock-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Fabric Type</th>
              <th className="th">Color</th>
              <th className="th">Total (m)</th>
              <th className="th">Issued (m)</th>
              <th className="th">Available (m)</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((s, i) => (
              <tr
                key={s.fabricType + s.color}
                className={`tr ${s.availableMeters < 10 ? "bg-red-50" : ""}`}
                data-ocid={`stock.item.${i + 1}`}
              >
                <td className="td">{s.fabricType}</td>
                <td className="td">{s.color}</td>
                <td className="td">{s.totalMeters.toFixed(1)}</td>
                <td className="td">{s.issuedMeters.toFixed(1)}</td>
                <td
                  className={`td font-semibold ${s.availableMeters < 10 ? "text-red-600" : "text-green-700"}`}
                >
                  {s.availableMeters.toFixed(1)}
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="td text-center text-gray-400"
                  data-ocid="stock.empty_state"
                >
                  No stock data. Add fabric purchases first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Fabric Issue ----
function FabricIssuePage() {
  const backend = useBackend();
  const [issues, setIssues] = useState<FabricIssue[]>([]);
  const [stocks, setStocks] = useState<FabricStock[]>([]);
  const [form, setForm] = useState({
    fabricType: "",
    meters: "",
    issuedTo: "",
    date: todayStr(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([backend.listFabricIssues(), backend.listFabricStocks()]).then(
      ([i, s]) => {
        setIssues(i);
        setStocks(s);
      },
    );
  }, []);

  const save = async () => {
    if (!form.fabricType || !form.meters) return;
    try {
      await backend.issueFabric(
        form.fabricType,
        Number.parseFloat(form.meters),
        form.issuedTo,
        today(),
      );
      Promise.all([
        backend.listFabricIssues(),
        backend.listFabricStocks(),
      ]).then(([i, s]) => {
        setIssues(i);
        setStocks(s);
      });
      setForm({ fabricType: "", meters: "", issuedTo: "", date: todayStr() });
    } catch (e) {
      alert(`Error: ${e}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Issue Fabric</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fi-type" className="label">
              Fabric Type
            </label>
            <select
              id="fi-type"
              data-ocid="fi.type.select"
              className="input"
              value={form.fabricType}
              onChange={(e) =>
                setForm((f) => ({ ...f, fabricType: e.target.value }))
              }
            >
              <option value="">Select</option>
              {stocks.map((s) => (
                <option key={s.fabricType} value={s.fabricType}>
                  {s.fabricType} ({s.availableMeters.toFixed(1)}m available)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fi-meters" className="label">
              Meters
            </label>
            <input
              id="fi-meters"
              data-ocid="fi.meters.input"
              type="number"
              className="input"
              value={form.meters}
              onChange={(e) =>
                setForm((f) => ({ ...f, meters: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="fi-to" className="label">
              Issued To (Job/Person)
            </label>
            <input
              id="fi-to"
              data-ocid="fi.to.input"
              className="input"
              value={form.issuedTo}
              onChange={(e) =>
                setForm((f) => ({ ...f, issuedTo: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="fi.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Issue Fabric
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Date</th>
              <th className="th">Fabric Type</th>
              <th className="th">Meters</th>
              <th className="th">Issued To</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i, idx) => (
              <tr
                key={i.id.toString()}
                className="tr"
                data-ocid={`fi.item.${idx + 1}`}
              >
                <td className="td">{fmtDate(i.date)}</td>
                <td className="td">{i.fabricType}</td>
                <td className="td">{i.meters}m</td>
                <td className="td">{i.issuedTo}</td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="td text-center text-gray-400"
                  data-ocid="fi.empty_state"
                >
                  No issues
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Marker Planning ----
function MarkerPlanningPage() {
  const [markers, setMarkers] = useState<MarkerLocal[]>(() =>
    JSON.parse(localStorage.getItem("markers") || "[]"),
  );
  const [form, setForm] = useState({
    markerNo: "",
    design: "",
    fabricWidth: "",
    layLength: "",
    plies: "",
    date: todayStr(),
  });

  const save = () => {
    if (!form.markerNo) return;
    const updated = [
      ...markers,
      {
        id: Date.now().toString(),
        markerNo: form.markerNo,
        design: form.design,
        fabricWidth: Number.parseFloat(form.fabricWidth || "0"),
        layLength: Number.parseFloat(form.layLength || "0"),
        plies: Number.parseInt(form.plies || "0"),
        date: form.date,
      },
    ];
    setMarkers(updated);
    localStorage.setItem("markers", JSON.stringify(updated));
    setForm({
      markerNo: "",
      design: "",
      fabricWidth: "",
      layLength: "",
      plies: "",
      date: todayStr(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Marker</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="marker-no" className="label">
              Marker No
            </label>
            <input
              id="marker-no"
              data-ocid="marker.no.input"
              className="input"
              value={form.markerNo}
              onChange={(e) =>
                setForm((f) => ({ ...f, markerNo: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="marker-design" className="label">
              Design
            </label>
            <input
              id="marker-design"
              data-ocid="marker.design.input"
              className="input"
              value={form.design}
              onChange={(e) =>
                setForm((f) => ({ ...f, design: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="marker-width" className="label">
              Fabric Width (cm)
            </label>
            <input
              id="marker-width"
              data-ocid="marker.width.input"
              type="number"
              className="input"
              value={form.fabricWidth}
              onChange={(e) =>
                setForm((f) => ({ ...f, fabricWidth: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="marker-length" className="label">
              Lay Length (m)
            </label>
            <input
              id="marker-length"
              data-ocid="marker.length.input"
              type="number"
              className="input"
              value={form.layLength}
              onChange={(e) =>
                setForm((f) => ({ ...f, layLength: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="marker-plies" className="label">
              No of Plies
            </label>
            <input
              id="marker-plies"
              data-ocid="marker.plies.input"
              type="number"
              className="input"
              value={form.plies}
              onChange={(e) =>
                setForm((f) => ({ ...f, plies: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-blue-700 font-medium">
          Total Fabric:{" "}
          {(
            Number.parseFloat(form.layLength || "0") *
            Number.parseInt(form.plies || "0")
          ).toFixed(1)}{" "}
          meters
        </div>
        <button
          type="button"
          data-ocid="marker.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save Marker
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Marker No</th>
              <th className="th">Design</th>
              <th className="th">Width (cm)</th>
              <th className="th">Length (m)</th>
              <th className="th">Plies</th>
              <th className="th">Total Fabric</th>
              <th className="th">Date</th>
            </tr>
          </thead>
          <tbody>
            {markers.map((m, i) => (
              <tr key={m.id} className="tr" data-ocid={`marker.item.${i + 1}`}>
                <td className="td">{m.markerNo}</td>
                <td className="td">{m.design}</td>
                <td className="td">{m.fabricWidth}</td>
                <td className="td">{m.layLength}</td>
                <td className="td">{m.plies}</td>
                <td className="td font-semibold">
                  {(m.layLength * m.plies).toFixed(1)}m
                </td>
                <td className="td">{m.date}</td>
              </tr>
            ))}
            {markers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="td text-center text-gray-400"
                  data-ocid="marker.empty_state"
                >
                  No markers
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Production Plan ----
function ProductionPlanPage() {
  const backend = useBackend();
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [form, setForm] = useState({
    styleName: "",
    totalQuantity: "",
    deliveryDate: todayStr(),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listProductionPlans().then(setPlans);
  }, []);

  const save = async () => {
    if (!form.styleName) return;
    await backend.addProductionPlan(
      form.styleName,
      BigInt(form.totalQuantity || "0"),
      BigInt(new Date(form.deliveryDate).getTime()),
      [],
    );
    backend.listProductionPlans().then(setPlans);
    setForm({ styleName: "", totalQuantity: "", deliveryDate: todayStr() });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Production Plan</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="pp-style" className="label">
              Style Name
            </label>
            <input
              id="pp-style"
              data-ocid="pp.style.input"
              className="input"
              value={form.styleName}
              onChange={(e) =>
                setForm((f) => ({ ...f, styleName: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="pp-qty" className="label">
              Total Quantity
            </label>
            <input
              id="pp-qty"
              data-ocid="pp.qty.input"
              type="number"
              className="input"
              value={form.totalQuantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, totalQuantity: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="pp-date" className="label">
              Delivery Date
            </label>
            <input
              id="pp-date"
              data-ocid="pp.date.input"
              type="date"
              className="input"
              value={form.deliveryDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, deliveryDate: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="pp.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save Plan
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Style</th>
              <th className="th">Total Qty</th>
              <th className="th">Delivery Date</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, i) => (
              <tr
                key={p.id.toString()}
                className="tr"
                data-ocid={`pp.item.${i + 1}`}
              >
                <td className="td font-medium">{p.styleName}</td>
                <td className="td">{p.totalQuantity.toString()}</td>
                <td className="td">{fmtDate(p.deliveryDate)}</td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="td text-center text-gray-400"
                  data-ocid="pp.empty_state"
                >
                  No plans
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Quality Check ----
function QualityCheckPage() {
  const backend = useBackend();
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [form, setForm] = useState({
    jobReference: "",
    jobType: "Cutting",
    inspector: "",
    passCount: "",
    failCount: "",
    remarks: "",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listQualityChecks().then(setChecks);
  }, []);

  const save = async () => {
    if (!form.jobReference) return;
    await backend.addQualityCheck(
      form.jobReference,
      form.jobType,
      form.inspector,
      BigInt(form.passCount || "0"),
      BigInt(form.failCount || "0"),
      form.remarks,
      today(),
    );
    backend.listQualityChecks().then(setChecks);
    setForm({
      jobReference: "",
      jobType: "Cutting",
      inspector: "",
      passCount: "",
      failCount: "",
      remarks: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Quality Check</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qc-ref" className="label">
              Job Reference
            </label>
            <input
              id="qc-ref"
              data-ocid="qc.ref.input"
              className="input"
              value={form.jobReference}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobReference: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="qc-type" className="label">
              Job Type
            </label>
            <select
              id="qc-type"
              data-ocid="qc.type.select"
              className="input"
              value={form.jobType}
              onChange={(e) =>
                setForm((f) => ({ ...f, jobType: e.target.value }))
              }
            >
              {[
                "Dyeing",
                "Print",
                "Embroidery",
                "Handwork",
                "Cutting",
                "Stitching",
                "Pressing",
                "Packing",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qc-inspector" className="label">
              Inspector
            </label>
            <input
              id="qc-inspector"
              data-ocid="qc.inspector.input"
              className="input"
              value={form.inspector}
              onChange={(e) =>
                setForm((f) => ({ ...f, inspector: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="qc-pass" className="label">
              Pass Count
            </label>
            <input
              id="qc-pass"
              data-ocid="qc.pass.input"
              type="number"
              className="input"
              value={form.passCount}
              onChange={(e) =>
                setForm((f) => ({ ...f, passCount: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="qc-fail" className="label">
              Fail Count
            </label>
            <input
              id="qc-fail"
              data-ocid="qc.fail.input"
              type="number"
              className="input"
              value={form.failCount}
              onChange={(e) =>
                setForm((f) => ({ ...f, failCount: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="qc-remarks" className="label">
              Remarks
            </label>
            <input
              id="qc-remarks"
              data-ocid="qc.remarks.input"
              className="input"
              value={form.remarks}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="qc.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save QC
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Date</th>
              <th className="th">Job Ref</th>
              <th className="th">Type</th>
              <th className="th">Pass</th>
              <th className="th">Fail</th>
              <th className="th">Pass%</th>
              <th className="th">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c, i) => {
              const total = Number(c.passCount) + Number(c.failCount);
              const pct =
                total > 0
                  ? ((Number(c.passCount) / total) * 100).toFixed(0)
                  : "0";
              return (
                <tr
                  key={c.id.toString()}
                  className="tr"
                  data-ocid={`qc.item.${i + 1}`}
                >
                  <td className="td">{fmtDate(c.date)}</td>
                  <td className="td">{c.jobReference}</td>
                  <td className="td">{c.jobType}</td>
                  <td className="td text-green-700">
                    {c.passCount.toString()}
                  </td>
                  <td className="td text-red-600">{c.failCount.toString()}</td>
                  <td className="td font-semibold">{pct}%</td>
                  <td className="td">{c.remarks}</td>
                </tr>
              );
            })}
            {checks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="td text-center text-gray-400"
                  data-ocid="qc.empty_state"
                >
                  No QC records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- Dispatch ----
function DispatchPage() {
  const backend = useBackend();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [form, setForm] = useState({
    style: "",
    buyerName: "",
    quantity: "",
    transportName: "",
    trackingNumber: "",
    status: "Dispatched",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listDispatches().then(setDispatches);
  }, []);

  const save = async () => {
    if (!form.buyerName) return;
    await backend.addDispatch(
      form.style,
      form.buyerName,
      BigInt(form.quantity || "0"),
      form.transportName,
      form.trackingNumber,
      form.status,
      today(),
    );
    backend.listDispatches().then(setDispatches);
    setForm({
      style: "",
      buyerName: "",
      quantity: "",
      transportName: "",
      trackingNumber: "",
      status: "Dispatched",
    });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Dispatch</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="disp-style" className="label">
              Style
            </label>
            <input
              id="disp-style"
              data-ocid="disp.style.input"
              className="input"
              value={form.style}
              onChange={(e) =>
                setForm((f) => ({ ...f, style: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="disp-buyer" className="label">
              Buyer Name
            </label>
            <input
              id="disp-buyer"
              data-ocid="disp.buyer.input"
              className="input"
              value={form.buyerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyerName: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="disp-qty" className="label">
              Quantity
            </label>
            <input
              id="disp-qty"
              data-ocid="disp.qty.input"
              type="number"
              className="input"
              value={form.quantity}
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="disp-transport" className="label">
              Transport Name
            </label>
            <input
              id="disp-transport"
              data-ocid="disp.transport.input"
              className="input"
              value={form.transportName}
              onChange={(e) =>
                setForm((f) => ({ ...f, transportName: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="disp-lr" className="label">
              LR / Tracking No
            </label>
            <input
              id="disp-lr"
              data-ocid="disp.lr.input"
              className="input"
              value={form.trackingNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, trackingNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="disp-status" className="label">
              Status
            </label>
            <select
              id="disp-status"
              data-ocid="disp.status.select"
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
            >
              {["Dispatched", "In Transit", "Delivered"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          data-ocid="disp.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save Dispatch
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Date</th>
              <th className="th">Style</th>
              <th className="th">Buyer</th>
              <th className="th">Qty</th>
              <th className="th">Transport</th>
              <th className="th">LR No</th>
              <th className="th">Status</th>
            </tr>
          </thead>
          <tbody>
            {dispatches.map((d, i) => (
              <tr
                key={d.id.toString()}
                className="tr"
                data-ocid={`disp.item.${i + 1}`}
              >
                <td className="td">{fmtDate(d.date)}</td>
                <td className="td">{d.style}</td>
                <td className="td">{d.buyerName}</td>
                <td className="td">{d.quantity.toString()}</td>
                <td className="td">{d.transportName}</td>
                <td className="td">{d.trackingNumber}</td>
                <td className="td">
                  <span className="badge badge-green">{d.status}</span>
                </td>
              </tr>
            ))}
            {dispatches.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="td text-center text-gray-400"
                  data-ocid="disp.empty_state"
                >
                  No dispatches
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---- GST Bill ----
function GSTBillPage() {
  const backend = useBackend();
  const [bills, setBills] = useState<GSTBill[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [viewBill, setViewBill] = useState<GSTBill | null>(null);
  const [form, setForm] = useState({
    billNumber: "",
    buyerName: "",
    buyerGST: "",
    igst: false,
  });
  const [items, setItems] = useState([
    { description: "", qty: "", rate: "", gst: "5" },
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([backend.listGSTBills(), backend.getCompanyProfile()]).then(
      ([b, c]) => {
        setBills(b);
        setCompany(c);
      },
    );
    backend.listGSTBills().then((b) => {
      const cnt = b.length + 1;
      setForm((f) => ({
        ...f,
        billNumber: `BILL-${String(cnt).padStart(4, "0")}`,
      }));
    });
  }, []);

  const calcTotals = () => {
    const subtotal = items.reduce(
      (a, i) =>
        a + Number.parseFloat(i.qty || "0") * Number.parseFloat(i.rate || "0"),
      0,
    );
    const gstAmt = items.reduce(
      (a, i) =>
        a +
        (Number.parseFloat(i.qty || "0") *
          Number.parseFloat(i.rate || "0") *
          Number.parseFloat(i.gst || "0")) /
          100,
      0,
    );
    return { subtotal, gstAmt, total: subtotal + gstAmt };
  };

  const save = async () => {
    if (!form.buyerName) return;
    const { total } = calcTotals();
    const lineItems = items.map((i) => ({
      description: i.description,
      qty: BigInt(i.qty || "0"),
      rate: Number.parseFloat(i.rate || "0"),
      gstPercentage: Number.parseFloat(i.gst || "0"),
    }));
    await backend.addGSTBill(
      form.billNumber,
      form.buyerName,
      form.buyerGST,
      today(),
      lineItems,
      total,
    );
    backend.listGSTBills().then((b) => {
      setBills(b);
      const cnt = b.length + 1;
      setForm((f) => ({
        ...f,
        billNumber: `BILL-${String(cnt).padStart(4, "0")}`,
        buyerName: "",
        buyerGST: "",
      }));
    });
    setItems([{ description: "", qty: "", rate: "", gst: "5" }]);
  };

  const { subtotal, gstAmt, total } = calcTotals();

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New GST Bill</h3>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label htmlFor="gst-billno" className="label">
              Bill No
            </label>
            <input
              id="gst-billno"
              data-ocid="gst.billno.input"
              className="input"
              value={form.billNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, billNumber: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="gst-buyer" className="label">
              Buyer Name
            </label>
            <input
              id="gst-buyer"
              data-ocid="gst.buyer.input"
              className="input"
              value={form.buyerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyerName: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="gst-buyergst" className="label">
              Buyer GST No
            </label>
            <input
              id="gst-buyergst"
              data-ocid="gst.buyergst.input"
              className="input"
              value={form.buyerGST}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyerGST: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <input
            data-ocid="gst.igst.checkbox"
            type="checkbox"
            id="igst"
            checked={form.igst}
            onChange={(e) => setForm((f) => ({ ...f, igst: e.target.checked }))}
          />
          <label htmlFor="igst" className="text-sm">
            Interstate (IGST)
          </label>
        </div>
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Description</th>
              <th className="th">Qty</th>
              <th className="th">Rate</th>
              <th className="th">GST%</th>
              <th className="th">Amount</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list is reordering-safe
              <tr key={i}>
                <td className="p-1">
                  <input
                    data-ocid={`gst.desc.input.${i + 1}`}
                    className="input text-xs"
                    value={it.description}
                    onChange={(e) => {
                      const n = [...items];
                      n[i].description = e.target.value;
                      setItems(n);
                    }}
                  />
                </td>
                <td className="p-1">
                  <input
                    data-ocid={`gst.qty.input.${i + 1}`}
                    type="number"
                    className="input text-xs w-20"
                    value={it.qty}
                    onChange={(e) => {
                      const n = [...items];
                      n[i].qty = e.target.value;
                      setItems(n);
                    }}
                  />
                </td>
                <td className="p-1">
                  <input
                    data-ocid={`gst.rate.input.${i + 1}`}
                    type="number"
                    className="input text-xs w-24"
                    value={it.rate}
                    onChange={(e) => {
                      const n = [...items];
                      n[i].rate = e.target.value;
                      setItems(n);
                    }}
                  />
                </td>
                <td className="p-1">
                  <select
                    data-ocid={`gst.gstpct.select.${i + 1}`}
                    className="input text-xs w-20"
                    value={it.gst}
                    onChange={(e) => {
                      const n = [...items];
                      n[i].gst = e.target.value;
                      setItems(n);
                    }}
                  >
                    {["0", "5", "12", "18", "28"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1 text-right">
                  ₹
                  {fmtAmt(
                    Number.parseFloat(it.qty || "0") *
                      Number.parseFloat(it.rate || "0"),
                  )}
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    data-ocid={`gst.remove.delete_button.${i + 1}`}
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="btn-xs text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          data-ocid="gst.addline.secondary_button"
          onClick={() =>
            setItems([
              ...items,
              { description: "", qty: "", rate: "", gst: "5" },
            ])
          }
          className="btn-secondary text-sm"
        >
          + Add Line
        </button>
        <div className="mt-3 text-sm space-y-1 text-right">
          <div>Subtotal: ₹{fmtAmt(subtotal)}</div>
          {form.igst ? (
            <div>IGST: ₹{fmtAmt(gstAmt)}</div>
          ) : (
            <>
              <div>CGST: ₹{fmtAmt(gstAmt / 2)}</div>
              <div>SGST: ₹{fmtAmt(gstAmt / 2)}</div>
            </>
          )}
          <div className="font-bold text-base">Total: ₹{fmtAmt(total)}</div>
        </div>
        <button
          type="button"
          data-ocid="gst.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Save Bill
        </button>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">GST Bills ({bills.length})</h3>
          <button
            type="button"
            data-ocid="gst.print.secondary_button"
            onClick={() => printElement("gst-bills-table")}
            className="btn-secondary text-sm"
          >
            🖨️ Print
          </button>
        </div>
        <div id="gst-bills-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Bill No</th>
                <th className="th">Date</th>
                <th className="th">Buyer</th>
                <th className="th">Buyer GST</th>
                <th className="th">Total</th>
                <th className="th">View</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b, i) => (
                <tr
                  key={b.id.toString()}
                  className="tr"
                  data-ocid={`gst.item.${i + 1}`}
                >
                  <td className="td font-medium">{b.billNumber}</td>
                  <td className="td">{fmtDate(b.date)}</td>
                  <td className="td">{b.buyerName}</td>
                  <td className="td">{b.buyerGST}</td>
                  <td className="td font-semibold">₹{fmtAmt(b.total)}</td>
                  <td className="td">
                    <button
                      type="button"
                      data-ocid={`gst.view.button.${i + 1}`}
                      onClick={() => setViewBill(b)}
                      className="btn-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="td text-center text-gray-400"
                    data-ocid="gst.empty_state"
                  >
                    No bills
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div id="bill-print-view" className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">
                  {company?.name || "KARNI IMPEX"}
                </h2>
                <p className="text-sm">
                  {company?.address} | GST: {company?.gstNumber}
                </p>
              </div>
              <div className="text-center font-bold border-t border-b py-2 mb-4">
                TAX INVOICE
              </div>
              <div className="flex justify-between text-sm mb-3">
                <div>
                  <strong>Bill No:</strong> {viewBill.billNumber}
                </div>
                <div>
                  <strong>Date:</strong> {fmtDate(viewBill.date)}
                </div>
              </div>
              <div className="text-sm mb-4">
                <strong>Buyer:</strong> {viewBill.buyerName}
                <br />
                <strong>GST:</strong> {viewBill.buyerGST}
              </div>
              <table className="w-full border border-gray-400 text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 p-2">#</th>
                    <th className="border border-gray-400 p-2">Description</th>
                    <th className="border border-gray-400 p-2">Qty</th>
                    <th className="border border-gray-400 p-2">Rate</th>
                    <th className="border border-gray-400 p-2">GST%</th>
                    <th className="border border-gray-400 p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewBill.lineItems.map((li, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: list is reordering-safe
                    <tr key={i}>
                      <td className="border border-gray-400 p-2">{i + 1}</td>
                      <td className="border border-gray-400 p-2">
                        {li.description}
                      </td>
                      <td className="border border-gray-400 p-2">
                        {li.qty.toString()}
                      </td>
                      <td className="border border-gray-400 p-2">₹{li.rate}</td>
                      <td className="border border-gray-400 p-2">
                        {li.gstPercentage}%
                      </td>
                      <td className="border border-gray-400 p-2">
                        ₹{fmtAmt(Number(li.qty) * li.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-right mt-3 font-bold">
                Total: ₹{fmtAmt(viewBill.total)}
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button
                type="button"
                data-ocid="gst.bill_print.primary_button"
                onClick={() => printElement("bill-print-view")}
                className="btn-primary"
              >
                🖨️ Print Bill
              </button>
              <button
                type="button"
                data-ocid="gst.bill_close.cancel_button"
                onClick={() => setViewBill(null)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Challan List ----
function ChallanListPage() {
  const backend = useBackend();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [view, setView] = useState<Challan | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([backend.listChallans(), backend.getCompanyProfile()]).then(
      ([c, p]) => {
        setChallans(c);
        setCompany(p);
      },
    );
  }, []);
  return (
    <div className="card overflow-x-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">All Challans ({challans.length})</h3>
        <button
          type="button"
          data-ocid="challan.print_all.secondary_button"
          onClick={() => printElement("challan-table")}
          className="btn-secondary text-sm"
        >
          🖨️ Print List
        </button>
      </div>
      <div id="challan-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Challan No</th>
              <th className="th">Date</th>
              <th className="th">Job Type</th>
              <th className="th">Party</th>
              <th className="th">Items</th>
              <th className="th">View</th>
            </tr>
          </thead>
          <tbody>
            {challans.map((c, i) => (
              <tr
                key={c.id.toString()}
                className="tr"
                data-ocid={`challan.item.${i + 1}`}
              >
                <td className="td font-medium">{c.challanNumber}</td>
                <td className="td">{fmtDate(c.date)}</td>
                <td className="td">{c.jobType}</td>
                <td className="td">{c.partyName}</td>
                <td className="td">{c.items.length}</td>
                <td className="td">
                  <button
                    type="button"
                    data-ocid={`challan.view.button.${i + 1}`}
                    onClick={() => setView(c)}
                    className="btn-xs"
                  >
                    📄 View
                  </button>
                </td>
              </tr>
            ))}
            {challans.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="td text-center text-gray-400"
                  data-ocid="challan.empty_state"
                >
                  No challans yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {view && (
        <ChallanModal
          challan={view}
          company={company}
          onClose={() => setView(null)}
        />
      )}
    </div>
  );
}

// ---- Karigar Ledger ----
function KarigarLedgerPage({ karigars }: { karigars: KarigarLocal[] }) {
  const backend = useBackend();
  const [ledgers, setLedgers] = useState<KarigarLedgerEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selected, setSelected] = useState("");
  const [payment, setPayment] = useState("");

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([backend.listKarigarLedgers(), backend.listJobs()]).then(
      ([l, j]) => {
        setLedgers(l);
        setJobs(j);
      },
    );
  }, []);

  const karigarJobs = jobs.filter((j) => j.karigarName === selected);
  const existingLedger = ledgers.find((l) => l.karigarName === selected);
  const totalEarned = karigarJobs.reduce((a, j) => a + j.amount, 0);
  const totalPaid = existingLedger ? existingLedger.balance : 0;
  const balance = totalEarned - totalPaid;

  const addPayment = async () => {
    if (!selected || !payment) return;
    await backend.addKarigarLedgerEntry(
      selected,
      [],
      Number.parseFloat(payment),
    );
    backend.listKarigarLedgers().then(setLedgers);
    setPayment("");
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Karigar Ledger</h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="kl-karigar" className="label">
              Select Karigar
            </label>
            <select
              id="kl-karigar"
              data-ocid="kl.karigar.select"
              className="input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">-- Select --</option>
              {karigars.map((k) => (
                <option key={k.id} value={k.name}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selected && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <div className="text-2xl font-bold text-blue-600">
                ₹{fmtAmt(totalEarned)}
              </div>
              <div className="text-sm text-gray-600">Total Earned</div>
            </div>
            <div className="card text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{fmtAmt(totalPaid)}
              </div>
              <div className="text-sm text-gray-600">Total Paid</div>
            </div>
            <div className="card text-center">
              <div
                className={`text-2xl font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}
              >
                ₹{fmtAmt(balance)}
              </div>
              <div className="text-sm text-gray-600">Balance Due</div>
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Jobs by {selected}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="th">Job No</th>
                  <th className="th">Style</th>
                  <th className="th">Qty</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {karigarJobs.map((j, i) => (
                  <tr
                    key={j.id.toString()}
                    className="tr"
                    data-ocid={`kl.job.item.${i + 1}`}
                  >
                    <td className="td">{j.jobNumber}</td>
                    <td className="td">{j.style}</td>
                    <td className="td">{j.quantity.toString()}</td>
                    <td className="td">₹{fmtAmt(j.amount)}</td>
                    <td className="td">{j.status}</td>
                  </tr>
                ))}
                {karigarJobs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="td text-center text-gray-400"
                      data-ocid="kl.empty_state"
                    >
                      No jobs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">Add Payment</h3>
            <div className="flex gap-3">
              <input
                data-ocid="kl.payment.input"
                type="number"
                className="input"
                placeholder="Amount paid (₹)"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
              />
              <button
                type="button"
                data-ocid="kl.payment.primary_button"
                onClick={addPayment}
                className="btn-primary"
              >
                Record Payment
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Account Ledger ----
function AccountLedgerPage() {
  const backend = useBackend();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [form, setForm] = useState({
    type: "Debit",
    category: "Purchase",
    amount: "",
    description: "",
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listAccountLedgerEntries().then(setEntries);
  }, []);

  const save = async () => {
    if (!form.amount) return;
    const et =
      form.type === "Debit" ? LedgerEntryType.Debit : LedgerEntryType.Credit;
    await backend.addAccountLedgerEntry(
      et,
      form.category,
      Number.parseFloat(form.amount),
      form.description,
      today(),
    );
    backend.listAccountLedgerEntries().then(setEntries);
    setForm({
      type: "Debit",
      category: "Purchase",
      amount: "",
      description: "",
    });
  };

  let balance = 0;
  const withBalance = entries.map((e) => {
    balance += e.entryType === LedgerEntryType.Debit ? -e.amount : e.amount;
    return { ...e, running: balance };
  });

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">New Entry</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="al-type" className="label">
              Type
            </label>
            <select
              id="al-type"
              data-ocid="al.type.select"
              className="input"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option>Debit</option>
              <option>Credit</option>
            </select>
          </div>
          <div>
            <label htmlFor="al-cat" className="label">
              Category
            </label>
            <select
              id="al-cat"
              data-ocid="al.cat.select"
              className="input"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
            >
              {[
                "Purchase",
                "Sale",
                "Expense",
                "Payment",
                "Receipt",
                "Other",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="al-amount" className="label">
              Amount (₹)
            </label>
            <input
              id="al-amount"
              data-ocid="al.amount.input"
              type="number"
              className="input"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="al-desc" className="label">
              Description
            </label>
            <input
              id="al-desc"
              data-ocid="al.desc.input"
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="al.save.primary_button"
          onClick={save}
          className="btn-primary mt-3"
        >
          Add Entry
        </button>
      </div>
      <div className="card overflow-x-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Ledger</h3>
          <button
            type="button"
            data-ocid="al.print.secondary_button"
            onClick={() => printElement("al-table")}
            className="btn-secondary text-sm"
          >
            🖨️ Print
          </button>
        </div>
        <div id="al-table">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Date</th>
                <th className="th">Category</th>
                <th className="th">Description</th>
                <th className="th">Debit</th>
                <th className="th">Credit</th>
                <th className="th">Balance</th>
              </tr>
            </thead>
            <tbody>
              {withBalance.map((e, i) => (
                <tr
                  key={e.id.toString()}
                  className="tr"
                  data-ocid={`al.item.${i + 1}`}
                >
                  <td className="td">{fmtDate(e.date)}</td>
                  <td className="td">{e.category}</td>
                  <td className="td">{e.description}</td>
                  <td className="td text-red-600">
                    {e.entryType === LedgerEntryType.Debit
                      ? `₹${fmtAmt(e.amount)}`
                      : ""}
                  </td>
                  <td className="td text-green-700">
                    {e.entryType === LedgerEntryType.Credit
                      ? `₹${fmtAmt(e.amount)}`
                      : ""}
                  </td>
                  <td
                    className={`td font-semibold ${e.running < 0 ? "text-red-600" : "text-green-700"}`}
                  >
                    ₹{fmtAmt(Math.abs(e.running))}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="td text-center text-gray-400"
                    data-ocid="al.empty_state"
                  >
                    No entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- P/L Account ----
function PLAccountPage() {
  const backend = useBackend();
  const [data, setData] = useState({ purchases: 0, jobCosts: 0, sales: 0 });

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    Promise.all([
      backend.listFabricPurchases(),
      backend.listJobs(),
      backend.listGSTBills(),
    ]).then(([p, j, b]) => {
      setData({
        purchases: p.reduce((a, x) => a + x.amount, 0),
        jobCosts: j.reduce((a, x) => a + x.amount, 0),
        sales: b.reduce((a, x) => a + x.total, 0),
      });
    });
  }, []);

  const grossProfit = data.sales - data.purchases - data.jobCosts;

  return (
    <div className="max-w-lg">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Profit & Loss Account</h3>
          <button
            type="button"
            data-ocid="pl.print.secondary_button"
            onClick={() => printElement("pl-print")}
            className="btn-secondary text-sm"
          >
            🖨️ Print
          </button>
        </div>
        <div id="pl-print">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium">Total Sales (Revenue)</td>
                <td className="py-2 text-right text-green-700 font-semibold">
                  ₹{fmtAmt(data.sales)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) Fabric Purchases</td>
                <td className="py-2 text-right text-red-600">
                  ₹{fmtAmt(data.purchases)}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) Job Costs (Karigar etc.)</td>
                <td className="py-2 text-right text-red-600">
                  ₹{fmtAmt(data.jobCosts)}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-800">
                <td className="py-3 font-bold text-base">
                  Net Profit / (Loss)
                </td>
                <td
                  className={`py-3 text-right font-bold text-base ${grossProfit >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  ₹{fmtAmt(Math.abs(grossProfit))}{" "}
                  {grossProfit < 0 ? "(Loss)" : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---- Pattern Planning AI ----
function PatternPlanningAI() {
  const [form, setForm] = useState({
    garment: "Kurti",
    size: "M",
    fabricWidth: "44",
  });
  const [result, setResult] = useState<null | {
    pieces: { name: string; l: number; w: number; cut: number }[];
    seam: number;
    total: number;
  }>(null);

  const calculate = () => {
    const sm = { S: 0.9, M: 1.0, L: 1.1, XL: 1.2 }[form.size] || 1.0;
    const pieces: { name: string; l: number; w: number; cut: number }[] =
      {
        Kurti: [
          { name: "Front Body", l: 60 * sm, w: 22, cut: 1 },
          { name: "Back Body", l: 60 * sm, w: 22, cut: 1 },
          { name: "Sleeves", l: 24 * sm, w: 18, cut: 2 },
        ],
        Salwar: [
          { name: "Front", l: 100 * sm, w: 22, cut: 1 },
          { name: "Back", l: 100 * sm, w: 22, cut: 1 },
        ],
        Saree: [
          { name: "Main Body", l: 550, w: 44, cut: 1 },
          { name: "Blouse Piece", l: 90, w: 44, cut: 1 },
        ],
        Blouse: [
          { name: "Front", l: 40 * sm, w: 22, cut: 1 },
          { name: "Back", l: 40 * sm, w: 22, cut: 1 },
          { name: "Sleeves", l: 20, w: 18, cut: 2 },
        ],
      }[form.garment] || [];
    const seam = 1.5;
    const total = pieces.reduce(
      (a, p) => a + ((p.l + seam * 2) * p.cut) / 100,
      0,
    );
    setResult({ pieces, seam, total });
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Pattern Planning (Rule-based AI)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="pai-garment" className="label">
              Garment Type
            </label>
            <select
              id="pai-garment"
              data-ocid="pai.garment.select"
              className="input"
              value={form.garment}
              onChange={(e) =>
                setForm((f) => ({ ...f, garment: e.target.value }))
              }
            >
              {["Kurti", "Salwar", "Saree", "Blouse"].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pai-size" className="label">
              Size
            </label>
            <select
              id="pai-size"
              data-ocid="pai.size.select"
              className="input"
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
            >
              {["S", "M", "L", "XL"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pai-width" className="label">
              Fabric Width (inches)
            </label>
            <select
              id="pai-width"
              data-ocid="pai.width.select"
              className="input"
              value={form.fabricWidth}
              onChange={(e) =>
                setForm((f) => ({ ...f, fabricWidth: e.target.value }))
              }
            >
              {["36", "44", "52", "60"].map((w) => (
                <option key={w}>{w}"</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          data-ocid="pai.calculate.primary_button"
          onClick={calculate}
          className="btn-primary mt-3"
        >
          Calculate Pattern
        </button>
      </div>
      {result && (
        <div className="card">
          <h3 className="font-semibold mb-3">
            Pattern Layout - {form.garment} (Size {form.size})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Piece</th>
                <th className="th">Length (cm)</th>
                <th className="th">Width (cm)</th>
                <th className="th">Cut</th>
              </tr>
            </thead>
            <tbody>
              {result.pieces.map((p, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: list is reordering-safe
                <tr key={i} className="tr">
                  <td className="td font-medium">{p.name}</td>
                  <td className="td">
                    {p.l.toFixed(0)} + {result.seam}cm seam
                  </td>
                  <td className="td">{p.w}</td>
                  <td className="td">{p.cut}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
            <strong>
              Estimated Fabric Required: {result.total.toFixed(2)} meters
            </strong>{" "}
            (at {form.fabricWidth}" width, including seam allowance)
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Fabric Consumption AI ----
function FabricConsumptionAI() {
  const [rows, setRows] = useState([
    { garment: "Kurti", size: "M", qty: "100" },
  ]);
  const [result, setResult] = useState<
    {
      garment: string;
      size: string;
      qty: number;
      perPc: number;
      total: number;
    }[]
  >([]);

  const perPiece: Record<string, Record<string, number>> = {
    Kurti: { S: 2.0, M: 2.2, L: 2.4, XL: 2.6 },
    Salwar: { S: 1.8, M: 2.0, L: 2.2, XL: 2.4 },
    Saree: { S: 6.5, M: 6.5, L: 6.5, XL: 7.0 },
    Blouse: { S: 0.9, M: 1.0, L: 1.1, XL: 1.2 },
  };

  const calculate = () => {
    setResult(
      rows.map((r) => ({
        garment: r.garment,
        size: r.size,
        qty: Number.parseInt(r.qty || "0"),
        perPc: perPiece[r.garment]?.[r.size] || 2.0,
        total:
          Number.parseInt(r.qty || "0") *
          (perPiece[r.garment]?.[r.size] || 2.0),
      })),
    );
  };

  const grandTotal = result.reduce((a, r) => a + r.total, 0);

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Fabric Consumption Calculator</h3>
        <table className="w-full text-sm mb-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="th">Garment</th>
              <th className="th">Size</th>
              <th className="th">Quantity</th>
              <th className="th" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: list is reordering-safe
              <tr key={i}>
                <td className="p-1">
                  <select
                    data-ocid={`fai.garment.select.${i + 1}`}
                    className="input text-xs"
                    value={r.garment}
                    onChange={(e) => {
                      const n = [...rows];
                      n[i].garment = e.target.value;
                      setRows(n);
                    }}
                  >
                    {["Kurti", "Salwar", "Saree", "Blouse"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <select
                    data-ocid={`fai.size.select.${i + 1}`}
                    className="input text-xs w-20"
                    value={r.size}
                    onChange={(e) => {
                      const n = [...rows];
                      n[i].size = e.target.value;
                      setRows(n);
                    }}
                  >
                    {["S", "M", "L", "XL"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <input
                    data-ocid={`fai.qty.input.${i + 1}`}
                    type="number"
                    className="input text-xs w-24"
                    value={r.qty}
                    onChange={(e) => {
                      const n = [...rows];
                      n[i].qty = e.target.value;
                      setRows(n);
                    }}
                  />
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    data-ocid={`fai.remove.delete_button.${i + 1}`}
                    onClick={() => setRows(rows.filter((_, j) => j !== i))}
                    className="btn-xs text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex gap-2">
          <button
            type="button"
            data-ocid="fai.add.secondary_button"
            onClick={() =>
              setRows([...rows, { garment: "Kurti", size: "M", qty: "100" }])
            }
            className="btn-secondary text-sm"
          >
            + Add Row
          </button>
          <button
            type="button"
            data-ocid="fai.calculate.primary_button"
            onClick={calculate}
            className="btn-primary"
          >
            Calculate
          </button>
        </div>
      </div>
      {result.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-3">Fabric Requirements</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="th">Garment</th>
                <th className="th">Size</th>
                <th className="th">Qty</th>
                <th className="th">Per Piece (m)</th>
                <th className="th">Total (m)</th>
              </tr>
            </thead>
            <tbody>
              {result.map((r, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: list is reordering-safe
                <tr key={i} className="tr">
                  <td className="td">{r.garment}</td>
                  <td className="td">{r.size}</td>
                  <td className="td">{r.qty}</td>
                  <td className="td">{r.perPc}</td>
                  <td className="td font-semibold">{r.total.toFixed(1)}m</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td colSpan={4} className="td">
                  Grand Total
                </td>
                <td className="td">{grandTotal.toFixed(1)}m</td>
              </tr>
            </tfoot>
          </table>
          <div className="mt-2 text-sm text-gray-500">
            Add ~5-10% extra for wastage and seam allowances
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Social Media ----
function SocialMediaPage() {
  const backend = useBackend();
  const [_photos] = useState<PhotoLocal[]>(() =>
    JSON.parse(localStorage.getItem("photos") || "[]"),
  );
  const [designs, setDesigns] = useState<Design[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.listDesigns().then(setDesigns);
  }, []);

  const copyCaption = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h3 className="font-semibold mb-2">Share on Social Media</h3>
        <p className="text-sm text-gray-600">
          Copy captions for WhatsApp, Instagram or other platforms.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {designs.map((d, i) => {
          const caption = `✨ New Design Alert! ✨\n\n${d.name} (${d.number})\nCategory: ${d.category}\nSeason: ${d.season}\nFabric: ${d.fabricType}\n\n${d.description}\n\n📞 Contact KARNI IMPEX for orders!`;
          return (
            <div
              key={d.id.toString()}
              className="card border"
              data-ocid={`social.item.${i + 1}`}
            >
              <div className="w-full h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center text-3xl mb-3">
                👗
              </div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-gray-500">
                {d.category} | {d.season}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  data-ocid={`social.copy.button.${i + 1}`}
                  onClick={() => copyCaption(caption, d.id.toString())}
                  className="btn-xs bg-gray-100"
                >
                  {copied === d.id.toString() ? "✓ Copied!" : "📋 Copy Caption"}
                </button>
                <a
                  data-ocid={`social.whatsapp.button.${i + 1}`}
                  href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-xs bg-green-100 text-green-800"
                >
                  📱 WhatsApp
                </a>
              </div>
            </div>
          );
        })}
        {designs.length === 0 && (
          <div
            className="col-span-2 text-center text-gray-400 py-8"
            data-ocid="social.empty_state"
          >
            Add designs first to share on social media
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Main App ----
export default function App() {
  const backend = useBackend();
  const [module, setModule] = useState<Module>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [karigars, setKarigars] = useState<KarigarLocal[]>(() =>
    JSON.parse(localStorage.getItem("karigars") || "[]"),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: backend is stable
  useEffect(() => {
    backend.getCompanyProfile().then(setCompany);
  }, []);

  const navLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === module)?.label ||
    "Dashboard";
  const navIcon =
    NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === module)?.icon ||
    "📊";

  const renderModule = useCallback(() => {
    const jobProps = { company, karigars };
    switch (module) {
      case "dashboard":
        return <Dashboard setModule={setModule} />;
      case "company":
        return <CompanyProfilePage />;
      case "photo":
        return <PhotoMasterPage />;
      case "design":
        return <DesignRegister />;
      case "karigar-master":
        return <KarigarMaster karigars={karigars} setKarigars={setKarigars} />;
      case "fabric-purchase":
        return <FabricPurchasePage />;
      case "fabric-stock":
        return <FabricStockPage />;
      case "fabric-issue":
        return <FabricIssuePage />;
      case "marker":
        return <MarkerPlanningPage />;
      case "production-plan":
        return <ProductionPlanPage />;
      case "dyeing":
        return <JobModule jobTypeLabel="Dyeing" prefix="DY" {...jobProps} />;
      case "print":
        return <JobModule jobTypeLabel="Print" prefix="PR" {...jobProps} />;
      case "embroidery":
        return (
          <JobModule jobTypeLabel="Embroidery" prefix="EM" {...jobProps} />
        );
      case "handwork":
        return <JobModule jobTypeLabel="Handwork" prefix="HW" {...jobProps} />;
      case "cutting":
        return <JobModule jobTypeLabel="Cutting" prefix="CT" {...jobProps} />;
      case "stitching":
        return <JobModule jobTypeLabel="Stitching" prefix="ST" {...jobProps} />;
      case "pressing":
        return <JobModule jobTypeLabel="Pressing" prefix="PS" {...jobProps} />;
      case "packing":
        return <JobModule jobTypeLabel="Packing" prefix="PK" {...jobProps} />;
      case "quality":
        return <QualityCheckPage />;
      case "dispatch":
        return <DispatchPage />;
      case "gst-bill":
        return <GSTBillPage />;
      case "challan-list":
        return <ChallanListPage />;
      case "karigar-ledger":
        return <KarigarLedgerPage karigars={karigars} />;
      case "account-ledger":
        return <AccountLedgerPage />;
      case "pl-account":
        return <PLAccountPage />;
      case "pattern-ai":
        return <PatternPlanningAI />;
      case "fabric-ai":
        return <FabricConsumptionAI />;
      case "social":
        return <SocialMediaPage />;
      default:
        return <Dashboard setModule={setModule} />;
    }
  }, [module, company, karigars]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-56" : "w-14"} bg-slate-900 text-white flex flex-col transition-all duration-200 overflow-hidden shrink-0`}
      >
        <div className="p-3 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <span className="font-bold text-sm text-amber-400">
              KARNI IMPEX
            </span>
          )}
          <button
            type="button"
            data-ocid="app.sidebar_toggle.toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1"
          >
            ☰
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              {sidebarOpen && (
                <div className="px-3 py-1 text-xs text-slate-500 font-semibold mt-2">
                  {g.label}
                </div>
              )}
              {g.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  data-ocid={`nav.${item.id}.link`}
                  onClick={() => setModule(item.id as Module)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                    module === item.id
                      ? "bg-slate-700 text-amber-400 font-medium"
                      : "text-slate-300"
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shrink-0">
          <span className="text-xl">{navIcon}</span>
          <h1 className="font-semibold text-gray-800">{navLabel}</h1>
          {company?.name && (
            <span className="ml-auto text-sm text-gray-400">
              {company.name}
            </span>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
