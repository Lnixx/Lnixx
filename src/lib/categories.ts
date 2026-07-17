export type Category = {
  slug: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  priceUnit: string;
};

export const CATEGORIES: Category[] = [
  { slug: "coach", nameEn: "Coach", nameAr: "مدرب", icon: "🏋️", priceUnit: "session" },
  { slug: "barber", nameEn: "Barber", nameAr: "حلاق", icon: "💈", priceUnit: "visit" },
  { slug: "painter", nameEn: "Painter", nameAr: "دهان", icon: "🎨", priceUnit: "job" },
  { slug: "plumber", nameEn: "Plumber", nameAr: "سباك", icon: "🔧", priceUnit: "job" },
  { slug: "tinting", nameEn: "Car Tinting", nameAr: "تضليل", icon: "🚗", priceUnit: "job" },
  { slug: "electrician", nameEn: "Electrician", nameAr: "كهربائي", icon: "💡", priceUnit: "job" },
  { slug: "cleaning", nameEn: "Cleaning", nameAr: "تنظيف", icon: "🧹", priceUnit: "visit" },
  { slug: "ac", nameEn: "AC Technician", nameAr: "فني تكييف", icon: "❄️", priceUnit: "job" },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
