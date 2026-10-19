# Hispace World Map

Browser-only map generator for Hispace. Hosted at https://hispacemap.highor.com.

Enter the `HS1-Ã¢â‚¬Â¦` seed displayed in a game save/load slot. Generation updates
`?seedid=HS1-Ã¢â‚¬Â¦`; bookmark or share that URL to reopen the same map. No server-side
generation, Unreal installation, user account or uploaded save is required.

The map shows the initial world. Buildings, depletion, respawned resources and
enemy damage are saved progression and cannot be inferred from a seed. Unseeded
legacy game saves cannot be recreated from an industry seed alone.

## Development

Serve this directory with any static HTTP server. Native JavaScript modules are
used; opening index.html directly as file:// is not supported. No dependencies or
build step are required. Run `npm test` (or `node tests/generator.test.mjs`).

The HS1 implementation reproduces the game's separately salted random streams,
Unreal FRandomStream arithmetic, float rounding and triangle-based terrain queries.
Golden reference fixtures cover seven independently exported Unreal worlds,
including minimum/maximum seed values, with a 2 cm horizontal placement tolerance.
Do not change HS1 in ways that move existing worlds; introduce a versioned generator
for incompatible game/terrain changes.

The public assets contain only authored terrain, fixed initial marker geometry and
Oxanium fonts. Font license: assets/OFL.txt. No player save, secret, engine binary
or private project repository is included. Site and game map assets Ã‚Â© Highor.

GitHub Pages publishes the root of main. CNAME points to hispacemap.highor.com;
the DNS CNAME should point to highor.github.io.

Resource density (18 October 2026): the original HS1 locations and IDs are retained. World 1 has 4,608 Hydrite/Verdite deposits (2,304 each), 128 ore fields (32 per type), 192 glass pieces and 96 Vitraleaf. World 2 has 288 Vitraleaf. The append-only extension is matched against a fresh Unreal export in tests/resource-additions-reference.json. No saved player state is published.

The legend uses accessible cyan checkbox controls. Every category starts unchecked on each page load. Filters combine, survive Generate Map within the current page and hide marker hit targets as well as their labels. Terrain remains visible. No filter preferences are stored.

The main base is always visible and selectable, independently of the Locations checkbox. All other marker categories retain their default-off behavior.

Hydrite/Verdite: 2,304 pickups of each type, 4,608 total. Original HS1 IDs 0-1151 and all unrelated resources remain unchanged. Three independently placed groups duplicate every original group's 1-3 pickup composition. This doubles the previous count of both pickups and locations (for HS1-123456789: 1,362 to 2,724 locations). The first added batch retains its 50 m separation; later added groups are at least 40 m from prior locations. Seven-seed tests cover counts, composition, spacing and repeatability, with new coordinates matched to Unreal.

World 2 relief revision 1 adds broad walkable basalt hills and valleys. This updates authored ground heights without changing any HS1 resource XY/ID placements, as checked against all existing reference seeds. Display heights and collision queries use the same regenerated mesh. Generator test counts now include the existing northwest outpost, its eight ground enemies and ten flying enemies.

Map orientation: north is up, east is right. Axes and selected marker details use E = X/100 and N = -Y/100, matching the game. Terrain cell edges and pan input share this orientation. Skeletons and danger signs are omitted from Locations and cannot be selected.

Western wildlife extension: independent streams 302/303 append 28 groups of 1–3 stingers and four rare 340-HP ground creatures in World 2 west, avoiding mission sites. Original enemy IDs and positions remain intact. Fresh Unreal reference positions are checked within 2 cm.
