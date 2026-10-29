# Content guide

How to add, code, review and publish questions. Written for the centre's editors and admins.

## 1. What may go into the bank

Only two kinds of question:

1. **The centre's own materials** — written by your teachers, or by someone who gave written permission to publish them. Every upload asks you to confirm this, and the site records who confirmed it and when.
2. **Original AI drafts** (Phase 4) — generated from the skill description, never from another company's questions, and approved by a person.

Never copy, paraphrase or import questions, passages, explanations, figures or reference sheets from the College Board, Bluebook, Khan Academy or other prep companies. Link students to the official free resources instead (they are on the **Official resources** page).

If permission for a set of questions is ever withdrawn, open **Admin → Sources** and use **Unpublish everything from this source** (or a single file). The questions are retired immediately and the action is logged.

## 2. Roles

| Role | Can do |
| --- | --- |
| Editor | Create, import, edit and review questions; publish; manage sources and reports |
| Admin | Everything an editor can, plus users and roles (and later: plans, payments, settings) |

People listed in `ADMIN_EMAILS` become admins when they sign in. Admins can make others editors in **Admin → Users**.

## 3. Question codes

Every question has a unique code, e.g. `LC-M-ALG-0001`:

- `LC-M-` — the **prefix** you type on the import form or in the editor (e.g. one prefix per book or teacher).
- `ALG` — the **domain** code (below).
- `0001` — the next free number for that prefix and domain.

The format lives in `site.config.ts` (`questionCodes`). Codes are unique across the bank. If an imported row has a code that is already used, the row gets a new code and the flag **Code reassigned**.

| Section | Domain | Code |
| --- | --- | --- |
| Reading and Writing | Information and Ideas | INI |
| | Craft and Structure | CAS |
| | Expression of Ideas | EOI |
| | Standard English Conventions | SEC |
| Math | Algebra | ALG |
| | Advanced Math | ADV |
| | Problem-Solving and Data Analysis | PSD |
| | Geometry and Trigonometry | GEO |

The skills under each domain are listed in the Excel template (sheet **skills**) and in the editor.

## 4. Writing question text

Questions stay in English, like the real SAT. Text is Markdown with LaTeX math:

| You type | Students see |
| --- | --- |
| `$x^2 + 3x = 10$` | inline math |
| `$$\frac{a}{b}$$` on its own line | displayed math |
| `\$5` | a dollar sign (a plain `$` starts math!) |
| `**bold**`, `*italic*` | bold, italic |
| a Markdown table (`| a | b |` + `|---|---|`) | a table |
| **Insert image** button | a figure from private storage |

Tips:
- Put the passage in **Passage** and the question itself in **Question**. Paired passages: write `**Text 1**` and `**Text 2**` headings inside the passage.
- Use `______` (six underscores) for a blank.
- Multiple choice needs exactly four choices, A–D, and one correct answer.
- **Student-produced response (SPR)** answers: list each accepted answer on its own line in the editor, or separate them with `;` in a spreadsheet (`1/2; .5`). Equivalent forms are accepted automatically, so `1/2` alone already accepts `2/4`, `.5` and `0.5`. Long decimals are accepted when the student rounds or truncates them using all the space in the box (for 2/3: `.6666`, `.6667`, `0.666`, `0.667`).
- The live preview on the right shows exactly what students will see.

## 5. Importing a spreadsheet

1. **Admin → Import → CSV / Excel**. Download the Excel template (it has drop-down lists and a skills sheet) or the CSV template.
2. Fill one question per row. Columns: `code, section, domain, skill, difficulty, type, passage, stem, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation, image_url` (optional extra columns: `tags`, `rationale_a`…`rationale_d`). Delete the example rows.
   - Only `stem` and `correct_answer` are required in the header. Section, difficulty and code can come from the form; domain is worked out from the skill.
   - Domain and skill may be written as the English name ("Linear functions"), the key (`LINEAR_FUNCTIONS`) or the domain code (`ALG`).
   - Difficulty: `easy`, `medium`, `hard` (or E/M/H, 1/2/3). Type: `MCQ` or `SPR` (guessed from the choices if empty).
   - `image_url` must be a public `https://` link to a PNG, JPEG, WebP or GIF under 5 MB; it is downloaded into private storage.
3. Choose the source (or create one), tick the rights confirmation, set defaults and the code prefix, and click **Check file**.
4. The preview shows every row as **Ready**, **Flagged** or **Error**. Rows with errors are skipped — fix them in the file and import again. Click **Import … as drafts**.
5. You land in the **Review queue**, filtered to this import.

Limits: 5 MB and 2,000 rows per file. PDF import arrives in Phase 2.

## 6. Reviewing and publishing

Students only ever see **Published** questions. Everything else waits in **Admin → Review queue**.

| Flag | Meaning | Blocks publishing? |
| --- | --- | --- |
| Missing answer | No correct answer | Yes |
| Uncertain text | Text marked `[[?like this]]` by the importer; check it and remove the marker | Yes |
| Not 4 choices | Multiple choice without exactly four filled choices | Yes |
| Answer not a choice | Key isn't A, B, C or D | Yes |
| Invalid answer format | An SPR answer that isn't a number, decimal or fraction | Yes |
| Missing figure? | The text mentions a figure, table or "shown" graph but none is attached | No — check it |
| Near-duplicate | Very similar to another question (the editor lists which) | No — check it |
| Code reassigned | The file's code was taken | No |
| Student report | A student reported a problem | No — read the report |

In the review queue you can filter by flag or import, select rows, and **Publish selected**, **Publish all clean questions** (everything in the current filter without blocking flags), set difficulty, set domain and skill, or retire. Publishing records who reviewed the question and when.

Editing a published question keeps it published and saves a new version. Use **Unpublish** to take it back to review. Every save is kept in **Version history**; **Restore** copies an old version into a new one (the question then goes back to review).

## 7. Student reports

After answering, students can **Report a problem** (wrong key, typo, unclear, figure, other). A report adds the **Student report** flag and — with the default setting `review.reportsToUnpublish: 1` in `site.config.ts` — sends a published question straight back to review so no one else sees a possibly wrong question. Open reports are listed in **Admin → Reports** and on the question's page. Re-publishing the question resolves its open reports.

## 8. Difficulty

Set the difficulty label you believe is right (easy / medium / hard). Each question also records how many students answered it and how many were correct; in a later phase the site compares that with your label and flags mismatches.

## 9. Development samples

The 40 questions with codes starting `SAMPLE-` were written only for testing the site. The admin overview warns while they exist. Remove them before launch with `pnpm samples:remove` (`--dry-run` shows what would be deleted).
