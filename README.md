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
npm run demo    # reseeds to a clean state, then serves on http://localhost:3000
```

`npm run demo` is the one to use before presenting — it resets the data and
starts the server in a single step. The parts separately:

```bash
npm run seed    # wipe and reload ~25 demo enrollees, documents and emails
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

Verified end to end against the seeded data.

1. **Enroll as a new employee** — go to `/enroll`.
   - Step 1: pick **Employee**. The *"Not sure whether a caregiver is an employee
     or a vendor?"* panel below the cards is the comparison agents give on every
     caregiver call.
   - Step 2: nothing is required, so you can click straight through if you want.
     To make the rest of the walkthrough work, fill in a name and email, tick
     **two waiver programs** (say COMP and ICWP), set a relationship, and put
     `priya.raman@continuumfiscal.example` in *Representative email* — she is a
     seeded rep, so the record links to her automatically.
   - Step 3 opens with **Your forms**: the real Continuum packets for that
     enrollee type, tagged complete-and-return, example-only or
     keep-for-reference. Below them, one upload slot per form in the packet.
     Attach one or press **Skip for now**.
   - The confirmation screen shows the enrollment ID and the status **Received**.
     You are now signed in as that employee, so `/me` shows their timeline, the
     blank forms again, and everything still outstanding.

2. **Upload a document as the rep** — switch **Acting as** to *Priya Raman*.
   `/rep` lists only her employees. Open the new one and upload on their behalf;
   her name is recorded as the uploader. No email is sent — by design. With COMP
   and ICWP selected the checklist shows 12 required documents.

3. **Change status as admin** — switch to *Renee Calloway* and open the same
   record from `/admin`. Choose **Missing info** and write a note saying exactly
   what is outstanding. The note is required for that status, and the save
   confirms who was notified.

4. **See both emails** — go to `/outbox` (admin-only). The status-change message
   is addressed to the employee **and** to Priya, with the note under *WHAT WE
   STILL NEED*. The enrollee sees the same note in an amber banner on `/me`.

5. **Send the daily upload digest** — back on `/admin`, press **Send today's
   digest**. One email to admin staff listing every document uploaded that day:
   enrollee, type, document name and who uploaded it. The date is editable, so
   you can send a digest for any past day.

Other things worth showing:

- the amber **Unconfirmed** tags on the checklist — requirements where the
  packet and the call notes disagree, surfaced rather than quietly resolved
- program-conditional requirements: a CCSP participant is asked for the CCSP
  Cost Share Agreement, a COMP participant is not
- `/admin` filters (type, program, status, search), which live in the URL
- rep reassignment on the admin detail page
- the status history panel, which never overwrites — every transition is its
  own timestamped row

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

## Blank forms

`public/forms/` holds the real Continuum packets, listed in
`src/config/packets.ts` per enrollee type. They appear in three places:

- step 3 of the enrollment flow, above the upload slots
- `/me`, so an enrollee can get them back at any time
- the enrollment confirmation email in `/outbox`, as links

This is the **"INTEREST IN CONTINUUM"** package — the blank forms, sent when
someone first enquires. It is deliberately *not* the good-to-serve / Good to Go
welcome package, which goes out only after approval and carries portal
credentials, pay rules and EVV instructions.

For reference, what triggers each email in current operations:

| Email | Recipient | Trigger |
| ----- | --------- | ------- |
| INTEREST IN CONTINUUM | prospect / rep | someone expresses interest |
| Fingerprint Instructions | employee, rep CC'd | employee packet received **complete** |
| Good to Go | employee, employer CC'd | background check returns **eligible**, within 24–48h; carries portal credentials |
| GOOD TO SERVE | participant | notarized RD-1061, ICD-10 code, training certificate **and an active PA/budget visible in GAMMIS** |

Only the first is modelled. The portal's own status-change emails are a separate
mechanism from these four.

## Statuses

Employees, participants and vendors do not move through the same steps, so each
type has its own pipeline (`src/config/statuses.ts`), drawn from how Continuum
actually works:

| | Pipeline |
| --- | --- |
| **Employee** | Packet sent → Packet received → In review → *Missing info* → Fingerprints pending → Background check eligible → **Good to go** |
| **Participant** | Packet sent → Packet received → In review → *Missing info* → Awaiting PA in GAMMIS → **Good to serve** |
| **Vendor** | Packet sent → Packet received → In review → *Missing info* → Awaiting DBHDD approval → **Approved vendor** |

*Missing info* is a hold rather than a forward step: it sits off the progress
strip, which shows where the record stalled.

Two steps carry the constraints that actually block records:

- **Awaiting authorisation** — for a new enrollee the PA appears at the *end* of
  the sequence, not the start. Enrolling with Continuum is itself one of the
  prerequisites for it, so there is nothing to look up at intake.
  - **COMP/NOW** — the PA shows at "approved" status in IDD-Connects, triggered
    by the support coordinator's ISP version change
  - **CCSP/SOURCE** — the care coordinator enters a SAF, which loads into
    GAMMIS as the PA
  - **ICWP** — timing unconfirmed; check with the case manager or waiver manual
  - New enrollees can only start on the **1st of the month**. Continuum does not
    create PAs and cannot load one from an email; if it has not appeared, the
    support coordinator or case manager is the first call.
