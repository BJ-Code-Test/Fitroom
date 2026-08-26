# GATES — Schaufensterpuppe v2 (Neubau nach Ablehnung von v1)

Scope/OWNS: assets/blender/**, public/models/mannequin.glb, public/sequence/mannequin/**
Nicht anfassen: src/**, tests/**, index.html, package.json

Warnung aus v1: die alte Ledger-Datei hakte "visuell geprueft" ab, obwohl das Ergebnis
vom Nutzer als unbrauchbar zurueckgewiesen wurde. G7 hier ist deshalb bewusst als
manuelles Gate mit dokumentierter Evidenz und ehrlichem Restfazit formuliert.

## G1 — Build laeuft fehlerfrei durch
- [ ] `build_mannequin2.py` erzeugt ein Objekt `Mannequin`.
    CHECK: "D:\Blender\blender.exe" -b --factory-startup --python "D:\FitRoom\assets\blender\build_mannequin2.py"
    EXPECT: BUILD_OK

## G2 — Geometrie-Spezifikation, unabhaengig nachgemessen
- [ ] Hoehe 1.78 m +-2 mm, min Z = 0, symmetrisch zur YZ-Ebene, Front nach -Y,
      Tris <= 60000, 0 N-Gons, 0 non-manifold, 1 Objekt, 1 Material `Mannequin_White`,
      UV-Layer vorhanden und im Bereich 0..1, Normalen nach aussen (Volumen > 0).
    CHECK: "D:\Blender\blender.exe" -b "D:\FitRoom\assets\blender\mannequin.blend" --python "D:\FitRoom\assets\blender\verify2.py"
    EXPECT: VERIFY_OK

## G3 — Mess-Edge-Loops geschlossen und horizontal
- [ ] loop_ankle/loop_knee/loop_hip/loop_waist/loop_chest/loop_shoulder existieren als
      Vertex-Groups, jede bildet einen geschlossenen Kantenzyklus, Z-Spanne < 1 mm.
    CHECK: "D:\Blender\blender.exe" -b "D:\FitRoom\assets\blender\mannequin.blend" --python "D:\FitRoom\assets\blender\verify_loops2.py"
    EXPECT: LOOPS_OK

## G4 — glTF exportiert und strukturell valide
- [ ] `public/models/mannequin.glb`: glTF 2.0, genau ein Mesh, POSITION/NORMAL/TEXCOORD_0,
      +Y up, Hoehe 1.78 in Y.
    CHECK: node "D:\FitRoom\assets\blender\check_glb2.mjs"
    EXPECT: GLB_OK

## G5 — Schaufensterpuppen-Proportion statt Menschmodell
- [ ] Unabhaengig gemessene Kopfhoehen-Zahl 8.3..9.2 und Beinanteil (Schritthoehe/Gesamthoehe) >= 0.50.
    CHECK: "D:\Blender\blender.exe" -b "D:\FitRoom\assets\blender\mannequin.blend" --python "D:\FitRoom\assets\blender\verify_proportion.py"
    EXPECT: PROPORTION_OK

## G6 — Renderings vorhanden und aktuell
- [ ] front/side/three_quarter/back/shoulder_closeup/hand_closeup als PNG in preview/,
      jedes neuer als die .blend-Datei.
    CHECK: node "D:\FitRoom\assets\blender\check_previews2.mjs"
    EXPECT: PREVIEWS_OK

## G7 — Visuelle Abnahme (manuell, mit Evidenz)
- [ ] Mindestens drei Runden bauen -> rendern -> Bilder selbst mit dem Read-Tool
      ansehen -> nachbessern. Beurteilt werden: keine Facetten auf der Silhouette,
      fliessender Schulter-/Achsel-Uebergang, schlanke Hand mit Daumen und Handgelenk,
      Standpose glaubwuerdig. Ehrliches Restfazit gehoert in den Bericht, auch wenn negativ.
      MANUAL: Runden und Befunde im Abschlussbericht dokumentiert.

## G8 — Turntable neu, im Budget
- [ ] 120 WebP RGBA in `public/sequence/mannequin/`, je 900x1260, Summe < 10 MB,
      Frame 0001 = Front, 3 Grad/Frame, alle Frames neuer als die .blend-Datei.
    CHECK: node "D:\FitRoom\assets\blender\check_sequence2.mjs"
    EXPECT: SEQUENCE_OK

## G9 — App-Dateien unangetastet
- [ ] src/**, tests/**, index.html, package.json unveraendert gegenueber Sitzungsbeginn.
    CHECK: node "D:\FitRoom\assets\blender\check_untouched.mjs"
    EXPECT: UNTOUCHED_OK
