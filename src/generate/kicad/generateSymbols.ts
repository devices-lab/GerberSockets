const GENERATOR = "GerberSockets_generator";
const GENERATOR_VERSION = "0.1";
const REFERENCE_DESIGNATOR = "GS";

export function generateKiCadSymbols(netNames: string[]): string {
  const symbolFileHeader = `
    (kicad_symbol_lib
        (version 20241209)
        (generator "${GENERATOR}")
        (generator_version "${GENERATOR_VERSION}")
    `;

  const symbolEntries = netNames
    .map(
      (netName) => `
        (symbol "${netName}"
            (pin_numbers
                (hide yes)
            )
            (exclude_from_sim no)
            (in_bom no)
            (on_board yes)
            (property "Reference" "${REFERENCE_DESIGNATOR}"
                (at 0 3.048 0)
                (do_not_autoplace)
                (effects
                    (font
                        (size 1.27 1.27)
                    )
                )
            )
            (property "Value" "${netName}"
                (at 0 0 0)
                (effects
                    (font
                        (size 1.27 1.27)
                    )
                    (hide yes)
                )
            )
            (property "Footprint" "GerberSockets:${netName}"
                (at 0 -6.604 0)
                (effects
                    (font
                        (size 1.27 1.27)
                    )
                    (hide yes)
                )
            )
            (property "Datasheet" ""
                (at 0 0 0)
                (effects
                    (font
                        (size 1.27 1.27)
                    )
                    (hide yes)
                )
            )
            (property "Description" "ASCII GerberSocket for net ${netName}"
                (at 0 -9.144 0)
                (do_not_autoplace)
                (effects
                    (font
                        (size 1.27 1.27)
                    )
                    (hide yes)
                )
            )
            (symbol "${netName}_0_1"
                (arc
                    (start 6.35 -2.54)
                    (mid 3.7874 0)
                    (end 6.35 2.54)
                    (stroke
                        (width 0)
                        (type default)
                    )
                    (fill
                        (type none)
                    )
                )
            )
            (symbol "${netName}_1_1"
                (text "${netName} GerberSocket"
                    (at 0 -4.064 0)
                    (effects
                        (font
                            (size 1.27 1.27)
                        )
                    )
                )
                (pin bidirectional line
                    (at 0 0 0)
                    (length 3.81)
                    (name "${netName}"
                        (effects
                            (font
                                (size 1.27 1.27)
                            )
                        )
                    )
                    (number "1"
                        (effects
                            (font
                                (size 1.27 1.27)
                            )
                        )
                    )
                )
            )
            (embedded_fonts no)
        )
    `
    )
    .join("\n");

  let symbolsFileString = symbolFileHeader + symbolEntries + `)`;

  return symbolsFileString;
}
