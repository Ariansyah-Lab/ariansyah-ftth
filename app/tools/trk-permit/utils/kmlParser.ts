export type CableLine = {
  no: number;
  site: string;
  jalan: string;
  start: string;
  end: string;
  length: number;
};


export type CableResult = {
  title: string;
  lines: CableLine[];
  totalLength: number;
};



function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {

  const R = 6371000;


  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;


  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;



  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;



  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );

}




function calculateLength(coords: string) {


  const points =
    coords
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => {

        const value =
          p.split(",");


        return {
          lon: Number(value[0]),
          lat: Number(value[1]),
        };

      });



  let total = 0;



  for (let i = 1; i < points.length; i++) {


    total += getDistance(
      points[i - 1].lat,
      points[i - 1].lon,
      points[i].lat,
      points[i].lon
    );


  }



  return Math.round(total);

}




function getCoordinate(
  coords: string,
  index: number
) {

  const points =
    coords
      .trim()
      .split(/\s+/)
      .filter(Boolean);



  const value =
    points[index]
      ?.split(",");



  if (!value) return "-";



  const lon =
    Number(value[0]).toFixed(6);


  const lat =
    Number(value[1]).toFixed(6);



  return `${lat}, ${lon}`;

}





export function parseKML(
  xml: string,
  fallbackTitle: string
): CableResult {


  const parser =
    new DOMParser();



  const doc =
    parser.parseFromString(
      xml,
      "text/xml"
    );



  const title =
    doc.querySelector("Document > name")
      ?.textContent
      ?.trim()
      ||
      fallbackTitle;



  const lines: CableLine[] = [];



  const placemarks =
    Array.from(
      doc.getElementsByTagName(
        "Placemark"
      )
    );



  placemarks.forEach((placemark) => {


    const line =
      placemark.getElementsByTagName(
        "LineString"
      )[0];



    if (!line) return;



    const coordinates =
      line
        .getElementsByTagName(
          "coordinates"
        )[0]
        ?.textContent
        ||
        "";



    const length =
      calculateLength(
        coordinates
      );



    const start =
      getCoordinate(
        coordinates,
        0
      );



    const points =
      coordinates
        .trim()
        .split(/\s+/)
        .filter(Boolean);



    const end =
      getCoordinate(
        coordinates,
        points.length - 1
      );





    let parent =
      placemark.parentElement;



    const folders: string[] = [];



    while (parent) {


      if (
        parent.tagName === "Folder"
      ) {


        const folderName =
          parent
            .querySelector(":scope > name")
            ?.textContent
            ?.trim();



        if (folderName) {

          folders.push(
            folderName
          );

        }

      }



      parent =
        parent.parentElement;

    }



    const jalan =
      folders[0] ?? "-";



    const site =
      folders[1] ?? "-";



    lines.push({

      no:
        lines.length + 1,

      site,

      jalan,

      start,

      end,

      length,

    });



  });



  return {

    title,

    lines,

    totalLength:
      lines.reduce(
        (sum, item) =>
          sum + item.length,
        0
      ),

  };

}