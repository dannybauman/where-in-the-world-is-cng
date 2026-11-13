# What hit here? candidate events (probed 2026-11-12)

Pictures: titiler.xyz /stac/bbox on Earth Search sentinel-2-l2a items, 768 px, assets=visual (true color) unless marked NDVI
(NDVI = assets=red&assets=nir, expression (b2-b1)/(b2+b1), rescale -0.2,1, colormap rdylgn). Box = [W,S,E,N]. Verdicts come from opening the PNGs.
Watch for tile-edge black wedges: boxes below were checked, but shifting them can cross a tile edge.
Helper scripts left in the folder: s.sh (search), g.sh (true color PNG), n.sh (NDVI PNG), m.sh (montage).

## Tornado - Bassfield/Soso, Mississippi, Easter 2020 (Apr 12): CLEAR
- Source: https://en.wikipedia.org/wiki/Tornado_outbreak_of_April_12%E2%80%9313,_2020 (EF4 track through Jefferson Davis / Covington / Jones counties)
- Box: [-89.58, 31.56, -89.28, 31.80]
- Before: S2A_16SBA_20200405_0_L2A (2020-04-05). After: S2B_16SBA_20200430_0_L2A (2020-04-30, a few small clouds in the box)
- Mark: a brown band 1-2 km wide running diagonally (SW to NE) across the whole frame through dark green pine forest and farmland. Typical of a tornado: long, narrow, nearly straight, sharp edges.
- True color is enough. Apr 30 is the better after; the Apr 15 scene (S2A_16SBA_20200415_0_L2A) shows the scar only faintly (debris not yet browned).
- PNGs: tornado-before.png, tornado-after.png
- Not tried: Mayfield KY, Rolling Fork MS.

## Hurricane / cyclone: two CLEAR options
### A. Hurricane Maria, Dominica, Sept 18-19 2017: CLEAR
- Source: https://en.wikipedia.org/wiki/Effects_of_Hurricane_Maria_in_Dominica
- Box: [-61.5, 15.3, -61.2, 15.6] (northern two thirds of the island; south is in another tile and the box edge goes black if moved south)
- Before: S2B_20PPC_20170904_0_L2A (2017-09-04). After: S2A_20PPC_20171029_0_L2A (2017-10-29)
- Mark: a whole island of deep green turns brown, stripped by wind, in broad streaks over the ridges. Typical of a hurricane: wide, regional, fuzzy edged, covers everything instead of one line. Both pictures are cloud-speckled (island weather) but the brown is unmissable.
- True color is enough.
- PNGs: hurricane-before.png, hurricane-after.png
### B. Hurricane Ian, Sanibel Island / Fort Myers Beach, FL, Sept 28 2022: CLEAR (best for storm surge)
- Source: https://en.wikipedia.org/wiki/Hurricane_Ian
- Box: [-82.2, 26.38, -81.9, 26.58]
- Before: S2B_17RLK_20220329_0_L2A (2022-03-29). After: S2B_17RLK_20221025_0_L2A (2022-10-25, 0.5%). Oct 5 (S2B_17RLK_20221005_0_L2A) also works with a few clouds.
- Mark: the green mangrove and woodland island turns tan-brown from saltwater surge, the beach narrows, the water darkens. Typical of storm surge: damage follows the coast and low ground. Before is March (season and tide not matched), Florida is evergreen so it still reads. Cloud-free Aug/Sept before was not found (all 10-50% cloud).
- True color is enough.
- PNGs: hurricane-ian-before.png, hurricane-ian-after.png
- Michael 2018 (Calhoun/Gulf forest) tried: FAINT, only darker forest and flooded rivers. Boxes [-85.6,30.0,-85.3,30.25] and [-85.5,30.2,-85.2,30.45], before S2B_16RFU_20180823_1_L2A, after S2B_16RFU_20181012_0_L2A. Not recommended (no PNG kept). Otis not tried.

