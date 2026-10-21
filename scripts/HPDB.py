#!/usr/bin/env python3
"""KMZ -> HPDB Datasheet generator.

Requires: Python 3.9+, openpyxl
Usage: python kmz_to_hpdb.py
"""
from __future__ import annotations

import re
import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from math import cos, radians, sqrt
from pathlib import Path
from collections import defaultdict
import copy
try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk
except ModuleNotFoundError:  # Web/server runtime does not need the desktop GUI.
    tk = None
    filedialog = messagebox = ttk = None

from openpyxl import load_workbook
from openpyxl.styles import Font, PatternFill, Border, Alignment, Side
from openpyxl.utils import get_column_letter

NS = {"k": "http://www.opengis.net/kml/2.2"}
POLE_FOLDERS = [
    "EXISTING POLE EMR 7-2.5", "EXISTING POLE EMR 7-3",
    "EXISTING POLE EMR 7-4", "EXISTING POLE EMR 9-4",
    "EXISTING POLE PARTNER 7-4", "EXISTING POLE PARTNER 9-4",
    "NEW POLE 7-2.5", "NEW POLE 7-3", "NEW POLE 7-4", "NEW POLE 9-4",
]

def autofit_columns(workbook, start_col=8, end_col=52, minimum=10, maximum=60, padding=2):
    """Fit only the requested column range to its longest visible text."""
    for sheet in workbook.worksheets:
        for col_index in range(start_col, end_col + 1):
            col_cells = tuple(sheet.iter_cols(min_col=col_index, max_col=col_index))[0]
            max_length = 0
            for cell in col_cells:
                value = cell.value
                if value is None or (isinstance(value, str) and value.startswith("=")):
                    continue
                lines = str(value).splitlines() or [""]
                max_length = max(max_length, max(len(line) for line in lines))
            if max_length:
                width = min(maximum, max(minimum, max_length + padding))
                sheet.column_dimensions[get_column_letter(col_cells[0].column)].width = width

@dataclass
class Feature:
    name: str
    description: str
    path: list[str]
    coords: list[tuple[float, float]]
    geometry: str

    @property
    def point(self):
        return self.coords[0] if self.coords else None

    @property
    def line_root(self):
        return self.path[1] if len(self.path) > 1 else ""

    @property
    def line_label(self):
        for part in self.path:
            if re.search(r"\bFDT\s*\d+\b", part, re.I):
                return re.sub(r"\s+", " ", part).strip()
        return ""

    @property
    def fdt_label(self):
        match = re.search(r"\bFDT\s*(\d+)\b", self.line_label, re.I)
        return f"FDT {match.group(1)}" if match else "FDT 1"

    @property
    def line_key(self):
        """Return the main KMZ folder containing the FDT label."""
        return self.line_label or self.line_root


def text(node, tag):
    item = node.find("k:" + tag, NS)
    return (item.text or "").strip() if item is not None else ""


def parse_coords(node):
    item = node.find(".//k:coordinates", NS)
    if item is None or not item.text:
        return []
    result = []
    for token in item.text.strip().split():
        bits = token.split(",")
        if len(bits) >= 2:
            try:
                result.append((float(bits[0]), float(bits[1])))
            except ValueError:
                pass
    return result


def parse_kmz(path: str | Path) -> list[Feature]:
    with zipfile.ZipFile(path) as archive:
        kml_name = next((x for x in archive.namelist() if x.lower().endswith(".kml")), None)
        if not kml_name:
            raise ValueError("KMZ tidak berisi file KML.")
        root = ET.fromstring(archive.read(kml_name))
    result: list[Feature] = []

    def walk(node, path):
        for child in list(node):
            tag = child.tag.rsplit("}", 1)[-1]
            if tag in ("Document", "Folder"):
                name = text(child, "name")
                walk(child, path + ([name] if tag == "Folder" and name else []))
            elif tag == "Placemark":
                coords = parse_coords(child)
                geometry = next((x.tag.rsplit("}", 1)[-1] for x in child if x.tag.rsplit("}", 1)[-1] in {"Point", "Polygon", "LineString", "MultiGeometry"}), "")
                result.append(Feature(text(child, "name"), text(child, "description"), path[:], coords, geometry))
    walk(root, [])
    return result


