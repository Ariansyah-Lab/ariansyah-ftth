import * as XLSX from "xlsx";
import type { CableResult } from "./kmlParser";

export function exportExcel(data: CableResult) {

  // ===========================
  // HEADER + DATA
  // ===========================

  const rows: (string | number)[][] = [];

  rows.push([
    "Group",
    "Category",
    "Line Name",
    "Length (m)",
  ]);


  data.lines.forEach((line) => {

    rows.push([
      line.group,
      line.category,
      line.name,
      line.length,
    ]);

  });



  // ===========================
  // SHEET
  // ===========================

  const ws = XLSX.utils.aoa_to_sheet(rows);



  ws["!cols"] = [

    { wch: 30 }, // Group

    { wch: 35 }, // Category

    { wch: 40 }, // Line Name

    { wch: 15 }, // Length

  ];



  // ===========================
  // WORKBOOK
  // ===========================

  const wb = XLSX.utils.book_new();


  XLSX.utils.book_append_sheet(
    wb,
    ws,
    "Cable Line Data"
  );



  // ===========================
  // FILE NAME
  // ===========================

  XLSX.writeFile(
    wb,
    `Line ${data.title}.xlsx`
  );

}