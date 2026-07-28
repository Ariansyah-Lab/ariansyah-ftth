import {
  Ruler,
  Cable,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import StatCard from "./StatCard";

import type { CableResult } from "@/app/tools/cable-counter/utils/kmlParser";


type Props = {
  data: CableResult;
};


export default function StatGrid({
  data,
}: Props) {

  const longest =
    data.lines.length > 0
      ? Math.max(
          ...data.lines.map(
            (line) => line.length
          )
        )
      : 0;


  const shortest =
    data.lines.length > 0
      ? Math.min(
          ...data.lines.map(
            (line) => line.length
          )
        )
      : 0;


  return (
    <div
      className="
        grid
        grid-cols-4
        gap-5
      "
    >

      <StatCard
        title="Total Length"
        value={`${data.totalLength} m`}
        icon={<Ruler />}
      />


      <StatCard
        title="Total Line"
        value={`${data.lines.length}`}
        icon={<Cable />}
      />


      <StatCard
        title="Longest Line"
        value={`${longest} m`}
        icon={<ArrowUp />}
      />


      <StatCard
        title="Shortest Line"
        value={`${shortest} m`}
        icon={<ArrowDown />}
      />


    </div>
  );
}