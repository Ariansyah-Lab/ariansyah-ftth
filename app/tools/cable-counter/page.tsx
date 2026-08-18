"use client";

import { useState } from "react";

import Header from "@/app/tools/cable-counter/components/Header";
import Sidebar from "@/app/tools/cable-counter/components/Sidebar";
import StatGrid from "@/app/tools/cable-counter/components/StatGrid";
import CableTable from "@/app/tools/cable-counter/components/CableTable";

import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";

const emptyData: CableResult = {
  title: "Cable Line Data",
  lines: [],
  totalLength: 0,
};

export default function Home() {
  const [data, setData] = useState<CableResult>(emptyData);

  function clearData() {
    setData({ ...emptyData, lines: [] });
  }

  return (
    <main className="min-h-screen bg-[#dedfe1] text-[#3f4043]">
      <Header />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-5 pb-12 pt-6 sm:px-8 lg:flex-row lg:gap-10 lg:px-12">
        <Sidebar setData={setData} clearData={clearData} />

        <section className="min-w-0 flex-1 space-y-8">
          <StatGrid data={data} />
          <CableTable data={data} />
        </section>
      </div>
    </main>
  );
}
