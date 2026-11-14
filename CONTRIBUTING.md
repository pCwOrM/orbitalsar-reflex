# Contributing to OrbitalSAR Reflex

Welcome aboard! Active repository collaborators & Space Apps team:
- **Volkan Dagli** (`@pCwOrM`) — Team Owner
- **Prenses Metin** (`@PrensesMTN`) — Collaborator (`write/push`)
- **Murat Emre ÖZKAYA** — Team Member

## 1. Branch & Deployment Rules

The `main` branch automatically builds and serves our live **NASA Space Apps 2026 Universal Event** web observatory at:
- `https://orbitalsar.space/`

To keep production stable before final judging (**Sunday, Nov 15, 2026 at 23:59 UTC+3**):
1. Do **not** push untested edits directly to `main`.
2. Create a short feature branch per teammate/task:
   - `feat/prenses-<topic>`
   - `feat/murat-<topic>`
   - `docs/<topic>`
3. Open a Pull Request into `main` using the PR template and ensure tests pass before merging.

## 2. Local Setup & Verification

```bash
git clone https://github.com/pCwOrM/orbitalsar-reflex.git
cd orbitalsar-reflex
git checkout -b feat/your-branch-name

# Run all zero-dependency unit tests
python -m unittest discover -s tests -v
```

## 3. Language & Global Award Guidelines

- **Primary Language (Universal Event):** Keep `index.html`, `README.md`, `demo/slides.html`, and all NASA submission fields strictly in **English**.
- **Supplementary Turkish Deck:** `demo/slides_tr.html` and `docs/OrbitalSAR_Reflex_Demo_Slides_TR.pdf` are maintained alongside the primary English deck for local outreach and team review.
- **No Secrets in Git:** Never commit `.env` files, API tokens, or Meteomatics credentials (covered by `.gitignore`).
- **Super Intelligence (SI) Transparency:** Any new AI/SI-generated image or video added to the project must carry a visible `"SI-GENERATED"` watermark and must not include NASA logos or emblems.
