"use client";

import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";
import { exportExcel } from "@/app/tools/trk-permit/utils/exportExcel";

type Props = {
  data: CableResult;
};

export default function PermitTable({ data }: Props) {
  if (!data) return null;

  return (
    <section className="min-w-0">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="truncate text-xl font-semibold tracking-[-0.04em] text-[#3f4043] sm:text-2xl">
          {data.title}
        </h2>

        <button
          type="button"
          onClick={() => exportExcel(data)}
          className="w-full cursor-pointer rounded-2xl bg-[#dedfe1] px-5 py-3 text-sm font-semibold text-[#4f5054] shadow-[7px_7px_14px_#bfc0c3,-7px_-7px_14px_#f7f7f8] transition-all duration-200 hover:-translate-y-0.5 hover:text-[#303135] active:translate-y-0 active:shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8] sm:w-auto"
        >
          Export Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-[2rem] bg-[#dedfe1] p-3 shadow-[10px_10px_20px_#bfc0c3,-10px_-10px_20px_#f7f7f8] sm:p-4">
        <div className="min-w-[900px] overflow-hidden rounded-[1.5rem] bg-[#dedfe1] shadow-[inset_5px_5px_10px_#bfc0c3,inset_-5px_-5px_10px_#f7f7f8]">
          <table className="w-full text-sm">
            <thead className="text-[#68696d]">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">No</th>
                <th className="px-5 py-4 text-left font-semibold">
                  Nama Site
                </th>
                <th className="px-5 py-4 text-left font-semibold">
                  Nama Jalan
                </th>
                <th className="px-5 py-4 text-left font-semibold">
                  Start (Lat, Long)
                </th>
                <th className="px-5 py-4 text-left font-semibold">
                  End (Lat, Long)
                </th>
                <th className="px-5 py-4 text-right font-semibold">
                  Panjang Kabel (m)
                </th>
              </tr>
            </thead>

            <tbody className="text-[#4f5054]">
              {data.lines.length === 0 ? (
                <tr className="border-t border-[#c8c9cc]">
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-[#a4a5a8]"
                  >
                    No permit data
                  </td>
                </tr>
              ) : (
                data.lines.map((line, index) => (
                  <tr
                    key={`${line.no}-${index}`}
                    className="border-t border-[#c8c9cc] transition-colors hover:bg-[#d8d9db]"
                  >
                    <td className="px-5 py-4 text-left">{line.no}</td>
                    <td className="px-5 py-4 text-left">{line.site}</td>
                    <td className="px-5 py-4 text-left">{line.jalan}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-left">
                      {line.start}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-left">
                      {line.end}
                    </td>
                    <td className="px-5 py-4 text-right font-medium">
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
