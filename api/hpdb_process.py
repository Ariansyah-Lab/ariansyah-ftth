import json
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse, Response

from scripts.HPDB import generate_excel

app = FastAPI()

ROOT = Path.cwd()
SCRIPTS_DIR = ROOT / "scripts"
TEMPLATE_PATH = SCRIPTS_DIR / "HPDB.xlsx"


def parse_json_field(value: str | None, field_name: str):
    if not value:
        return {}

    try:
        return json.loads(value)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"Field {field_name} bukan JSON yang valid."
        ) from error


@app.post("/")
@app.post("/api/hpdb_process")
async def process_hpdb(
    kmz: UploadFile = File(...),
    region: str = Form(""),
    olt: str = Form(""),
    cluster_name: str = Form(""),
    cluster_id: str = Form(""),
    olt_code: str = Form(""),
    location: str = Form("{}"),
    fdt_mapping: str = Form("{}"),
):
    if not TEMPLATE_PATH.is_file():
        return JSONResponse(
            {
                "error": (
                    "Template HPDB.xlsx tidak ditemukan "
                    "di scripts/HPDB.xlsx."
                )
            },
            status_code=500,
        )

    if not kmz.filename:
        return JSONResponse(
            {"error": "File KMZ wajib diunggah."},
            status_code=400,
        )

    temporary_directory = Path(
        tempfile.mkdtemp(prefix="hpdb-process-")
    )
    input_path = temporary_directory / "input.kmz"
    output_path = temporary_directory / "HPDB_output.xlsx"

    try:
        input_path.write_bytes(await kmz.read())

        manual = {
            "region": region,
            "olt": olt,
            "cluster_name": cluster_name,
            "cluster_id": cluster_id,
            "olt_code": olt_code,
            "location": parse_json_field(location, "location"),
            "roads": {},
            "fdt_mapping": parse_json_field(
                fdt_mapping,
                "fdt_mapping",
            ),
        }

        generate_excel(
            str(input_path),
            str(TEMPLATE_PATH),
            str(output_path),
            manual,
        )

        if not output_path.is_file():
            return JSONResponse(
                {
                    "error": (
                        "Python selesai tetapi file "
                        "HPDB_output.xlsx tidak dibuat."
                    )
                },
                status_code=500,
            )

        output = output_path.read_bytes()

        return Response(
            content=output,
            media_type=(
                "application/vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            ),
            headers={
                "Content-Disposition": (
                    'attachment; filename="HPDB_output.xlsx"'
                ),
                "Cache-Control": "no-store",
            },
        )

    except Exception as error:
        return JSONResponse(
            {"error": f"HPDB Python error: {error}"},
            status_code=422,
        )

    finally:
        shutil.rmtree(
            temporary_directory,
            ignore_errors=True,
        )
