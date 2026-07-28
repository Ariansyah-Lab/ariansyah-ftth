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
          <PermitTable
            data={data}
          />
        </section>
      </div>
    </>
  );
}