def normalize(value: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", (value or "").upper())


def fat_code(value: str) -> str:
    """Return the short FAT code, e.g. A01, from a FAT placemark name."""
    compact = normalize(value)
    match = re.search(r"([A-Z]\d{2})$", compact)
    return match.group(1) if match else compact


def inside(point, polygon):
    if len(polygon) < 3:
        return False
    x, y = point
    result = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        if ((yi > y) != (yj > y)) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-30) + xi:
            result = not result
        j = i
    return result


def distance_m(a, b):
    lat = radians((a[1] + b[1]) / 2)
    return sqrt(((a[0] - b[0]) * 111320 * cos(lat)) ** 2 + ((a[1] - b[1]) * 110540) ** 2)


def extract_street(fat: Feature, fallback: str) -> str:
    # Street can be stored in the FAT placemark description/name or in one of
    # its parent folder labels. Search all available KMZ text before falling
    # back to the form's Cluster Name.
    value = " ".join([*fat.path, fat.name, fat.description])
    for pattern in (r"(?:street|jalan)\s*[:=-]\s*([^;|,]+)", r"(?:street|jalan)\s+([A-Za-z0-9 .'-]+)"):
        match = re.search(pattern, value, re.I)
        if match:
            return match.group(1).strip()
    return fallback


def copy_row_style(ws, source_row, target_row, max_col):
    for col in range(1, max_col + 1):
        source = ws.cell(source_row, col)
        target = ws.cell(target_row, col)
        if source.has_style:
            target._style = copy.copy(source._style)
        if source.number_format:
            target.number_format = source.number_format
        if source.alignment:
            target.alignment = copy.copy(source.alignment)


def clear_value_area(ws, min_row=2, max_row=300, max_col=62):
    for row in ws.iter_rows(min_row=min_row, max_row=max_row, min_col=1, max_col=max_col):
        for cell in row:
            cell.value = None