## Tsunami: FAINT (no CLEAR found)
- Event: Palu, Sulawesi, Sept 28 2018. Source: https://en.wikipedia.org/wiki/2018_Sulawesi_earthquake_and_tsunami
- Box: [119.84, -0.95, 119.94, -0.84]
- Before: S2B_50MRE_20180818_1_L2A (2018-08-18). After: S2A_50MRE_20181022_1_L2A (2018-10-22; one cloud and shadows over the city)
- Mark: bay water turns green-brown and turbid with dark debris streaks along the waterfront. A newcomer sees "muddy water", not a wave. The real damage (liquefaction scars at Petobo/Balaroa) is small and outside this box.
- Also tried Hunga Tonga, Tongatapu: box [-175.4,-21.25,-175.1,-21.0], before S2A_1KFS_20211213_1_L2A, after S2A_1KFS_20220211_0_L2A. Cloudy, coast change faint, ash and a bright green lagoon confuse it: NOT VISIBLE as a tsunami.
- PNGs: tsunami-palu-before.png, tsunami-palu-after.png, tsunami-tonga-before.png, tsunami-tonga-after.png
- Substitute: the Ian storm surge above (water-driven coastal damage), or a landslide / liquefaction kind (Palu Petobo). Sunda Strait 2018 not tried.

## Monsoon flooding: Sindh, Pakistan (Manchar Lake / Dadu), Aug-Sept 2022: CLEAR
- Source: https://en.wikipedia.org/wiki/2022_Pakistan_floods
- Box: [67.45, 26.4, 67.75, 26.7]
- Before: S2B_42RUQ_20220607_0_L2A (2022-06-07). After: S2A_42RUQ_20220910_0_L2A (2022-09-10, 0% cloud)
- Mark: a pale tan dry plain turns into a huge green-brown inland sea that swallows Manchar Lake's shore and the farmland north of it, with a sharp shoreline. Typical of monsoon flooding: slow, wide, shallow water over a flat plain, no direction of travel.
- True color is enough; radar not needed. Faint straight seam lines inside the flood in the after picture are product/mosaic artifacts, not roads.
- PNGs: monsoon-before.png, monsoon-after.png. A wider box [67.4,26.1,67.9,26.55] hits a tile edge at the bottom, use the box above.
- Season caveat: before is June (dry), after September (wet); the contrast is the flood.

## Flash flood: Derna, Libya, Sept 10-11 2023: CLEAR (carried by the sea plume; the scour is subtler)
- Source: https://en.wikipedia.org/wiki/Derna_flood
- Box: [22.58, 32.70, 22.72, 32.80]
- Before: S2B_34SFB_20230907_0_L2A (2023-09-07). After: S2A_34SFB_20231012_0_L2A (2023-10-12, 0.4%). Do not use Sept 12 (S2A_34SFB_20230912_0_L2A): bigger plume but cloud-speckled.
- Mark: the dry wadi through the city is scoured wider and paler, and a brown mud plume stains the sea off the harbour. Typical of a flash flood: a narrow channel carved through a dry valley plus a sediment fan at the mouth. At this box size the pale wadi is easy to miss, the sea color change is what a newcomer sees first.
- True color is enough.
- PNGs: flash-before.png, flash-after.png

## Derecho: Iowa, Aug 10 2020 (Cedar Rapids / Benton Co.): FAINT
- Source: https://en.wikipedia.org/wiki/August_2020_Midwest_derecho
- Box: [-92.1, 41.85, -91.75, 42.1]
- Before: S2A_15TWG_20200710_1_L2A (2020-07-10, 0%). After: S2A_15TWG_20200819_1_L2A (2020-08-19, 0%). Closer befores (Aug 4/6) are cloudy.
- Mark: the corn grid goes from uniform dark green to a patchwork of paler, yellower fields where corn was flattened. In NDVI the damaged fields are lighter green blocks. It is patchy, a 5-week gap adds normal crop change, and a newcomer would not name a cause. Typical of a derecho in principle: damage over a wide area, field by field, no clean line.
- NDVI shows it slightly better than true color, still not CLEAR.
- PNGs: derecho-before.png, derecho-after.png (NDVI); derecho-before-truecolor.png, derecho-after-truecolor.png
- Not tried: a box on the worst path near Marshalltown, or a cloud-free before from Aug 1-9.
- Substitute: a straight-line-wind forest blowdown (not found in budget), or drop it.

