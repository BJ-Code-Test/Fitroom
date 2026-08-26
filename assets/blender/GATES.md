# GATES — FitRoom Mannequin Asset

## G1 Mesh existiert, heisst `Mannequin`, ein einziges verbundenes Objekt
- [ ] met
  CHECK: "D:/Blender/blender.exe" -b "D:/FitRoom/assets/blender/mannequin.blend" --python "D:/FitRoom/assets/blender/verify_mannequin.py"
  EXPECT: VERIFY_OK

## G2 Hoehe exakt 1.78 m, Origin zwischen den Fusssohlen auf Z=0, symmetrisch
- [ ] met
  CHECK: (Teil von verify_mannequin.py)
  EXPECT: HEIGHT_OK SYMMETRY_OK ORIGIN_OK

## G3 Topologie: 0 N-Gons, manifold, keine losen/doppelten Verts
- [ ] met
  CHECK: (Teil von verify_mannequin.py)
  EXPECT: NGONS 0, NONMANIFOLD 0, LOOSE 0

## G4 Tris im Bereich 12000..30000
- [ ] met
  CHECK: (Teil von verify_mannequin.py)
  EXPECT: TRIS_IN_BUDGET

## G5 Mess-Edge-Loops geschlossen und horizontal auf den Sollhoehen
- [ ] met
  CHECK: (Teil von verify_mannequin.py)
  EXPECT: LOOPS_OK

## G6 Ein Material `Mannequin_White`, UVs ohne Ueberlappung
- [ ] met
  CHECK: (Teil von verify_mannequin.py)
  EXPECT: MATERIAL_OK UV_OK

## G7 GLB existiert und ist ladbar
- [ ] met
  CHECK: node -e "const s=require('fs').statSync('D:/FitRoom/public/models/mannequin.glb');console.log(s.size>50000?'GLB_OK '+s.size:'GLB_SMALL')"
  EXPECT: GLB_OK

## G8 Vier Preview-Renderings 800x1000 vorhanden UND von mir visuell geprueft
- [ ] met (manuell: Read-Tool auf jedes PNG)

## G9 Turntable: 120 PNG + 120 WebP, 900x1260, RGBA transparent, 3 Grad/Frame
- [ ] met
  CHECK: node "D:/FitRoom/assets/blender/check_sequence.mjs"
  EXPECT: SEQ_OK

## G10 MP4 + Kontaktabzug vorhanden, Kontaktabzug visuell geprueft
- [ ] met (manuell)
