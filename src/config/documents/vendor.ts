import type { RequiredDocument } from "./types";

/**
 * Vendor enrollment.
 *
 * Source: Continuum agent call notes, Desiree and Shavauna, 1–22 Sep 2026.
 * A vendor is an outside business or independent provider billing against its
 * own EIN — no employer relationship, no background check, no EVV. Vendors are
 * paid by invoice to invoices@continuumfs.com, signed off by the representative.
 *
 * The service must sit on the participant's PA/budget under a code Continuum is
 * authorised for (CAG, CAI, SMS). Continuum only pays approved vendors; if a
 * family has already bought from one that is not approved, escalate it.
 */
export const VENDOR_DOCUMENTS: RequiredDocument[] = [
  {
    key: "form-w9",
    label: "Form W-9",
    hint: "Must carry the vendor's own EIN and match the legal business name.",
    required: true,
  },
  {
    key: "state-service-approval",
    label: "Written DBHDD approval that the service qualifies under the code",
    hint: "Needed when the service may not be covered — a personal trainer, for example. Appearing in the ISP is not sufficient. If the state will not approve it, the person can go through employee enrollment instead.",
    required: false,
  },
];
