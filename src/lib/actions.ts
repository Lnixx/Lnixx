"use server";

import { redirect } from "next/navigation";
import { createBooking, createProvider, isSlotTaken } from "./db";
import { CATEGORIES } from "./categories";
import { placeholderImage } from "./placeholder";

export type FormState = { error?: string };

export async function bookAppointment(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const providerId = Number(formData.get("providerId"));
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const customerName = String(formData.get("customerName") || "").trim();
  const customerPhone = String(formData.get("customerPhone") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!date || !time) return { error: "Please pick a date and time." };
  if (!customerName || !customerPhone) {
    return { error: "Please enter your name and phone number." };
  }
  if (isSlotTaken(providerId, date, time)) {
    return { error: "That time slot was just booked by someone else. Pick another." };
  }

  let bookingId: number;
  try {
    bookingId = createBooking({
      providerId,
      customerName,
      customerPhone,
      date,
      time,
      note: note || undefined,
    });
  } catch {
    return { error: "That time slot was just booked by someone else. Pick another." };
  }

  redirect(`/book/${providerId}/confirmation/${bookingId}`);
}

export async function joinAsPro(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "");
  const tagline = String(formData.get("tagline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const price = Number(formData.get("price"));
  const location = String(formData.get("location") || "").trim();
  const portfolioRaw = String(formData.get("portfolio") || "");

  const categoryDef = CATEGORIES.find((c) => c.slug === category);
  if (!name || !categoryDef || !tagline || !bio || !location) {
    return { error: "Please fill in all required fields." };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "Please enter a valid price." };
  }

  let portfolio = portfolioRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (portfolio.length === 0) {
    const seedBase = `${name}-${Date.now()}`;
    portfolio = [
      placeholderImage(`${seedBase}-0`, categoryDef.icon),
      placeholderImage(`${seedBase}-1`, categoryDef.icon),
    ];
  }

  const id = createProvider({
    name,
    category,
    tagline,
    bio,
    price,
    location,
    avatarEmoji: categoryDef.icon,
    portfolio,
  });

  redirect(`/provider/${id}`);
}
