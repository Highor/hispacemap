# Hispace map maintenance

- Keep the local map and https://hispacemap.highor.com synchronized in both directions. A local map change must also be published online; an online change must also reach the local preview. Only an explicit user instruction to keep work unpublished overrides this policy.
- This repository is the shared website source. The Hispace project's Tools/WorldMap.ps1 preview serves this same checkout at http://127.0.0.1:8765. Do not maintain a second, divergent UI or generator. Update relevant game-project generation helpers as well when available; report any unavailable counterpart instead of claiming synchronization.
- Keep all website text English, the initial spoiler dialog and blurred/blocked background, generate-only controls and the seedid bookmark parameter.
- Verify the change locally and on the actual HTTPS deployment. Confirm the GitHub Pages build, then check the visible behavior; a stale browser tab or successful push alone is insufficient. Restart the local process after server-code changes.
- Never publish the private game repository, credentials, user saves or saved progression. The map assets contain only authored fixed geometry and initial-world reference data.
- Preserve HS1 compatibility and its reference tests. Use a new generator version for incompatible placement/terrain changes.