- **Fingerprints pending / Good to go** — the employee cannot work, use EVV,
  enter time or be paid until Good to go lands. Separately, the *participant's*
  authorisation must be live before any of it can be billed; EVV visits logged
  before the PA lands will reject.

Upstream prerequisites for COMP/NOW that sit before this packet and are not
collected in the portal: complete PD training, sign the PD MOU and notify
support coordination, choose a fiscal intermediary, and decide which services
are participant-directed rather than traditional. The training certificate is
valid for **90 days** and must fall within 90 days of the Request for Clinical
Review.

Each status carries staff-facing `description` text, shown when an admin changes
status, and some carry plain-language `guidance` shown to the enrollee and their
rep on the status page.

### The existing dashboard keeps working

The original brief specified six generic statuses whose timestamps feed an
existing dashboard. Every pipeline status maps to one of those six, and **both**
values are written to the `Enrollment` row and to every `StatusEvent`:

| Legacy stage | Pipeline statuses that roll up to it |
| --- | --- |
| Received | Packet sent |
| Acknowledged | Packet received |
| In review | In review |
| Missing info | Missing info |
| Processed | Fingerprints pending · Background check eligible · Awaiting PA · Awaiting DBHDD approval |
| Active | Good to go · Good to serve · Approved vendor |

`legacyStatus` is indexed on both tables, so existing queries keep working
untouched while the portal shows the real vocabulary. The admin and landing page
tiles roll up to the six; the per-record views show the real steps.

Every change writes a `StatusEvent` row with both statuses, the timestamp, the
user who made it and the note. Nothing is overwritten. **Missing info** requires
a note, shown as an amber banner on the enrollee's status page, a callout on the
rep's list, and a `WHAT WE STILL NEED` block in the email.

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
packet.pdf` (25 pages), `2026 EMPLOYEE PACKET.pdf` (17 pages) — with separate
sample-form PDFs showing completed examples. The config breaks each bundle into
its individual forms so an enrollee can return them piecemeal and staff can see
exactly what is outstanding.

The participant list is taken from the **Fiscal Employer Agent Participant
Enrollment Checklist** on page 4 of the packet, which is authoritative. Forms the
checklist marks "Supplemental — keep for future use" are deliberately *not*
collected: Payroll Calendar, Online Time Sheet Instructions, Information Update
Form, Rate Sheet, Termination Form, Separation Notice, What It Costs You.

Both lists now come from the packets' own checklists rather than from notes
about them:

- participant — "Fiscal Employer Agent Participant Enrollment Checklist",
  page 4 of `2025 participant packet.pdf`
- employee — "Fiscal Employer Agent Employee Enrollment Checklist", page 2 of
  `2026 EMPLOYEE PACKET.pdf` (17 scanned pages, read by OCR)

Each form inside a packet is its own slot, so an enrollee can return them
piecemeal and staff see exactly which form is missing rather than one
all-or-nothing "packet received".

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

- `programs` limits a requirement to particular waivers. The CCSP Cost Share
  Payment Agreement is `["CCSP"]`, so a CCSP participant is asked for 13
  documents and a COMP participant for 12. (No employee requirement is currently
  program-limited — see the TB test question below.)
- `unconfirmed: true` marks a requirement that came from only a few source calls.
  It renders an amber **Unconfirmed** tag on the checklist. IRS 2678 and 8821
  currently carry it — confirm with a supervisor and clear the flag.

### Open questions in the source notes

| Item | Status |
| ---- | ------ |
| ~~Is the payroll schedule collected back?~~ | **Resolved: no.** The employee checklist marks it "Supplemental Form (keep for future use)". Removed from intake |
| Are the TB test and physical required for everyone, or ICWP only? | The packet checklist lists both for every employee; the call notes say ICWP only. Kept required for all and flagged `unconfirmed` |
| Is the general Power of Attorney submitted? | The packet checklist lists it; the agent call notes say discard it. Kept as required and flagged `unconfirmed` |
| Who completes the DOL Employer Status Report? | On the packet checklist as a submitted form; the call notes say Continuum handles DOL registration. Kept and flagged `unconfirmed` |
| ~~`enrollment@` vs `enrollments@`~~ | **Resolved: `enrollments@continuumfs.com`** (plural), per the Continuum signature block in two of Shavauna's emails, 30 Jul and 26 Aug 2026 |
| Fingerprint fee reimbursement — receipts to `invoices@`, ~10 business days by money order | not modelled; no reimbursement flow exists yet |
| ~~Program scope~~ | **Resolved: all five.** The Participant/Representative Agreement offers COMP, NOW, CCSP, ICWP and SOURCE as checkboxes, and the Employee Rate Form lists a SOURCE service line |
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
