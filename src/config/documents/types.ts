export type RequiredDocument = {
  /** Stable slug stored on Document.docKey. Changing it orphans existing uploads. */
  key: string;
  /** What the enrollee sees. Safe to rename. */
  label: string;
  /** Short helper text under the label. */
  hint?: string;
  /** Required documents are counted in the "n of m" progress readouts. */
  required: boolean;
  /**
   * Only ask for this document when the enrollment includes one of these waiver
   * programs. Omit for documents every enrollment of this type needs.
   */
  programs?: string[];
  /**
   * Set when the requirement came from only a few source calls and has not been
   * confirmed with a supervisor. Surfaced in the UI so nobody treats it as settled.
   */
  unconfirmed?: boolean;
};
