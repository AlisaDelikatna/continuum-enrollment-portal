export type RequiredDocument = {
  /** Stable slug stored on Document.docKey. Changing it orphans existing uploads. */
  key: string;
  /** What the enrollee sees. Safe to rename. */
  label: string;
  /** Short helper text under the label. */
  hint?: string;
  /** Required documents are counted in the "n of m" progress readouts. */
  required: boolean;
};
