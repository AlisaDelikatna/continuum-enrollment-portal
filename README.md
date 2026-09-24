# Continuum Fiscal Services — Enrollment Portal (prototype)

A working demo of an enrollment and document-intake portal for a Georgia Medicaid
fiscal intermediary serving self-directed waiver programs (COMP, NOW, CCSP,
SOURCE, ICWP).

Built to be walked through live. It is **not** production software: there is no
real authentication, no encryption at rest, and no audit-grade access control.
**All data is invented — no real PHI, and no email ever leaves the machine.**

---

## Setup

```bash
npm install     # also runs `prisma generate`
npm run seed    # creates the SQLite DB and loads ~25 demo enrollees
npm run dev     # http://localhost:3000
```

`npm run seed` is idempotent — run it any time to reset the demo to a clean
state. It wipes every table, deletes and regenerates `/uploads`, and rebuilds
the sample enrollees, documents, status history and outbox.

Requires Node 20.9+.

### What gets created

| Path              | What it is                                              |
| ----------------- | ------------------------------------------------------- |
| `prisma/dev.db`   | SQLite database (git-ignored, recreated by the seed)     |
| `uploads/`        | Uploaded files on local disk (git-ignored)               |

---

## Signing in

There is no login. The header has an **Acting as** dropdown listing every seeded
user — pick one and the whole app renders as that person. The choice is stored
in a cookie.

| Role      | Who                                        | Lands on  |
| --------- | ------------------------------------------ | --------- |
| Admin     | Renee Calloway                             | `/admin`  |
| Reps      | Priya Raman, Marcus Bell, Tanya Okonkwo    | `/rep`    |
| Enrollees | 25 employees, vendors and participants     | `/me`     |

Submitting a new enrollment automatically signs you in as that new enrollee.

---

## Demo walkthrough (about five minutes)

1. **Enroll as a new employee** — go to `/enroll`.
   - Step 1: pick **Employee**.
   - Step 2: fill in the form. Tick **more than one waiver program** — an
     enrollee can be enrolled under several. In *Representative email* type
     `priya.raman@continuumfiscal.example` — an existing rep, so the new record
     is linked to her automatically.
   - Step 3: attach a file to one or two slots, or press **Skip for now**.
   - The confirmation screen shows the enrollment ID (`CFS-EMP-00xx`) and the
     status **Received**. You are now signed in as that employee; `/me` shows
     their timeline and remaining documents.

2. **Upload a document as the rep** — switch **Acting as** to *Priya Raman*.
   `/rep` lists only her employees, with a status badge and an "n of m documents"
   count each. Open the new employee and upload a file on their behalf. Her name
   is recorded as the uploader. No email is sent — by design.

3. **Change status as admin** — switch to *Renee Calloway* and open the same
   record from `/admin`. Choose **Missing info**, write a note saying exactly
   what is outstanding, and save. The note is required for this status.

4. **See both emails** — go to `/outbox`. The status-change message is addressed
   to the employee **and** to Priya, and the missing-info note appears in the
   body under *WHAT WE STILL NEED*. The enrollee sees the same note in an amber
   banner at the top of `/me`.

5. **Send the daily upload digest** — back on `/admin`, use the **Daily upload
   digest** panel and press **Send today's digest**. One email to admin staff
   lists every document uploaded that day — enrollee, type, document name and
   who uploaded it. The date field is editable, so you can send a digest for any
   past day too.

Other things worth showing: the filters on `/admin` (type, program, status,
search) which live in the URL; rep reassignment on the admin detail page; and
the status history panel, which never overwrites — every transition is its own
timestamped row.

---

## Pages

| Route         | Who          | What                                                                    |
| ------------- | ------------ | ----------------------------------------------------------------------- |
| `/`           | Anyone       | Role-aware landing: intake path when signed out, your own numbers when in |
| `/enroll`     | Public       | Three-step intake: type → form → documents → confirmation                |
| `/me`         | Enrollees    | Status timeline, notes, document checklist, upload                       |
| `/rep`        | Reps         | Their employees with status badges; detail view with upload              |
| `/admin`      | Admin staff  | All enrollees, filters, status changes with notes, rep assignment, digest |
| `/outbox`     | Admin staff  | Every generated email, filterable by kind                                |

---

## Statuses

`Received → Acknowledged → In review → Missing info → Processed → Active`

Every change writes a row to `StatusEvent` with the new status, the timestamp,
the user who made it and the note. Nothing is overwritten, and the table is
indexed on `(enrollmentId, createdAt)`, `(status, createdAt)` and `createdAt`
so the existing enrollment dashboard can query time-in-status directly.

**Missing info** requires a note. That note is shown prominently — an amber
banner at the top of the enrollee's status page, a callout on the rep's list,
and a `WHAT WE STILL NEED` block in the email.

## Email rules

Nothing is sent. Every message is written to the `OutboxEmail` table and
rendered at `/outbox` exactly as it would go out.

| Event                              | Recipients                                     |
| ---------------------------------- | ---------------------------------------------- |
| Status change on an **employee**   | the employee **and** their assigned rep         |
| Status change on a **participant** | the participant                                 |
| Status change on a **vendor**      | the vendor                                      |
| New enrollment submitted           | same rules as a status change to *Received*     |
| **Document upload**                | nobody — it rolls into the daily admin digest   |

The digest is `buildDailyDigest(date)` in `src/lib/email.ts`: it takes any date,
returns the recipients, subject, body and the parsed rows, and sends nothing.
`sendDailyDigest(date)` wraps it and writes the result to the outbox. The admin
page button calls the latter; a cron job could call it just as easily.

