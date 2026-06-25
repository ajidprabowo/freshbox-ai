"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  CalendarPlus,
  CheckCircle2,
  Package,
  MapPin,
  User,
  Calendar,
} from "lucide-react";
import {
  initializeStorage,
  getBoxes,
  addRental,
  updateBox,
} from "@/lib/storage";
import { FreshBox, Rental, UsageMode } from "@/lib/types";
import { generateId, formatDate } from "@/lib/utils";
import Link from "next/link";

function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedBoxId = searchParams.get("boxId") || "";

  const [boxes, setBoxes] = useState<FreshBox[]>([]);
  const [form, setForm] = useState({
    userName: "",
    boxId: preselectedBoxId,
    startDate: "",
    endDate: "",
    usageMode: "Storage" as UsageMode,
    pickupLocation: "",
    destinationLocation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Rental | null>(null);

  useEffect(() => {
    initializeStorage();
    setBoxes(getBoxes().filter((b) => b.status === "Available"));
    // Default start date to today
    const today = new Date().toISOString().split("T")[0];
    setForm((f) => ({ ...f, startDate: today }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.userName.trim()) e.userName = "Company / user name is required";
    if (!form.boxId) e.boxId = "Please select a FreshBox";
    if (!form.startDate) e.startDate = "Start date required";
    if (!form.endDate) e.endDate = "End date required";
    if (form.startDate && form.endDate && form.endDate <= form.startDate)
      e.endDate = "End date must be after start date";
    if (!form.pickupLocation.trim()) e.pickupLocation = "Pickup location required";
    if (!form.destinationLocation.trim()) e.destinationLocation = "Destination required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);

    const rental: Rental = {
      id: generateId("RENT"),
      userName: form.userName,
      boxId: form.boxId,
      startDate: form.startDate,
      endDate: form.endDate,
      usageMode: form.usageMode,
      pickupLocation: form.pickupLocation,
      destinationLocation: form.destinationLocation,
      status: "Active",
      createdAt: new Date().toISOString(),
    };

    // Update box status to Rented
    const allBoxes = getBoxes();
    const box = allBoxes.find((b) => b.id === form.boxId);
    if (box) {
      updateBox({ ...box, status: "Rented", assignedRentalId: rental.id });
    }

    addRental(rental);
    setConfirmed(rental);
    setSubmitting(false);
  };

  if (confirmed) {
    const box = getBoxes().find((b) => b.id === confirmed.boxId);
    return <BookingConfirmation rental={confirmed} box={box} />;
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Book a FreshBox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the rental details to reserve your cold storage unit
        </p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Section: Who */}
        <FormSection icon={User} title="Renter Information">
          <Field
            label="Company / User Name"
            error={errors.userName}
            required
          >
            <input
              className="form-input"
              placeholder="e.g. PT Agro Nusantara"
              value={form.userName}
              onChange={(e) => setForm({ ...form, userName: e.target.value })}
            />
          </Field>
        </FormSection>

        {/* Section: Box */}
        <FormSection icon={Package} title="Box Selection">
          <Field label="FreshBox Unit" error={errors.boxId} required>
            <select
              className="form-input"
              value={form.boxId}
              onChange={(e) => setForm({ ...form, boxId: e.target.value })}
            >
              <option value="">Select available box…</option>
              {boxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.id} — Type {b.type} | {b.location} | Rp{b.rentalPricePerDay.toLocaleString()}/day
                </option>
              ))}
            </select>
          </Field>

          <Field label="Usage Mode" required>
            <div className="flex gap-2 flex-wrap">
              {(["Storage", "Distribution", "Storage + Distribution"] as UsageMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, usageMode: m })}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.usageMode === m
                      ? "bg-navy-600 text-white border-navy-600"
                      : "border-slate-300 text-slate-600 hover:border-navy-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Field>
        </FormSection>

        {/* Section: Schedule */}
        <FormSection icon={Calendar} title="Rental Period">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" error={errors.startDate} required>
              <input
                type="date"
                className="form-input"
                value={form.startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field label="End Date" error={errors.endDate} required>
              <input
                type="date"
                className="form-input"
                value={form.endDate}
                min={form.startDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </Field>
          </div>
        </FormSection>

        {/* Section: Locations */}
        <FormSection icon={MapPin} title="Locations">
          <Field label="Pickup Location" error={errors.pickupLocation} required>
            <input
              className="form-input"
              placeholder="e.g. Pasar Induk Kramat Jati, Jakarta"
              value={form.pickupLocation}
              onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })}
            />
          </Field>
          <Field label="Destination Location" error={errors.destinationLocation} required>
            <input
              className="form-input"
              placeholder="e.g. Cold Storage Hub Bekasi"
              value={form.destinationLocation}
              onChange={(e) => setForm({ ...form, destinationLocation: e.target.value })}
            />
          </Field>
        </FormSection>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary flex-1"
          >
            {submitting ? "Booking…" : "Confirm Booking"}
          </button>
          <Link href="/boxes" className="btn-secondary text-sm px-4 py-2.5 flex items-center">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}

function BookingConfirmation({ rental, box }: { rental: Rental; box?: FreshBox }) {
  return (
    <div className="p-6 md:p-8 max-w-lg mx-auto">
      <div className="card p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-navy-800">Booking Confirmed!</h2>
          <p className="text-slate-500 text-sm mt-1">Your FreshBox rental has been reserved</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3">
          <ConfRow label="Rental ID" value={rental.id} mono />
          <ConfRow label="Renter" value={rental.userName} />
          <ConfRow label="Box" value={`${rental.boxId} ${box ? `(Type ${box.type})` : ""}`} />
          <ConfRow label="Mode" value={rental.usageMode} />
          <ConfRow label="Period" value={`${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}`} />
          <ConfRow label="Pickup" value={rental.pickupLocation} />
          <ConfRow label="Destination" value={rental.destinationLocation} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/products" className="btn-primary flex-1 text-sm">
            Register Product
          </Link>
          <Link href="/" className="btn-secondary flex-1 text-sm">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ConfRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-slate-500 font-semibold flex-shrink-0">{label}</span>
      <span className={`text-xs text-navy-700 font-semibold text-right ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon size={15} className="text-navy-500" />
        <span className="text-sm font-bold text-navy-700">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading booking form…</div>}>
      <BookingForm />
    </Suspense>
  );
}
