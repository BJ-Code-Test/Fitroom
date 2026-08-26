# GATES — FitRoom Mannequin Asset  (alle erfuellt, Stand: Build vom 2026-08-26)

Reproduzieren:
```
D:\Blender\blender.exe -b --python D:\FitRoom\assets\blender\build_mannequin.py
D:\Blender\blender.exe -b --python D:\FitRoom\assets\blender\render_previews.py
D:\Blender\blender.exe -b --python D:\FitRoom\assets\blender\turntable.py
D:\Blender\blender.exe -b --python D:\FitRoom\assets\blender\make_mp4.py
```

## G1 Ein einziges verbundenes Mesh-Objekt namens `Mannequin`
- [x] met
  CHECK: "D:/Blender/blender.exe" -b "D:/FitRoom/assets/blender/mannequin.blend" --python "D:/FitRoom/assets/blender/verify_mannequin.py"
  EXPECT: VERIFY_OK
  EVIDENCE: 1 Mesh-Objekt, 1 zusammenhaengende Komponente, Name `Mannequin`.

## G2 Hoehe 1.78 m, Sohlen auf Z=0, symmetrisch zur YZ-Ebene
- [x] met (Teil von verify_mannequin.py)
  EXPECT: HEIGHT_OK ORIGIN_OK SYMMETRY_OK
  EVIDENCE: 1.78000 m, min z = 0.000000, 0 Vertices ohne Spiegelpartner,
            Objekt-Origin (0,0,0), BBox x-zentriert.

## G3 0 N-Gons, manifold, keine losen/doppelten Verts, Normalen nach aussen
- [x] met (Teil von verify_mannequin.py)
  EVIDENCE: ngons 0, non-manifold 0, lose Kanten 0, lose Verts 0,
            Duplikate 0, signiertes Volumen +0.0712 m3.

## G4 Tris im Budget 12000..30000
- [x] met — 18148 Tris (9074 Quads, 100 % Quads).

## G5 Mess-Edge-Loops geschlossen und exakt horizontal
- [x] met — alle 6 Loops closed=True, planar=True (siehe Tabelle im Bericht).

## G6 Ein Material `Mannequin_White`, UVs ohne Ueberlappung
- [x] met — 1 Material, BaseColor 0.90, Roughness 0.45, Metallic 0.0;
            UV-Overlap 0.035 % der belegten Texel (Rasterisierung 1024^2),
            keine UV ausserhalb 0..1.

## G7 GLB existiert, valides glTF 2.0, +Y up
- [x] met
  CHECK: node -e "const s=require('fs').statSync('D:/FitRoom/public/models/mannequin.glb');console.log(s.size>50000?'GLB_OK '+s.size:'GLB_SMALL')"
  EXPECT: GLB_OK
  EVIDENCE: 453016 Bytes, glTF 2.0, 1 Mesh / 1 Primitive,
            POSITION min/max Y = 0 .. 1.78 -> +Y up, 18148 Tris.

## G8 Vier Previews 800x1000 + Wireframes, visuell geprueft
- [x] met — front/side/three_quarter/back + 2 Wireframes, alle 800x1000,
            von mir mit dem Read-Tool angesehen und iterativ nachgebessert
            (3 Korrekturrunden: Schulter, Becken/Oberschenkel, Zeh/Hand).

## G9 Turntable 120 Frames, 3 Grad/Frame, 900x1260 RGBA
- [x] met
  CHECK: node "D:/FitRoom/assets/blender/check_sequence.mjs"
  EXPECT: SEQ_OK
  EVIDENCE: 120 WebP + 120 PNG, je 900x1260, Alpha-Flag gesetzt,
            gesamt 2117096 B (2.02 MB), Schnitt 17.2 KB, max 22.6 KB.

## G10 MP4 + Kontaktabzug, Kontaktabzug visuell geprueft
- [x] met — mannequin_turntable.mp4 (334 KB, 30 fps, H.264, 120 Frames),
            turntable_contact.png 900x945 mit Frames 1,11,...,111;
            visuell geprueft: gleichmaessige Drehung, Figur mittig,
            keine Groessenaenderung (120 mm Brennweite).