def populate_fdt_sheets(wb, features, rows, manual):
    """Create one FDT sheet per detected FDT and populate fields confirmed so far."""
    template = wb["FDT-1"] if "FDT-1" in wb.sheetnames else wb[wb.sheetnames[-1]]
    grouped = defaultdict(list)
    for item in rows:
        grouped[item["fdt"]].append(item)
    fdt_features = [f for f in features if f.path and f.path[-1] == "FDT" and f.point]
    for sheet_name in [name for name in wb.sheetnames if name.startswith("FDT ")]:
        del wb[sheet_name]
    created = []
    for fdt_label in sorted(grouped, key=lambda x: int(re.search(r"\d+", x).group()) if re.search(r"\d+", x) else 999):
        sheet = wb.copy_worksheet(template)
        sheet.title = fdt_label
        # Process FAT groups in a stable A-Z order based on the short FAT
        # CODE: A01, A02, ..., B01, C01, etc. This ordering drives every
        # generated column before and including AV.
        items = sorted(
            grouped[fdt_label],
            key=lambda item: (
                fat_code(item["fat"].name) if item["fat"] else "ZZZ",
                item["hp"].name.upper(),
            ),
        )
        sheet["D3"] = manual.get("region", "")
        sheet["D4"] = manual.get("olt", "")
        sheet["D5"] = manual.get("cluster_name", "")
        # FDT ID comes from the detected KMZ folder, e.g. LINE A FDT 1.
        # The user no longer needs to type it manually.
        selected_fdt = (manual.get("fdt_mapping") or {}).get(fdt_label, {})
        selected_name = selected_fdt.get("name") or fdt_label
        sheet["D6"] = selected_name
        sheet["N4"] = f"{len(items)} HP/AERIAL"
        matching_fdt = next((f for f in fdt_features if f.name == selected_name), None)
        if matching_fdt is None:
            matching_fdt = next((f for f in fdt_features if f.name.strip().upper().startswith(fdt_label.upper())), None)
        if matching_fdt and matching_fdt.point:
            lon, lat = matching_fdt.point
            sheet["N6"] = f"{lat:.6f}° {lon:.6f}°"
        else:
            sheet["N6"] = ""
        # Remove template merges in the data area; they will be rebuilt from each FAT group.
        for merged in list(sheet.merged_cells.ranges):
            if merged.min_row >= 9 and merged.max_col <= 8:
                sheet.unmerge_cells(str(merged))
        # Use the template's first data row as the format-painter source for every new row.
        template_defaults = {col: template.cell(9, col).value for col in range(9, 37)}
        run_ranges = []
        current_code = None
        current_start = None
        fat_pos = 0
        filled_index = 0
        pair_index = 0
        yellow_fill = PatternFill(fill_type="solid", fgColor="FFFF00")
        white_fill = PatternFill(fill_type="solid", fgColor="FFFFFF")
        for offset, item in enumerate(items, start=9):
            if offset > 9:
                copy_row_style(sheet, 9, offset, 62)
            for col, value in template_defaults.items():
                sheet.cell(offset, col).value = value
            hp = item["hp"]
            fat_name = item["fat"].name if item["fat"] else ""
            short_fat_code = fat_code(fat_name)
            if short_fat_code != current_code:
                if current_code is not None:
                    run_ranges.append((current_start, offset - 1, current_code))
                current_code = short_fat_code
                current_start = offset
                fat_pos = 1
                pair_index += 1
            else:
                fat_pos += 1
            line_name = f"LINE {short_fat_code[0].upper()}" if short_fat_code else ""
            if offset in (current_start, current_start + 1):
                filled_index += 1
                if offset == current_start:
                    sheet.cell(offset, 1).value = f"G{((filled_index - 1) // 16) + 1}"
                    sheet.cell(offset, 1).fill = yellow_fill
                else:
                    sheet.cell(offset, 1).value = None
                    sheet.cell(offset, 1).fill = white_fill
                sheet.cell(offset, 2).value = filled_index
                sheet.cell(offset, 3).value = line_name
                sheet.cell(offset, 4).value = "24C/2T"
                sheet.cell(offset, 5).value = ((pair_index - 1) // 8) + 1
                f_cycle_pos = ((filled_index - 1) % 22) + 1
                sheet.cell(offset, 6).value = f_cycle_pos if f_cycle_pos <= 16 else f_cycle_pos - 16
                sheet.cell(offset, 7).value = short_fat_code if offset == current_start else None
            else:
                for col in range(1, 7):
                    sheet.cell(offset, col).value = None
                sheet.cell(offset, 1).fill = white_fill
                sheet.cell(offset, 7).value = None
            sheet.cell(offset, 8).value = fat_pos
            row_ref = offset
            sheet.cell(offset, 9).value = f'=IFERROR(INDEX(Datasheet!$A:$A,MATCH(AK{row_ref},Datasheet!$D:$D,0)),"")'
            sheet.cell(offset, 10).value = f'=IFERROR(INDEX(Datasheet!$B:$B,MATCH(AK{row_ref},Datasheet!$D:$D,0)),"")'
            sheet.cell(offset, 11).value = f'=IFERROR(INDEX(Datasheet!$C:$C,MATCH(AK{row_ref},Datasheet!$D:$D,0)),"")'
            street = extract_street(item["fat"], manual.get("cluster_name", "")) if item["fat"] else ""
            sheet.cell(offset, 12).value = street
            location_data = manual.get("location") or {}
            # The Next.js form sends flat fields, while the OSM response uses
            # an address object. Accept both formats so M-Q is never blank
            # merely because the payload shape changed.
            location_address = location_data.get("address") or location_data
            province = str(
                location_data.get("province")
                or location_address.get("province")
                or location_address.get("state")
                or ""
            ).upper()
            regency_city = str(
                location_data.get("regency")
                or location_data.get("regency_city")
                or location_address.get("city")
                or location_address.get("county")
                or location_address.get("municipality")
                or location_address.get("region")
                or ""
            ).upper()
            district = str(
                location_data.get("district")
                or location_address.get("city_district")
                or location_address.get("town")
                or ""
            ).upper()
            subdistrict = str(
                location_data.get("village")
                or location_data.get("subdistrict")
                or location_address.get("village")
                or location_address.get("suburb")
                or ""
            ).upper()
            postalcode = str(
                location_data.get("postcode")
                or location_data.get("postalcode")
                or location_address.get("postcode")
                or ""
            ).upper()
            sheet.cell(offset, 13).value = province
            sheet.cell(offset, 14).value = regency_city
            sheet.cell(offset, 15).value = district
            sheet.cell(offset, 16).value = subdistrict
            sheet.cell(offset, 17).value = postalcode
            sheet.cell(offset, 18).value = "-"
            sheet.cell(offset, 19).value = "-"
            sheet.cell(offset, 20).value = "-"
            sheet.cell(offset, 21).value = "FTTH"
            sheet.cell(offset, 22).value = "-"
            sheet.cell(offset, 23).value = "General Retail"
            sheet.cell(offset, 24).value = "-"
            sheet.cell(offset, 25).value = manual.get("cluster_id", "")
            sheet.cell(offset, 26).value = manual.get("cluster_name", "")
            sheet.cell(offset, 27).value = manual.get("cluster_name", "")
            sheet.cell(offset, 28).value = "-"
            sheet.cell(offset, 29).value = "-"
            sheet.cell(offset, 30).value = "JALAN"
            # AE / FAT address must use the same street value as the Street
            # table, including the Cluster Name fallback.
            sheet.cell(offset, 31).value = street
            sheet.cell(offset, 36).value = "-"
            sheet.cell(offset, 37).value = hp.name
            sheet.cell(offset, 38).value = "Single Dwelling Unit"
            sheet.cell(offset, 44).value = "RFS"
            sheet.cell(offset, 45).value = manual.get("olt_code", "")
            sheet.cell(offset, 46).value = "-"
            sheet.cell(offset, 47).value = selected_name
            # Lookup values from Datasheet using the HP name in AK, equivalent to VLOOKUP.
            # AV / FATCODE uses the same short code as column G and is kept
            # explicit so it never reintroduces the full FAT placemark name.
            sheet.cell(offset, 48).value = short_fat_code
            sheet.cell(offset, 49).value = "-"
            sheet.cell(offset, 50).value = f'=IFERROR(VLOOKUP(AK{offset},Datasheet!$D:$F,2,FALSE),"")'
            sheet.cell(offset, 51).value = f'=IFERROR(VLOOKUP(AK{offset},Datasheet!$D:$F,3,FALSE),"")'
            sheet.cell(offset, 50).number_format = "0.000000"
            sheet.cell(offset, 51).number_format = "0.000000"
            # Highlight the row where G1/G2 starts; column G stays white.
            row_fill = yellow_fill if offset == current_start else white_fill
            for col in range(1, sheet.max_column + 1):
                # BK and onward are outside the generated FDT data area and
                # must never inherit the template's yellow fill.
                sheet.cell(offset, col).fill = white_fill if col >= 63 or col in (7, 52) else row_fill
                if col <= 52:
                    sheet.cell(offset, col).border = copy.copy(sheet.cell(9, col).border)
        if current_code is not None:
            run_ranges.append((current_start, 8 + len(items), current_code))
        # Remove borders from empty cells from the header row through the data area.
        for r in range(8, sheet.max_row + 1):
            for col in range(1, sheet.max_column + 1):
                cell = sheet.cell(r, col)
                if cell.value is None and col != 52:
                    cell.border = Border()
                if col >= 63:
                    cell.fill = white_fill
            # AZ is a required bordered column even when its cell is empty.
            sheet.cell(r, 52).border = copy.copy(sheet.cell(9, 52).border)
        # Clear template fills from BK onward across the complete FDT sheet,
        # including header rows above the generated data area.
        for r in range(1, sheet.max_row + 1):
            for col in range(63, sheet.max_column + 1):
                sheet.cell(r, col).fill = white_fill
        for run_start, run_end, code in run_ranges:
            # Match the template: only the first two rows of each FAT are merged.
            merge_end = min(run_start + 1, run_end)
            if merge_end > run_start:
                sheet.merge_cells(start_row=run_start, start_column=7, end_row=merge_end, end_column=7)
                sheet.cell(run_start, 7).value = code
                sheet.cell(run_start, 7).alignment = copy.copy(sheet.cell(9, 7).alignment)
        created.append(fdt_label)
    if template.title == "FDT-1":
        del wb[template.title]
    return created


def generate_excel(kmz_path, template_path, output_path, manual):
    features = parse_kmz(kmz_path)
    if not features:
        raise ValueError("Tidak ada placemark yang terbaca dari KMZ.")

    boundaries = [f for f in features if "BOUNDARY FAT" in f.path and len(f.coords) >= 3]
    covers = [f for f in features if "HP COVER" in f.path and f.point]
    fats = [f for f in features if f.path and f.path[-1] == "FAT" and f.point]
    poles = [f for f in features if any(folder in f.path for folder in POLE_FOLDERS) and f.point]
    if not covers:
        raise ValueError("Folder HP COVER atau placemark HP COVER tidak ditemukan.")

    # The web form can explicitly assign a placemark to FDT 1, FDT 2, etc.
    # Use that placemark's line as the authoritative grouping for all covers
    # on the same line.
    fdt_mapping = manual.get("fdt_mapping") or {}
    selected_line_to_fdt = {
        str(value.get("line")): label
        for label, value in fdt_mapping.items()
        if isinstance(value, dict) and value.get("line")
    }

    # Match each boundary to its line and normalize its FAT code.
    fat_by_line_code = defaultdict(list)
    for fat in fats:
        # Index both the complete placemark name and its short FAT CODE. A
        # boundary is commonly named A01 while the FAT placemark is named
        # DPS.100.4401.BLCN.007.A01.
        fat_by_line_code[(fat.line_key, normalize(fat.name))].append(fat)
        fat_by_line_code[(fat.line_key, fat_code(fat.name))].append(fat)

    rows = []
    for hp in covers:
        boundary = next((b for b in boundaries if b.line_key == hp.line_key and inside(hp.point, b.coords)), None)
        boundary_name = boundary.name if boundary else ""
        # FAT must match the boundary name inside the same parent line/folder
        # as the HP COVER. This avoids accidentally using an identically named
        # FAT from another line in the KMZ.
        fat_candidates = fat_by_line_code.get((hp.line_key, normalize(boundary_name)), [])
        if not fat_candidates:
            fat_candidates = fat_by_line_code.get((hp.line_key, fat_code(boundary_name)), [])
        fat = fat_candidates[0] if fat_candidates else None
        # Pole ID is the closest permitted pole placemark to that FAT, within
        # the same parent line/folder. The fallback to the HP point is only for
        # a COVER whose boundary/FAT could not be resolved.
        pole_candidates = [p for p in poles if p.line_key == (fat.line_key if fat else hp.line_key)]
        # If the KML places pole folders outside the line wrapper, still use
        # all approved pole folders rather than silently leaving column A blank.
        if not pole_candidates:
            pole_candidates = poles
        if fat and pole_candidates:
            pole = min(pole_candidates, key=lambda p: distance_m(fat.point, p.point))
        elif pole_candidates:
            pole = min(pole_candidates, key=lambda p: distance_m(hp.point, p.point))
        else:
            pole = None
        rows.append({
            "hp": hp,
            "boundary": boundary,
            "fat": fat,
            "pole": pole,
            "line": hp.line_label,
            "fdt": selected_line_to_fdt.get(hp.line_key, hp.fdt_label),
        })

    wb = load_workbook(template_path)
    if "Datasheet" not in wb.sheetnames:
        raise ValueError("Template tidak memiliki sheet Datasheet.")
    ws = wb["Datasheet"]
    clear_value_area(ws)
    # Remove all old summary values and formatting from J onward so no empty tables remain.
    blank_style = copy.copy(ws.cell(1, 9)._style)
    for row in range(1, 301):
        for col in range(9, 63):
            cell = ws.cell(row, col)
            cell.value = None
            cell._style = copy.copy(blank_style)
    ws.auto_filter.ref = None
    # Preserve the template's first data row style while expanding it.
    ws["G1"] = "JALAN"
    ws["H1"] = "FAT CODE"
    ws["I1"]._style = copy.copy(ws["H1"]._style)
    ws["I1"].value = "LINE"
    for row_index, item in enumerate(rows, start=2):
        if row_index > 2:
            copy_row_style(ws, 2, row_index, 9)
        pole = item["pole"]
        hp = item["hp"]
        ws.cell(row_index, 1).value = pole.name if pole else ""
        ws.cell(row_index, 2).value = pole.point[1] if pole else ""
        ws.cell(row_index, 3).value = pole.point[0] if pole else ""
        ws.cell(row_index, 4).value = hp.name
        ws.cell(row_index, 5).value = hp.point[1]
        ws.cell(row_index, 6).value = hp.point[0]
        location_address = manual.get("location", {}).get("address", {})
        road_by_hp = manual.get("roads", {}) or {}
        road_key = f"{hp.name}|{hp.point[1]:.6f}|{hp.point[0]:.6f}"
        street = str(road_by_hp.get(road_key) or road_by_hp.get(hp.name) or location_address.get("road") or manual.get("cluster_name", "")).upper()
        ws.cell(row_index, 7).value = street
        ws.cell(row_index, 8).value = fat_code(item["fat"].name) if item["fat"] else ""
        # Column I stores the direct parent/line folder read from HP COVER's
        # KMZ path, not only the derived FDT label.
        ws.cell(row_index, 9).value = hp.line_key
        for coord_col in (2, 3, 5, 6):
            ws.cell(row_index, coord_col).number_format = "0.000000"

    # Build one 3-column summary table per FDT group: J:L, N:P, R:T, ...
    # Seed groups from every HP COVER so FDT 1/FDT 2/... remain visible even
    # when one group currently has no successfully matched FAT.
    grouped = defaultdict(lambda: defaultdict(int))
    for item in rows:
        grouped[item["fdt"]]
    for item in rows:
        fat = item["fat"]
        if fat:
            code = fat_code(fat.name)
            street = extract_street(fat, manual.get("cluster_name", ""))
            grouped[item["fdt"]][(street, code)] += 1
    start_col = 10  # J
    for group_index, line in enumerate(sorted(grouped, key=lambda x: int(re.search(r"\d+", x).group()) if re.search(r"\d+", x) else 999)):
        col = start_col + group_index * 4
        # Row 1 identifies the FDT group; row 2 contains table headers.
        ws.cell(1, col).value = line
        ws.cell(1, col).font = Font(bold=True)
        headers = ["FAT_STREET", "FAT_ID", "TOTAL_HP"]
        for offset, header in enumerate(headers):
            cell = ws.cell(2, col + offset)
            cell.value = header
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal="center")
        items = sorted(grouped[line].items(), key=lambda kv: (kv[0][1], kv[0][0]))
        for idx, ((street, code), count) in enumerate(items, start=3):
            if idx > 3:
                for c in range(col, col + 3):
                    ws.cell(idx, c)._style = copy.copy(ws.cell(3, min(c, 12))._style)
            ws.cell(idx, col).value = street
            ws.cell(idx, col + 1).value = code
            ws.cell(idx, col + 2).value = count

    # Remove any template borders from the main Datasheet area A:H.
    no_border = Border()
    for row in range(1, len(rows) + 2):
        for col in range(1, 9):
            ws.cell(row, col).border = no_border

    # Add borders only to populated FDT summary tables.
    thin = Side(style="thin", color="000000")
    def apply_grid(min_row, max_row, min_col, max_col):
        for row in range(min_row, max_row + 1):
            for col in range(min_col, max_col + 1):
                ws.cell(row, col).border = Border(left=thin, right=thin, top=thin, bottom=thin)
    for group_index, line in enumerate(sorted(grouped, key=lambda x: int(re.search(r"\d+", x).group()) if re.search(r"\d+", x) else 999)):
        col = start_col + group_index * 4
        item_count = len(grouped[line])
        apply_grid(1, item_count + 2, col, col + 2)

    # Remove vertical borders from the entire first/header row while retaining top and bottom borders.
    first_row_max_col = start_col + len(grouped) * 4 - 2 if grouped else 8
    for col in range(1, first_row_max_col + 1):
        cell = ws.cell(1, col)
        cell.border = Border(top=cell.border.top, bottom=cell.border.bottom)

    # Ensure no vertical border remains on column A, including inherited template styles.
    for row in range(1, len(rows) + 2):
        cell = ws.cell(row, 1)
        cell.border = Border(top=cell.border.top, bottom=cell.border.bottom)

    # Highlight the first row yellow across the populated sheet width.
    max_used_col = start_col + len(grouped) * 4 - 2 if grouped else 8
    yellow = PatternFill(fill_type="solid", fgColor="FFFF00")
    for col in range(1, max_used_col + 1):
        ws.cell(1, col).fill = yellow

    populate_fdt_sheets(wb, features, rows, manual)

    # Keep the layout compact while ensuring coordinate columns show six decimals.
    widths = {"A": 18, "B": 13, "C": 13, "D": 14, "E": 13, "F": 13, "G": 12, "H": 18}
    for col_letter, width in widths.items():
        ws.column_dimensions[col_letter].width = width
    for col in range(10, start_col + len(grouped) * 4 - 1):
        ws.column_dimensions[get_column_letter(col)].width = {0: 18, 1: 12, 2: 11, 3: 2}.get((col - 10) % 4, 12)
    autofit_columns(wb)
    wb.save(output_path)
    return {"features": len(features), "hp_cover": len(covers), "boundaries": len(boundaries), "fats": len(fats), "poles": len(poles), "rows": len(rows), "lines": sorted(grouped)}


