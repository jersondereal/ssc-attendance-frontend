// When a student registers with an ID that's already taken, the backend saves
// their record with a " (n)" suffix (e.g. "24-0951 (1)") so the registration
// still succeeds. That suffix is an internal de-duplication marker: it must
// stay in the stored value and in the QR code (so scans resolve to the right
// row) and in the admin Edit form (so admins can reconcile it), but it should
// be hidden from all read-only, viewer-facing displays.
//
// Use this helper anywhere a student ID is shown to a viewer. Do NOT use it for
// API calls, QR code values, or the admin Edit form — those need the raw ID.
export const formatStudentIdForDisplay = (
  id: string | null | undefined
): string => (id ?? "").replace(/\s*\(\d+\)$/, "");
