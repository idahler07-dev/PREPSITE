import { TEMPLATE_COLUMNS } from "@/lib/import/spreadsheet";
import { requireApiRole, STAFF_ROLES } from "@/server/auth/session";
import { errorResponse } from "@/server/http";
import en from "../../../../../../messages/en.json";

// Original example rows written for this template. Delete them before importing.
const EXAMPLES: Record<(typeof TEMPLATE_COLUMNS)[number], string>[] = [
  {
    code: "",
    section: "MATH",
    domain: "Algebra",
    skill: "Linear equations in one variable",
    difficulty: "easy",
    type: "MCQ",
    passage: "",
    stem: "EXAMPLE (delete this row): If $3x + 5 = 20$, what is the value of $x$?",
    choice_a: "3",
    choice_b: "5",
    choice_c: "15",
    choice_d: "25",
    correct_answer: "B",
    explanation: "Subtract 5 from both sides to get $3x = 15$, then divide by 3: $x = 5$.",
    image_url: "",
  },
  {
    code: "",
    section: "MATH",
    domain: "Problem-Solving and Data Analysis",
    skill: "Percentages",
    difficulty: "medium",
    type: "SPR",
    passage: "",
    stem: "EXAMPLE (delete this row): A jacket costs \\$80. Its price is reduced by 15%. What is the new price, in dollars?",
    choice_a: "",
    choice_b: "",
    choice_c: "",
    choice_d: "",
    correct_answer: "68",
    explanation: "15% of 80 is 12, and $80 - 12 = 68$.",
    image_url: "",
  },
  {
    code: "",
    section: "RW",
    domain: "Standard English Conventions",
    skill: "Boundaries",
    difficulty: "medium",
    type: "MCQ",
    passage: "The town library stays open late on Thursdays, so students often ______ there after their evening classes.",
    stem: "EXAMPLE (delete this row): Which choice completes the text so that it conforms to the conventions of Standard English?",
    choice_a: "study,",
    choice_b: "study",
    choice_c: "study;",
    choice_d: "study:",
    correct_answer: "B",
    explanation: "No punctuation is needed between the verb and the word that follows it.",
    image_url: "",
  },
];

function csvCell(v: string) {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(req: Request) {
  try {
    await requireApiRole(STAFF_ROLES);
    const format = new URL(req.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
    if (format === "csv") {
      const lines = [TEMPLATE_COLUMNS.join(","), ...EXAMPLES.map((r) => TEMPLATE_COLUMNS.map((c) => csvCell(r[c])).join(","))];
      return new Response("﻿" + lines.join("\r\n"), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="question-import-template.csv"' },
      });
    }
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("questions");
    ws.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c, key: c, width: ["stem", "passage", "explanation"].includes(c) ? 50 : 16 }));
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    for (const r of EXAMPLES) ws.addRow(r);
    const lists: Record<string, string[]> = {
      section: ["RW", "MATH"],
      difficulty: ["easy", "medium", "hard"],
      type: ["MCQ", "SPR"],
      domain: Object.values(en.taxonomy.domains),
    };
    // Dropdowns for the columns with fixed values (rows 2..2001).
    for (const [col, values] of Object.entries(lists)) {
      const idx = TEMPLATE_COLUMNS.indexOf(col as (typeof TEMPLATE_COLUMNS)[number]) + 1;
      const letter = ws.getColumn(idx).letter;
      for (let row = 2; row <= 2001; row++) {
        ws.getCell(`${letter}${row}`).dataValidation = {
          type: "list",
          allowBlank: true,
          formulae: [`"${values.join(",").replace(/"/g, "")}"`],
        };
      }
    }
    // A second sheet listing every skill under its domain, for reference.
    const ref = wb.addWorksheet("skills");
    ref.columns = [
      { header: "section", key: "section", width: 10 },
      { header: "domain", key: "domain", width: 36 },
      { header: "skill", key: "skill", width: 70 },
    ];
    ref.getRow(1).font = { bold: true };
    const { DOMAINS } = await import("@/lib/taxonomy");
    for (const d of DOMAINS) {
      for (const s of d.skills) {
        ref.addRow({ section: d.section, domain: en.taxonomy.domains[d.key], skill: en.taxonomy.skills[s as keyof typeof en.taxonomy.skills] });
      }
    }
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="question-import-template.xlsx"',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