class App((tk.Tk if tk else object)):
    def __init__(self):
        if tk is None:
            raise RuntimeError("Tkinter tidak tersedia; gunakan run_hpdb.py untuk proses web.")
        super().__init__()
        self.title("KMZ ke HPDB Excel")
        self.geometry("760x390")
        self.resizable(False, False)
        self.kmz = tk.StringVar()
        self.template = tk.StringVar(value=str(Path(__file__).with_name("HPDB.xlsx")))
        self.output = tk.StringVar()
        self.fields = {name: tk.StringVar() for name in ["OLT", "Cluster Name", "FDT ID", "Cluster ID", "OLT Code"]}
        self.build()

    def build(self):
        pad = {"padx": 12, "pady": 7}
        ttk.Label(self, text="KMZ ke HPDB Excel", font=("Segoe UI", 16, "bold")).grid(row=0, column=0, columnspan=3, sticky="w", **pad)
        self.file_row(1, "File KMZ", self.kmz, self.choose_kmz)
        self.file_row(2, "Template Excel", self.template, self.choose_template)
        for row, name in enumerate(self.fields, start=3):
            ttk.Label(self, text=name, width=18).grid(row=row, column=0, sticky="w", **pad)
            ttk.Entry(self, textvariable=self.fields[name], width=68).grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        ttk.Label(self, text="Simpan sebagai", width=18).grid(row=8, column=0, sticky="w", **pad)
        ttk.Entry(self, textvariable=self.output, width=58).grid(row=8, column=1, sticky="ew", **pad)
        ttk.Button(self, text="Pilih", command=self.choose_output).grid(row=8, column=2, **pad)
        ttk.Button(self, text="Proses KMZ dan Isi Excel", command=self.process).grid(row=9, column=0, columnspan=3, pady=18, ipadx=15, ipady=6)
        self.status = ttk.Label(self, text="Siap.")
        self.status.grid(row=10, column=0, columnspan=3, sticky="w", **pad)

    def file_row(self, row, label, variable, command):
        ttk.Label(self, text=label, width=18).grid(row=row, column=0, sticky="w", padx=12, pady=7)
        ttk.Entry(self, textvariable=variable, width=58).grid(row=row, column=1, sticky="ew", padx=12, pady=7)
        ttk.Button(self, text="Pilih", command=command).grid(row=row, column=2, padx=12, pady=7)

    def choose_kmz(self):
        path = filedialog.askopenfilename(filetypes=[("KMZ files", "*.kmz"), ("All files", "*.*")])
        if path: self.kmz.set(path)

    def choose_template(self):
        path = filedialog.askopenfilename(filetypes=[("Excel files", "*.xlsx")])
        if path: self.template.set(path)

    def choose_output(self):
        path = filedialog.asksaveasfilename(defaultextension=".xlsx", filetypes=[("Excel files", "*.xlsx")], initialfile="HPDB_output.xlsx")
        if path: self.output.set(path)

    def process(self):
        if not self.kmz.get() or not self.template.get() or not self.output.get():
            messagebox.showwarning("Belum lengkap", "Pilih KMZ, template Excel, dan lokasi output terlebih dahulu.")
            return
        try:
            self.status.config(text="Sedang membaca KMZ dan mengisi Excel...")
            self.update_idletasks()
            stats = generate_excel(self.kmz.get(), self.template.get(), self.output.get(), {k.lower().replace(" ", "_"): v.get() for k, v in self.fields.items()})
            self.status.config(text=f"Selesai: {stats['rows']} baris HP COVER diproses.")
            messagebox.showinfo("Berhasil", f"File berhasil dibuat:\n{self.output.get()}\n\nHP COVER: {stats['hp_cover']}\nFDT: {', '.join(stats['lines'])}")
        except Exception as exc:
            self.status.config(text="Gagal memproses.")
            messagebox.showerror("Gagal", str(exc))


if __name__ == "__main__":
    App().mainloop()
