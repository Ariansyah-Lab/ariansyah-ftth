import Link from "next/link";

export default function Hero() {
  return (
    <div className="
      flex
      items-center
      justify-between
      px-10
      pt-0
    ">

      {/* LEFT */}
      <div className="max-w-xl">

        <p>
        </p>

        <h1
          className="
            text-7xl
            font-thin
            leading-none
            tracking-tight
            text-white
          "
        >
          SND
          <br />
          Toolkit
        </h1>

        <p
          className="
            mt-8
            max-w-md
            text-lg
            leading-8
            text-white/60
          "
        >
            Smart tools to visualize information, analyze
            <br />
            FTTH data, process maps, and 
            <br />
            support field decisions.
        </p>
       
      </div>


      {/* RIGHT SPACE */}
      <div className="w-[520px]" />

    </div>
  );
}