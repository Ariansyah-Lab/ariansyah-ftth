import { Download } from "lucide-react";

import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";
import { exportExcel } from "@/app/tools/cable-counter/utils/exportExcel";

type Props = {
  data: CableResult;
};

export default function CableTable({ data }: Props) {
  return (
    <section className="min-w-0">
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#77787c]">
            Analysis result
          </p>

          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#3f4043]">
            {data.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => exportExcel(data)}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-2xl bg-[#dedfe1] px-5 py-3 text-sm font-medium text-[#68696d] shadow-[6px_6px_12px_#bfc0c3,-6px_-6px_12px_#f7f7f8] transition duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:shadow-[inset_4px_4px_8px_#bfc0c3,inset_-4px_-4px_8px_#f7f7f8]"
        >
          <Download size={17} strokeWidth={1.8} />
          Export Excel
        </button>
      </div>

      <div className="overflow-hidden rounded-[2rem] bg-[#dedfe1] shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm text-[#68696d]">
            <thead className="bg-[#d7d8da] text-xs uppercase tracking-[0.12em] text-[#77787c]">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">Group</th>
                <th className="px-5 py-4 text-left font-semibold">Category</th>
                <th className="px-5 py-4 text-left font-semibold">Line Name</th>
                <th className="px-5 py-4 text-right font-semibold">Length</th>
              </tr>
            </thead>

            <tbody>
              {data.lines.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-16 text-center text-[#a4a5a8]"
                  >
                    No line data. Upload or paste KML to begin analysis.
                  </td>
                </tr>
              ) : (
                data.lines.map((line, index) => (
                  <tr
                    key={`${line.name}-${index}`}
                    className="border-t border-[#c9cacc] transition hover:bg-[#e5e5e7]"
                  >
                    <td className="px-5 py-4 text-left">{line.group}</td>
                    <td className="px-5 py-4 text-left">{line.category}</td>
                    <td className="px-5 py-4 text-left font-medium text-[#3f4043]">
                      {line.name}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-[#3f4043]">
                      {line.length} m
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
