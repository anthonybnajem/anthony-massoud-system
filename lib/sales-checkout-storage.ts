import type { CartItem } from "@/components/pos-data-provider";

export type SalesCheckoutSession = {
  id: string;
  cart: CartItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation: string;
  selectedCustomerId: string;
  selectedProjectId: string;
  rentalStartDate: string;
  rentalEndDate: string;
  saleNotes: string;
  paymentMethod: string;
  selectedEmployeeId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number;
  discountLabel?: string;
  discountId?: string;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
};

type StoredDraft = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  session: SalesCheckoutSession;
};

const ACTIVE_CHECKOUT_KEY = "sales:checkout:active";
const CHECKOUT_DRAFTS_KEY = "sales:checkout:drafts";

const canUseStorage = () => typeof window !== "undefined";

export const getActiveCheckoutSession = (): SalesCheckoutSession | null => {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_CHECKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SalesCheckoutSession;
  } catch {
    return null;
  }
};

export const setActiveCheckoutSession = (session: SalesCheckoutSession): void => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ACTIVE_CHECKOUT_KEY, JSON.stringify(session));
};

export const clearActiveCheckoutSession = (): void => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(ACTIVE_CHECKOUT_KEY);
};

const getStoredDrafts = (): StoredDraft[] => {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CHECKOUT_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setStoredDrafts = (drafts: StoredDraft[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(CHECKOUT_DRAFTS_KEY, JSON.stringify(drafts));
};

export const listCheckoutDrafts = (): Array<
  Omit<StoredDraft, "session">
> => {
  return getStoredDrafts()
    .map((draft) => ({
      id: draft.id,
      name: draft.name,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
};

export const saveCheckoutDraft = (
  session: SalesCheckoutSession,
  name?: string
): string => {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const safeName =
    name?.trim() || `Draft ${new Date().toLocaleString("en-US")}`;
  const drafts = getStoredDrafts();
  drafts.push({
    id,
    name: safeName,
    createdAt: now,
    updatedAt: now,
    session: {
      ...session,
      updatedAt: now,
    },
  });
  setStoredDrafts(drafts);
  return id;
};

export const loadCheckoutDraft = (id: string): SalesCheckoutSession | null => {
  const draft = getStoredDrafts().find((item) => item.id === id);
  return draft?.session || null;
};

export const deleteCheckoutDraft = (id: string): void => {
  const next = getStoredDrafts().filter((item) => item.id !== id);
  setStoredDrafts(next);
};
