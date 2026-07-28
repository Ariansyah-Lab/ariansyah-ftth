import * as XLSX from "xlsx";
import type { CableResult } from "./kmlParser";


export function exportExcel(
  data: CableResult
) {


// ===========================
// HEADER + DATA
// ===========================

const rows: (string | number)[][] = [];


rows.push([
  "No",
  "Nama Site",
  "Nama Jalan",
  "Start (Lat, Long)",
  "End (Lat, Long)",
  "Panjang Kabel (m)",
]);



data.lines.forEach((line) => {

  rows.push([

    line.no,

    line.site,

    line.jalan,

    line.start,

    line.end,

    line.length,

  ]);

});




// ===========================
// SHEET
// ===========================

const ws =
  XLSX.utils.aoa_to_sheet(rows);



ws["!cols"] = [

  { wch: 8 },   // No

  { wch: 30 },  // Nama Site

  { wch: 35 },  // Nama Jalan

  { wch: 25 },  // Start

  { wch: 25 },  // End

  { wch: 18 },  // Panjang

];




// ===========================
// WORKBOOK
// ===========================

const wb =
  XLSX.utils.book_new();



XLSX.utils.book_append_sheet(
  wb,
  ws,
  "TRK Permit Data"
);




// ===========================
// FILE NAME
// ===========================

XLSX.writeFile(
  wb,
  `TRK Permit ${data.title}.xlsx`
);

}