## Hail swath: FAINT
- Event A: Sully/Stanley counties, South Dakota, June 27-29 2018. NASA EO: https://science.nasa.gov/earth/earth-observatory/hail-cuts-swaths-of-damage-across-south-dakota-92401/
  - Box [-100.5, 44.5, -100.15, 44.75]. Before S2B_14TLQ_20180615_2_L2A (2018-06-15). After S2A_14TLQ_20180713_0_L2A (2018-07-13, 0%).
  - A broad NW-SE band of browned crops is hinted in NDVI, but fields and fallow dominate; a newcomer cannot separate it from the normal patchwork. FAINT.
  - PNGs: hail-sd-before.png, hail-sd-after.png (true color), hail-sd-ndvi-before.png, hail-sd-ndvi-after.png
- Event B: Vulcan, Alberta, Aug 20 2025, swath about 200 km long. NASA EO: https://science.nasa.gov/earth/earth-observatory/hail-scars-alberta-farmland-154724/
  - Box [-113.3, 50.3, -112.95, 50.55]. Before S2C_12UUA_20250813_0_L2A (2025-08-13). After S2C_12UUA_20250823_0_L2A (2025-08-23, 0%). A tile edge cuts the top of the box. The swath is not clearly visible (10-day gap, ripening confounds). FAINT. A 60 km box ([-113.3,50.2,-112.3,50.7]) hit an orbit edge and was unusable.
  - PNGs: hail-alberta-before.png, hail-alberta-after.png
- Why it is hard: hail scars are 100-200 km long but only 5-15 km wide and show well in MODIS/Landsat. At 8-30 km boxes the field mosaic hides the swath. Best chance: use the swath's true coordinates from the NASA EO MODIS image, a box across its widest part, NDVI, and an after within 7-14 days. Not done.

## Dust storm: NOT FOUND (single picture)
- Tried the June 2020 "Godzilla" Saharan plume at Boa Vista, Cabo Verde (ESA: https://www.esa.int/Applications/Observing_the_Earth/Satellites_track_unusual_Saharan_dust_plume), box [-23.0, 16.0, -22.7, 16.25], S2B_27PTT_20200615_0_L2A (2020-06-15) and S2B_27PTT_20200622_0_L2A.
- Mark: Jun 15 shows only a gray haze washing out sea and land, no plume with edges (L2A correction removes much of the aerosol, and the box is on the tile edge). NOT VISIBLE as a plume to a newcomer. No PNG kept.
- Not checked: Bodele, Aral, Gobi (Mar 15 2021), Great Salt Lake bed, Iceland sands, a haboob.
- Substitute: dust plumes show best in Sentinel-3 / MODIS (not this game's source). Swap in another kind: volcanic ash plume, wildfire smoke plume, or landslide.

## Glacial lake outburst: South Lhonak Lake, Sikkim, Oct 3-4 2023: FAINT
- Source: https://en.wikipedia.org/wiki/2023_Sikkim_flash_flood
- Lake box: [88.14, 27.895, 88.24, 27.945]. Before S2B_45RXL_20230916_0_L2A (2023-09-16, lake area clear). After S2B_45RXL_20231029_0_L2A (2023-10-29, 11% scene) or S2A_45RXL_20231113_0_L2A (2023-11-13, 0.6%).
- Mark: the turquoise lake is smaller with a dark exposed shore, but snow all around and a similar pale lake beside it make it look like two similar pictures. FAINT.
- Downstream box [88.55, 27.4, 88.75, 27.65] (Teesta valley near Chungthang): after S2B_45RXL_20231115_0_L2A shows a pale scoured river line down the valley, but before S2B_45RXL_20230906_0_L2A is mostly cloud, so the pair is not usable. An earlier cloud-free before (2023 spring or Oct 2022) might make this CLEAR; not found in budget. Note 45RXM items cover only 35% of the lake box, use 45RXL.
- True color only.
- PNGs: glof-lake-before.png, glof-lake-after.png, glof-teesta-before.png (cloudy), glof-teesta-after.png
- Substitute: the Teesta valley scour if a clear before turns up, otherwise a landslide.
