"use client";

import { useActionState, useState } from "react";
import { bookAppointment, type FormState } from "@/lib/actions";
import { TIMES } from "@/lib/slots";


function nextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      value: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }),
    });
  }
  return days;
}

const initialState: FormState = {};

export default function BookingForm({
  providerId,
  price,
  priceUnit,
}: {
  providerId: number;
  price: number;
  priceUnit: string;
}) {
  const [state, formAction, isPending] = useActionState(bookAppointment, initialState);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const days = nextDays(7);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="providerId" value={providerId} />
      <input type="hidden" name="date" value={date ?? ""} />
      <input type="hidden" name="time" value={time ?? ""} />

      <div>
        <h3 className="mb-2 font-semibold text-stone-800 dark:text-stone-100">1. Pick a day</h3>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDate(d.value)}
              className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                date === d.value
                  ? "border-brand bg-brand text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-brand dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-stone-800 dark:text-stone-100">2. Pick a time</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTime(t)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                time === t
                  ? "border-brand bg-brand text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-brand dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-stone-800 dark:text-stone-100">3. Your details</h3>
        <div className="flex flex-col gap-3">
          <input
            name="customerName"
            placeholder="Full name"
            required
            className="rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
          />
          <input
            name="customerPhone"
            placeholder="Phone number"
            required
            className="rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
          />
          <textarea
            name="note"
            placeholder="Anything the pro should know? (optional)"
            className="rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
            rows={3}
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {isPending ? "Booking…" : `Pay $${price} & Confirm Booking`}
      </button>
      <p className="-mt-3 text-center text-xs text-stone-400">
        Demo payment — no real card is charged. Price shown per {priceUnit}.
      </p>
    </form>
  );
}
