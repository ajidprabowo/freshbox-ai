"use client";

import { useState } from "react";
import { Calculator, Printer, RotateCcw } from "lucide-react";
import CostBreakdown from "@/components/CostBreakdown";
import {
  calculateRentalCost,
  DAILY_RATE,
  CostBreakdownResult,
} from "@/lib/calculations";
import { BoxType, UsageMode } from "@/lib/types";
import { formatIDR, generateId } from "@/lib/utils";

const EMPTY_FORM = {
  boxType: "M" as BoxType,
  numberOfBoxes: 1,
  rentalDays: 3,
  usageMode: "Storage" as UsageMode,
  estimatedEnergyKwh: 12,
  hasPickupDelivery: false,
  hasCleaning: false,
  lateReturnDays: 0,
};

export default function CalculatorPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [breakdown, setBreakdown] = useState<CostBreakdownResult | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceId] = useState(generateId("INV"));

  const handleCalculate = () => {
    const result = calculateRentalCost({
      boxType: form.boxType,
      numberOfBoxes: form.numberOfBoxes,
      rentalDays: form.rentalDays,
      estimatedEnergyKwh: form.estimatedEnergyKwh,
      hasPickupDelivery: form.hasPickupDelivery,
      hasCleaning: form.hasCleaning,
      lateReturnDays: form.lateReturnDays,
    });
    setBreakdown(result);
    setShowInvoice(false);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setBreakdown(null);
    setShowInvoice(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Rental Cost Calculator</h1>
        <p className="text-sm text-slate-500 mt-1">
          Estimate your FreshBox rental cost before booking
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input form */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-navy-600" />
            <h2 className="section-title">Rental Parameters</h2>
          </div>

          {/* Box type */}
          <div>
            <label className="form-label">Box Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["S", "M", "L"] as BoxType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, boxType: type })}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    form.boxType === type
                      ? "bg-navy-600 text-white border-navy-600"
                      : "border-slate-300 text-slate-600 hover:border-navy-400"
                  }`}
                >
                  <div className="font-extrabold text-lg">{type}</div>
                  <div className={`text-xs mt-0.5 ${form.boxType === type ? "text-navy-200" : "text-slate-400"}`}>
                    {formatIDR(DAILY_RATE[type])}/day
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of boxes + rental days */}
          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Number of Boxes"
              value={form.numberOfBoxes}
              min={1}
              max={20}
              onChange={(v) => setForm({ ...form, numberOfBoxes: v })}
            />
            <NumberField
              label="Rental Duration (days)"
              value={form.rentalDays}
              min={1}
              max={365}
              onChange={(v) => setForm({ ...form, rentalDays: v })}
            />
          </div>

          {/* Usage mode */}
          <div>
            <label className="form-label">Usage Mode</label>
            <div className="space-y-2">
              {(["Storage", "Distribution", "Storage + Distribution"] as UsageMode[]).map((m) => (
                <label key={m} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      form.usageMode === m
                        ? "border-navy-600 bg-navy-600"
                        : "border-slate-300 group-hover:border-navy-400"
                    }`}
                    onClick={() => setForm({ ...form, usageMode: m })}
                  >
                    {form.usageMode === m && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span
                    className="text-sm text-slate-700"
                    onClick={() => setForm({ ...form, usageMode: m })}
                  >
                    {m}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Energy */}
          <NumberField
            label="Estimated Energy Usage (kWh)"
            value={form.estimatedEnergyKwh}
            min={0}
            max={10000}
            step={0.5}
            onChange={(v) => setForm({ ...form, estimatedEnergyKwh: v })}
          />

          {/* Optional services */}
          <div>
            <label className="form-label">Optional Services</label>
            <div className="space-y-2">
              <CheckOption
                label="Pickup & Delivery Service"
                sublabel="+Rp50,000 flat fee"
                checked={form.hasPickupDelivery}
                onChange={(v) => setForm({ ...form, hasPickupDelivery: v })}
              />
              <CheckOption
                label="Cleaning Service"
                sublabel={`+Rp25,000 × ${form.numberOfBoxes} box(es)`}
                checked={form.hasCleaning}
                onChange={(v) => setForm({ ...form, hasCleaning: v })}
              />
            </div>
          </div>

          {/* Late return */}
          <NumberField
            label="Late Return Days (if applicable)"
            value={form.lateReturnDays}
            min={0}
            max={30}
            onChange={(v) => setForm({ ...form, lateReturnDays: v })}
          />

          <div className="flex gap-3 pt-2">
            <button onClick={handleCalculate} className="btn-primary flex-1">
              Calculate Cost
            </button>
            <button onClick={handleReset} className="btn-secondary px-3">
              <RotateCcw size={15} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!breakdown ? (
            <div className="card p-12 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
              <Calculator size={40} className="text-slate-200 mb-3" />
              <p className="text-slate-400 font-medium">Enter parameters and click</p>
              <p className="text-slate-400 font-medium">"Calculate Cost" to see the breakdown</p>
            </div>
          ) : (
            <>
              <CostBreakdown
                breakdown={breakdown}
                onGenerateInvoice={() => setShowInvoice(true)}
              />

              {/* Quick summary */}
              <div className="card p-4 grid grid-cols-2 gap-3">
                <SummaryItem label="Box Type" value={`FreshBox ${form.boxType}`} />
                <SummaryItem label="Boxes" value={`${form.numberOfBoxes} unit(s)`} />
                <SummaryItem label="Duration" value={`${form.rentalDays} day(s)`} />
                <SummaryItem label="Energy" value={`${form.estimatedEnergyKwh} kWh`} />
                <SummaryItem
                  label="Daily Rate"
                  value={formatIDR(DAILY_RATE[form.boxType])}
                />
                <SummaryItem
                  label="Per Box Subtotal"
                  value={formatIDR(DAILY_RATE[form.boxType] * form.rentalDays)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice preview */}
      {showInvoice && breakdown && (
        <InvoicePreview
          invoiceId={invoiceId}
          form={form}
          breakdown={breakdown}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}

function InvoicePreview({
  invoiceId,
  form,
  breakdown,
  onClose,
}: {
  invoiceId: string;
  form: typeof EMPTY_FORM;
  breakdown: CostBreakdownResult;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card p-0 overflow-hidden border-2 border-navy-200">
      {/* Invoice toolbar */}
      <div className="bg-navy-50 border-b border-navy-200 px-6 py-3 flex items-center justify-between no-print">
        <span className="text-sm font-semibold text-navy-700">Invoice Preview</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn-primary text-sm py-2 flex items-center gap-2"
          >
            <Printer size={14} />
            Print / Save PDF
          </button>
          <button onClick={onClose} className="btn-secondary text-sm py-2">
            Close
          </button>
        </div>
      </div>

      {/* Invoice content */}
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-extrabold text-navy-800">INVOICE</h2>
            <p className="text-sm text-slate-500 font-mono mt-1">{invoiceId}</p>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-navy-700 text-lg">FreshBox AI</p>
            <p className="text-xs text-slate-500">Cold Chain Management Platform</p>
            <p className="text-xs text-slate-500 mt-1">Jakarta, Indonesia</p>
          </div>
        </div>

        <div className="border-t border-b border-slate-200 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Invoice Date</p>
            <p className="font-semibold text-slate-700">{today}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Usage Mode</p>
            <p className="font-semibold text-slate-700">{form.usageMode}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
              <th className="text-right py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount (IDR)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: `FreshBox ${form.boxType} × ${form.numberOfBoxes} box × ${form.rentalDays} days`, value: breakdown.boxRentalCost },
              { label: `Energy usage (${form.estimatedEnergyKwh} kWh × Rp1,500)`, value: breakdown.energyCost },
              { label: "Pickup & Delivery Service", value: breakdown.pickupDeliveryCost },
              { label: `Cleaning Service × ${form.numberOfBoxes} box(es)`, value: breakdown.cleaningCost },
              { label: `Late Return Fee (${form.lateReturnDays} days)`, value: breakdown.lateReturnFee },
            ]
              .filter((item) => item.value > 0)
              .map((item) => (
                <tr key={item.label} className="border-b border-slate-100">
                  <td className="py-3 text-slate-700">{item.label}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">
                    {formatIDR(item.value)}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy-200">
              <td className="pt-4 font-extrabold text-navy-800 text-base">TOTAL</td>
              <td className="pt-4 text-right font-extrabold text-navy-800 text-xl">
                {formatIDR(breakdown.totalCost)}
              </td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-slate-400 text-center pt-4 border-t border-slate-100">
          This is an estimated invoice. Final charges may vary based on actual usage. FreshBox AI MVP v0.1
        </p>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-10 w-10 rounded-l-xl border border-r-0 border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold flex-shrink-0"
        >
          −
        </button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          className="form-input !rounded-none text-center flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="h-10 w-10 rounded-r-xl border border-l-0 border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold flex-shrink-0"
        >
          +
        </button>
      </div>
    </div>
  );
}

function CheckOption({
  label,
  sublabel,
  checked,
  onChange,
}: {
  label: string;
  sublabel: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-navy-300 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-navy-600 flex-shrink-0"
      />
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{sublabel}</p>
      </div>
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-navy-700 mt-0.5">{value}</p>
    </div>
  );
}
