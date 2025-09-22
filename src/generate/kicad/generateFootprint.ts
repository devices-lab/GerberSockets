import { v4 as uuid } from "uuid";
import type { Circle } from "./../calculateCircles";
import type { CrosshairLayer, SocketsLayer } from "../generateLibrary";

const GENERATOR = "GerberSockets_generator";
const GENERATOR_VERSION = "0.1";
const REFERENCE_DESIGNATOR = "GS**";

export function generateKiCadFootprint(
  netName: string,
  circles: Circle[],
  crosshairLayer: CrosshairLayer,
  socketsLayer: SocketsLayer,
  copperPadDiameter: number
): string {
  let numberOfCircles = circles.length; // Includes identifier circle

  const footprintHeader = `
(footprint "${netName}"
	(version 20241229)
	(generator "${GENERATOR}")
	(generator_version "${GENERATOR_VERSION}")
	(layer "F.Cu")
	(descr "ASCII GerberSocket for ${netName} net (${numberOfCircles} circles, ${copperPadDiameter} mm pad)")
	(property "Reference" "${REFERENCE_DESIGNATOR}"
		(at 0 -2 0)
		(unlocked yes)
		(layer "F.SilkS")
		(hide yes)
		(uuid "${uuid()}")
		(effects
			(font
				(size 1 1)
				(thickness 0.1)
			)
		)
	)
	(property "Value" "${netName}"
		(at 0 3.7 0)
		(unlocked yes)
		(layer "F.Fab")
		(uuid "${uuid()}")
		(effects
			(font
				(size 1 1)
				(thickness 0.15)
			)
		)
	)
	(property "Datasheet" ""
		(at 0 0 0)
		(unlocked yes)
		(layer "F.Fab")
		(hide yes)
		(uuid "${uuid()}")
		(effects
			(font
				(size 1 1)
				(thickness 0.15)
			)
		)
	)
	(property "Description" "${netName} GerberSocket"
		(at 0 0 0)
		(unlocked yes)
		(layer "F.Fab")
		(hide yes)
		(uuid "${uuid()}")
		(effects
			(font
				(size 1 1)
				(thickness 0.15)
			)
		)
	)
	(attr exclude_from_pos_files exclude_from_bom allow_missing_courtyard dnp)
	(fp_line
		(start -0.5 0)
		(end 0.5 0)
		(stroke
			(width 0.1)
			(type solid)
		)
		(layer "${crosshairLayer}")
		(uuid "${uuid()}")
	)
	(fp_line
		(start 0 -0.5)
		(end 0 0.5)
		(stroke
			(width 0.1)
			(type solid)
		)
		(layer "${crosshairLayer}")
		(uuid "${uuid()}")
	)
	(fp_circle
		(center 0 0)
		(end 0.5 0)
		(stroke
			(width 0.1)
			(type solid)
		)
		(fill no)
		(layer "${crosshairLayer}")
		(uuid "${uuid()}")
	)
`;

  const footprintCircles = circles
    .map(
      (circle) => `
	(fp_line
		(start 0 0)
		(end 0 0)
		(stroke
			(width ${circle.diameter})
			(type solid)
		)
		(layer "${socketsLayer}")
		(uuid "${uuid()}")
	)
`
    )
    .join("\n");

  const footprintFooter = `
	(fp_text user "\${REFERENCE}"
		(at 0 5.2 0)
		(unlocked yes)
		(layer "F.Fab")
		(uuid "${uuid()}")
		(effects
			(font
				(size 1 1)
				(thickness 0.15)
			)
		)
	)
	(pad "1" smd circle
		(at 0 0)
		(size ${copperPadDiameter} ${copperPadDiameter})
		(layers "F.Cu")
		(uuid "${uuid()}")
	)
	(zone
		(net 0)
		(net_name "")
		(layers "F.Cu" "B.Cu" "In1.Cu" "In2.Cu" "In3.Cu" "In4.Cu" "In5.Cu" "In6.Cu"
			"In7.Cu" "In8.Cu" "In9.Cu" "In10.Cu" "In11.Cu" "In12.Cu" "In13.Cu" "In14.Cu"
			"In15.Cu" "In16.Cu" "In17.Cu" "In18.Cu" "In19.Cu" "In20.Cu" "In21.Cu"
			"In22.Cu" "In23.Cu" "In24.Cu" "In25.Cu" "In26.Cu" "In27.Cu" "In28.Cu"
			"In29.Cu" "In30.Cu"
		)
		(uuid "${uuid()}")
		(hatch edge 0.5)
		(connect_pads
			(clearance 0)
		)
		(min_thickness 0.25)
		(filled_areas_thickness no)
		(keepout
			(tracks allowed)
			(vias not_allowed)
			(pads allowed)
			(copperpour not_allowed)
			(footprints allowed)
		)
		(placement
			(enabled no)
			(sheetname "")
		)
		(fill
			(thermal_gap 0.5)
			(thermal_bridge_width 0.5)
		)
		(polygon
			(pts
				(xy 0.495722 -0.065263) (xy 0.46194 -0.191342) (xy 0.396677 -0.304381) (xy 0.304381 -0.396677) (xy 0.191342 -0.46194)
				(xy 0.065263 -0.495722) (xy -0.065263 -0.495722) (xy -0.191342 -0.46194) (xy -0.304381 -0.396677)
				(xy -0.396677 -0.304381) (xy -0.46194 -0.191342) (xy -0.495722 -0.065263) (xy -0.495722 0.065263)
				(xy -0.46194 0.191342) (xy -0.396677 0.304381) (xy -0.304381 0.396677) (xy -0.191342 0.46194) (xy -0.065263 0.495722)
				(xy 0.065263 0.495722) (xy 0.191342 0.46194) (xy 0.304381 0.396677) (xy 0.396677 0.304381) (xy 0.46194 0.191342)
				(xy 0.495722 0.065263)
			)
		)
	)
	(embedded_fonts no)
)`;

  let footprintFileString =
    footprintHeader + footprintCircles + footprintFooter;

  return footprintFileString;
}
