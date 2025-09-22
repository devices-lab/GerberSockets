import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function App() {
  const [netNames, setNetNames] = useState<string[]>([""]);
  const [footprints, setFootprints] = useState<string[]>([]);

  // Helper function to handle net name changes
  const handleNetNameChange = (index: number, value: string) => {
    const updatedNames = [...netNames];
    updatedNames[index] = value;
    setNetNames(updatedNames);
  };

  // Add a new empty net name input
  const addNetNameField = () => {
    setNetNames((prev) => [...prev, ""]);
  };

  const generateSingleFootprint = (netName: string) => {
    let circleIncrement = 1;
    let currentOffset = 0;

    const asciiValues = netName.split("").map((char) => {
      const asciiValue = char.charCodeAt(0).toString();
      const circleSize = currentOffset.toString();

      //
      //                ASCII character [32-127]
      //                │
      // leading zero   │
      //      │  ┌──┬─┬─▼─┬──┐
      //      └──►0.│#│###│01◄──┐ mm
      //         └──┴▲┴───┴──┘  │
      //             │   trailing zero and one
      //             │
      // circle order [0-9]
      //
      const resultingWidth = "0." + circleSize + asciiValue + "01";

      currentOffset += circleIncrement;
      return `	
    (fp_line
        (start 0 0)
        (end 0 0)
        (stroke
            (width ${resultingWidth})
            (type default)
        )
        (layer "User.1")
        (uuid "${uuidv4()}")
    )`;
    });

    const firstPart = `
(footprint "${netName}"
    (version 20240108)
    (generator "create-gerbersockets")
    (generator_version "0.1")
    (layer "F.Cu")
    (property "Reference" "GS**"
        (at 0 -2 0)
        (unlocked yes)
        (layer "F.SilkS")
        (hide yes)
        (uuid "${uuidv4()}")
        (effects
            (font
                (size 1 1)
                (thickness 0.1)
            )
        )
    )
    (property "Value" "GND"
        (at 0 3.7 0)
        (unlocked yes)
        (layer "F.Fab")
        (uuid "${uuidv4()}")
        (effects
            (font
                (size 1 1)
                (thickness 0.15)
            )
        )
    )
    (property "Footprint" "GND"
        (at 0 2.2 0)
        (unlocked yes)
        (layer "F.Fab")
        (hide yes)
        (uuid "${uuidv4()}")
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
        (uuid "${uuidv4()}")
        (effects
            (font
                (size 1 1)
                (thickness 0.15)
            )
        )
    )
    (property "Description" ""
        (at 0 0 0)
        (unlocked yes)
        (layer "F.Fab")
        (hide yes)
        (uuid "${uuidv4()}")
        (effects
            (font
                (size 1 1)
                (thickness 0.15)
            )
        )
    )
    (attr smd)`;

    const lastPart = `
    (fp_text user "\${REFERENCE}"
        (at 0 5.2 0)
        (unlocked yes)
        (layer "F.Fab")
        (uuid "${uuidv4()}")
        (effects
            (font
                (size 1 1)
                (thickness 0.15)
            )
        )
    )
    (pad "1" smd circle
        (at 0 0)
        (size 0.1 0.1)
        (layers "F.Cu")
        (uuid "${uuidv4()}")
    )
)`;

    return `${firstPart}
    ${asciiValues.join("")}
    ${lastPart}`;
  };

  // Generate footprints for all net names, store them in a ZIP, and prompt download
  const generateAndDownloadZip = async () => {
    // Check if there's at least one net name
    if (!netNames.some((name) => name.trim().length > 0)) {
      alert("Please enter at least one net name.");
      return;
    }

    const zip = new JSZip();

    // Generate footprints for each non-empty net name
    const newFootprints: string[] = [];
    netNames.forEach((netName) => {
      const trimmedName = netName.trim();
      if (trimmedName) {
        const footprint = generateSingleFootprint(trimmedName);
        newFootprints.push(footprint);

        // Add a .kicad_mod file for each net name
        zip.file(`${trimmedName}.kicad_mod`, footprint);
      }
    });

    // If you want to show all footprints on the page
    setFootprints(newFootprints);

    // Generate the ZIP and download
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "footprints.zip");
  };

  return (
    <div className="app-container">
      <h1 className="title">GerberSockets KiCad footprint generator</h1>

      {/* Dynamically render net name input fields */}
      {netNames.map((netName, index) => (
        <div className="input-container" key={index}>
          <label className="label">Net name {index + 1}</label>
          <input
            type="text"
            maxLength={10}
            value={netName}
            onChange={(e) => handleNetNameChange(index, e.target.value)}
            className="text-input"
          />
        </div>
      ))}

      {/* Button to add a new net name field */}
      <button onClick={addNetNameField} className="add-button">
        ➕ Add another net
      </button>

      {/* Generate & download the ZIP file */}
      <button onClick={generateAndDownloadZip} className="generate-button">
        ⬇️ Generate & download ZIP file
      </button>

      {/* Optionally show the generated footprints on screen */}
      {footprints.length > 0 && (
        <div className="footprint-list">
          {footprints.map((fp, idx) => (
            <pre key={idx} className="footprint-container">
              {fp}
            </pre>
          ))}
        </div>
      )}
    </div>
  );
}
