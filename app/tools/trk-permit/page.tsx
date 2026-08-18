"use client";

import { useState } from "react";

import Header from "@/app/tools/trk-permit/components/Header";
import Sidebar from "@/app/tools/trk-permit/components/Sidebar";
import PermitTable from "@/app/tools/trk-permit/components/PermitTable";

import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";

const emptyData: CableResult = {
  title: "TRK Permit",
  lines: [],
  totalLength: 0,
};

export default function Home() {
  const [data, setData] = useState<CableResult>(emptyData);

  function clearData() {
    setData(emptyData);
  }

  return (
    <main className="min-h-screen bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-5 pb-16 pt-6 sm:px-8 lg:flex-row lg:items-start lg:px-12">
        <Sidebar
          setData={setData}
          clearData={clearData}
        />

        <section className="min-w-0 flex-1 space-y-6">
          <PermitTable data={data} />
        </section>
      </div>
    </main>
  );
}