---

## Required document lists

One file per enrollee type. Sources: Continuum agent call notes (Desiree and
Shavauna, 1–22 Sep 2026) and the packages Shavauna actually sends — "INTEREST IN
CONTINUUM" (26 Aug 2026) and "GOOD TO SERVE for …" (30 Jul 2026).

Continuum sends each packet as a **single bundled PDF** — `2025 participant
packet.pdf`, `2026 EMPLOYEE PACKET.pdf` — with separate sample-form PDFs showing
completed examples. The config breaks each bundle into its individual forms so
an enrollee can return them piecemeal and staff can see exactly what is
outstanding.

```
src/config/documents/employee.ts
src/config/documents/vendor.ts
src/config/documents/participant.ts
```

Each entry is `{ key, label, hint?, required, programs?, unconfirmed? }`.
Renaming a `label` is safe at any time. Changing a `key` orphans documents
already uploaded under the old key, so prefer adding a new entry.
`required: false` entries are excluded from the "n of m required received"
counts.

- `programs` limits a requirement to particular waivers. The TB test and
  physical is `["ICWP"]`, so an ICWP employee is asked for 12 documents and a
  COMP employee for 11.
- `unconfirmed: true` marks a requirement that came from only a few source calls.
  It renders an amber **Unconfirmed** tag on the checklist. IRS 2678 and 8821
  currently carry it — confirm with a supervisor and clear the flag.

### Open questions in the source notes

| Item | Status |
| ---- | ------ |
| Whether a signed payroll schedule is collected back, or only sent out as reference | flagged `unconfirmed` — Continuum emails a pay schedule PDF to new employers |
| IRS 2678 / 8821 as participant-employer with Continuum as designee | flagged `unconfirmed` in the config and tagged in the UI |
| ~~`enrollment@` vs `enrollments@`~~ | **Resolved: `enrollments@continuumfs.com`** (plural), per the Continuum signature block in two of Shavauna's emails, 30 Jul and 26 Aug 2026 |
| Fingerprint fee reimbursement — receipts to `invoices@`, ~10 business days by money order | not modelled; no reimbursement flow exists yet |
| Program scope | the notes say Continuum serves COMP and NOW for participant direction, but ICWP, CCSP and SOURCE all appear elsewhere. All five are configured, per the original brief |
| Portal URL in emails | `https://portal.continuumfs.com` is a **placeholder** — the real URL was never given |

Not modelled at all: the Checkpoint fingerprint flow and the Good to Go email,
the family-hire approval and yearly renewal cycle (including the time-entry lock
and one-week courtesy extension), EVV, time entry and payroll. Those are
separate workflows, not enrollment intake.

Programs live in `src/config/programs.ts`, statuses in `src/config/statuses.ts`.
The employee-vs-vendor comparison shown on step 1 of the enrollment flow is
`EMPLOYEE_VS_VENDOR` in the same file.

An enrollment can carry any number of waiver programs. They are stored one row
per `(enrollment, program)` in `EnrollmentProgram` rather than as a delimited
string, so the admin filter and any dashboard query can filter and group by
program directly.

---

## Stack and layout

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma + SQLite ·
uploads on local disk.

```
prisma/
  schema.prisma      User, Enrollment, StatusEvent, Document, OutboxEmail
  seed.ts            all demo data, including generated placeholder PDFs
src/
  app/               routes (see table above) + /api/documents/[id] file serving
  components/        header, role switcher, wizard, timeline, forms, checklist
  config/            programs, statuses, per-type required document lists
  lib/
    actions.ts       server actions: enroll, upload, status change, assign, digest
    email.ts         recipient rules, message bodies, daily digest builder
    enrollments.ts   ref IDs, document progress, date formatting
    session.ts       the acting-user cookie
    storage.ts       disk writes for /uploads
```

## Who sees what

| Surface                    | Signed out | Enrollee        | Rep                  | Admin |
| -------------------------- | ---------- | --------------- | -------------------- | ----- |
| Landing page numbers       | none       | their record    | their caseload       | all   |
| `/me`                      | —          | own record only | —                    | —     |
| `/rep`, `/rep/[id]`        | —          | —               | own employees only   | —     |
| `/admin`, `/admin/[id]`    | —          | —               | —                    | all   |
| `/outbox`                  | —          | —               | —                    | all   |

The outbox is the system-wide notification log — it holds every enrollee's name,
address and status notes — so it is admin-only. A rep must not read participant
or vendor correspondence.

## Demo switches

`src/config/demo.ts`:

- `REQUIRE_COMPLETE_ENROLLMENT_FORM` — **false**. The public enrollment form
  blocks nothing, so a walkthrough can click straight through an empty form.
  A blank name becomes `Unnamed enrollee (CFS-EMP-0013)`, a blank or malformed
  email becomes `cfs-emp-0013@placeholder.invalid`, and an enrollment may carry
  no waiver program at all. Flip to `true` to restore normal validation (name,
  a valid email, and at least one program).

## Known shortcuts (deliberate, for the demo)

- No authentication. The role switcher is the login, and any visitor can pick
  any user. Every page and server action does check the acting user's role, so a
  rep cannot open another rep's employee or upload on their behalf — but that
  check is only as strong as the cookie.
- `/api/documents/[id]` serves any uploaded file to anyone who has the id.
- Uploads are not scanned, size-limited or type-restricted.
- Sending email is stubbed entirely; wiring a real provider means replacing the
  `queue()` function in `src/lib/email.ts`.
- No pagination on the admin table — fine at 25 records, not at 25,000.
