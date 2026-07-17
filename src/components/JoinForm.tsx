"use client";

import { useActionState } from "react";
import { joinAsPro, type FormState } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";

const initialState: FormState = {};

export default function JoinForm() {
  const [state, formAction, isPending] = useActionState(joinAsPro, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Your name / business name *
        </label>
        <input
          name="name"
          required
          placeholder="e.g. Omar's Plumbing"
          className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Category *
        </label>
        <select
          name="category"
          required
          defaultValue=""
          className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
        >
          <option value="" disabled>
            Choose a service
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.icon} {c.nameEn} ({c.nameAr})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          One-line tagline *
        </label>
        <input
          name="tagline"
          required
          placeholder="e.g. Fast, reliable car window tinting"
          className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          About you / your work *
        </label>
        <textarea
          name="bio"
          required
          rows={4}
          placeholder="Tell customers about your experience and what makes your work great."
          className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Price ($) *
          </label>
          <input
            name="price"
            type="number"
            min={1}
            required
            placeholder="30"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
            Location *
          </label>
          <input
            name="location"
            required
            placeholder="e.g. Downtown"
            className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
          Portfolio photo links (optional)
        </label>
        <input
          name="portfolio"
          placeholder="Paste image URLs separated by commas"
          className="w-full rounded-xl border border-stone-200 px-4 py-3 dark:border-stone-700 dark:bg-stone-900"
        />
        <p className="mt-1 text-xs text-stone-400">
          Leave blank for now — we&apos;ll add sample photos you can replace later.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full rounded-full bg-brand px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {isPending ? "Creating your profile…" : "Create my profile"}
      </button>
    </form>
  );
}
