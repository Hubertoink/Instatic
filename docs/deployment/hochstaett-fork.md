# Hochstaett deployment fork

This fork preserves the locally tested CMS customizations used by the Hochstaett site.

- Fork: https://github.com/Hubertoink/Instatic
- Upstream: https://github.com/CoreBunch/Instatic
- Initial integration branch: `feat/hochstaett-deployment-baseline`
- Upstream base: `f92e8dc1` (0.0.20)

## Source and runtime data

Git contains application code, tests and documentation. Website content lives in
the CMS database and uploads volume. Database files, uploaded media, backups,
environment files and secret keys are not deployment source and must be
transferred separately through a private backup/restore process.

The integration branch includes relation/repeater loops, preview improvements,
publication-date handling, animation presets, and content image sizing,
lightbox and link insertion. Review these local changes through the fork's draft
pull request before merging; the integration branch is not a production release.

## Git remotes

`origin` points to this fork; `upstream` points to CoreBunch. Feature branches
and pull requests belong to the fork unless a contribution to CoreBunch is
explicitly intended.

```sh
git clone https://github.com/Hubertoink/Instatic.git
cd Instatic
git remote add upstream https://github.com/CoreBunch/Instatic.git
git switch --track origin/feat/hochstaett-deployment-baseline
```

Fetch upstream updates and integrate them on a separate review branch. Do not
reset the fork to upstream when preserving these customizations.

## Container handoff

Build the image from the reviewed fork commit:

```sh
docker build -t instatic-hochstaett:staging .
```

The fork image workflow, `.github/workflows/fork-image.yml`, builds Linux amd64
images on pushes to `main` and `chore/mittwald-staging`, and supports manual
dispatch after merging. Images are tagged
`ghcr.io/hubertoink/instatic:staging-<full-commit-sha>`. The Docker build runs
TypeScript checking and the production frontend build. It does not run tests
or lint; those remain separate verification steps.

The upstream release workflow still targets `ghcr.io/corebunch/instatic`;
do not create release tags to publish fork images. The fork workflow only
publishes images and does not change a running Mittwald container.

Mittwald needs an image available in a registry, persistent storage, HTTPS
routing and the application environment described in [docker-image.md](docker-image.md).
For a copy of the existing SQLite installation, preserve the data and uploads
volumes and its secret encryption key using [backup-restore.md](backup-restore.md).

Publishing inside a local CMS instance does not deploy that instance to Mittwald.
An online staging instance publishes to its own staging site.

## Mittwald staging

The staging installation runs in project `p-tud9mw` at
`https://test.dashbohub.de`; the editor is at `/admin`. Its dedicated service is
`instatic-test` (`c-h9a83c`, service ID
`301cf0cd-d9bf-47a5-9a8d-6f8ef81a66a8`). It uses these persistent volumes:

| Volume | Mount | Contents |
| --- | --- | --- |
| `instatic-test-data` | `/app/data` | SQLite database |
| `instatic-test-uploads` | `/app/uploads` | Media, fonts, plugins and published HTML |

Runtime configuration:

```dotenv
NODE_ENV=production
PORT=3001
DATABASE_URL=sqlite:/app/data/cms.db
UPLOADS_DIR=/app/uploads
STATIC_DIR=/app/dist
PUBLIC_ORIGIN=https://test.dashbohub.de
INSTATIC_SECRET_KEY=<private stable base64 32-byte key>
```

The container has a 1 GiB memory limit and a 1 CPU limit. The domain's root
maps to container port `3001/tcp`. Preserve both volumes and the secret key on
every update; back them up using [backup-restore.md](backup-restore.md).
Initial installation uses a new owner account and an empty site, not a copy of
local development databases. Transfer existing content through the CMS site
export/import when needed.

Deploy an image by its `staging-<full-commit-sha>` tag or registry digest. Do not
replace the project stack wholesale: other Dashbo services share the project.
Update only `instatic-test`, keep its environment and volume mounts, then check
`/health`, admin login, editing and publishing. The domain virtual-host ID is
`ef7b199c-91b6-4f8e-8130-f44fa5ee208a`.

The Mittwald CLI 1.23 container exec command hardcodes `/usr/bin/ssh`, which
fails on Windows. Native OpenSSH works with the same connection:

```sh
ssh -i ~/.ssh/mstudio-cli -l '<mStudio-email>@c-h9a83c' ssh.isenstedt.project.host
```

For private first-run setup, forward a local port over that SSH connection and
send the setup request with `Origin: https://test.dashbohub.de` before mapping
the public domain. Never commit credentials or the runtime environment file.

## Validation at initial handoff

The production Docker build (TypeScript and Vite), ESLint, targeted content tests,
and desktop/mobile lightbox checks passed locally. The full Windows test run
was not green; unrelated architecture, platform and UI failures remain for
review. Consult the draft pull request for the handoff results.
