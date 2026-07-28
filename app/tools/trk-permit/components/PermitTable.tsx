import type { CableResult } from "@/app/tools/trk-permit/utils/kmlParser";
import { exportExcel } from "@/app/tools/trk-permit/utils/exportExcel";


type Props = {
  data: CableResult;
};


export default function PermitTable({
  data,
}: Props) {


  if (!data) return null;



  return (

    <div>


      <div
        className="
          flex
          items-center
          justify-between
          mb-4
        "
      >

        <h2
          className="
            text-lg
            font-semibold
            text-white
          "
        >
          {data.title}
        </h2>



        <button
          onClick={() => exportExcel(data)}
          className="
            rounded-xl
            bg-white/10
            border border-white/15
            px-4
            py-2
            text-sm
            text-white
            cursor-pointer
            transition-all
            duration-200
            hover:scale-105
            hover:bg-white/15
          "
        >
          Export Excel
        </button>


      </div>




      <div
        className="
          overflow-hidden
          rounded-2xl
          border border-white/10
          bg-white/4
          backdrop-blur-xl
          shadow-[0_20px_50px_rgba(0,0,0,0.35)]
        "
      >


        <table
          className="
            w-full
            text-sm
          "
        >


          <thead
            className="
              bg-white/6
              text-white/70
            "
          >

            <tr>


              <th
                className="
                  px-5
                  py-3
                  text-left
                  font-medium
                "
              >
                No
              </th>



              <th
                className="
                  px-5
                  py-3
                  text-left
                  font-medium
                "
              >
                Nama Site
              </th>



              <th
                className="
                  px-5
                  py-3
                  text-left
                  font-medium
                "
              >
                Nama Jalan
              </th>



              <th
                className="
                  px-5
                  py-3
                  text-left
                  font-medium
                "
              >
                Start (Lat, Long)
              </th>



              <th
                className="
                  px-5
                  py-3
                  text-left
                  font-medium
                "
              >
                End (Lat, Long)
              </th>



              <th
                className="
                  px-5
                  py-3
                  text-right
                  font-medium
                "
              >
                Panjang Kabel (m)
              </th>


            </tr>


          </thead>




          <tbody
            className="
              text-white/80
            "
          >


            {data.lines.length === 0 ? (

              <tr
                className="
                  border-t
                  border-white/10
                "
              >

                <td
                  colSpan={6}
                  className="
                    px-5
                    py-6
                    text-center
                    text-white/40
                  "
                >
                  No permit data
                </td>


              </tr>


            ) : (


              data.lines.map(
                (line,index) => (

                  <tr
                    key={`${line.no}-${index}`}
                    className="
                      border-t
                      border-white/10
                      hover:bg-white/5
                      transition
                    "
                  >


                    <td
                      className="
                        px-5
                        py-3
                        text-left
                      "
                    >
                      {line.no}
                    </td>



                    <td
                      className="
                        px-5
                        py-3
                        text-left
                      "
                    >
                      {line.site}
                    </td>



                    <td
                      className="
                        px-5
                        py-3
                        text-left
                      "
                    >
                      {line.jalan}
                    </td>



                    <td
                      className="
                        px-5
                        py-3
                        text-left
                      "
                    >
                      {line.start}
                    </td>



                    <td
                      className="
                        px-5
                        py-3
                        text-left
                      "
                    >
                      {line.end}
                    </td>



                    <td
                      className="
                        px-5
                        py-3
                        text-right
                      "
                    >
                      {line.length} m
                    </td>



                  </tr>

                )
              )


            )}


          </tbody>


        </table>


      </div>


    </div>

  );

}