# Hispace World Map

Browser-only map generator for Hispace. Hosted at https://hispacemap.highor.com.

Enter the `HS1-…` seed displayed in a game save/load slot. Generation updates
`?seedid=HS1-…`; bookmark or share that URL to reopen the same map. No server-side
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
or private project repository is included. Site and game map assets © Highor.

GitHub Pages publishes the root of main. CNAME points to hispacemap.highor.com;
the DNS CNAME should point to highor.github.io.

Resource density (18 October 2026): the original HS1 locations and IDs are retained. World 1 has 2,304 Hydrite/Verdite deposits, 128 ore fields (32 per type), 192 glass pieces and 96 Vitraleaf. World 2 has 288 Vitraleaf. The append-only extension is matched against a fresh Unreal export in tests/resource-additions-reference.json. No saved player state is published.

The legend uses accessible cyan checkbox controls. Every category starts unchecked on each page load. Filters combine, survive Generate Map within the current page and hide marker hit targets as well as their labels. Terrain remains visible. No filter preferences are stored.

The main base is always visible and selectable, independently of the Locations checkbox. All other marker categories retain their default-off behavior.

Hydrite/Verdite correction: double the number of locations by placing one separate new group for every original group, preserving its 1-3 pickup composition. New groups are at least 50 m from original and earlier added groups. Original HS1 IDs 0-1151 and all unrelated resources remain unchanged. The total remains 2,304 mineral pickups. Seven seed tests verify exact group-count doubling, composition, separation and repeatability; new positions match Unreal.
