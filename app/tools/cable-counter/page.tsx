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
  const [data, setData] = useState(emptyData);

  function clearData() {
    setData(emptyData);
  }

  return (
    <>
      <Header />

      <div className="flex">
        <Sidebar
          setData={setData}
          clearData={clearData}
        />

        <section
          className="
            flex-1
            p-6
            space-y-6
          "
        >
          <StatGrid
            data={data}
          />

          <CableTable
            data={data}
          />
        </section>
      </div>
    </>
  );
}