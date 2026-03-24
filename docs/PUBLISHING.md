# Publishing Guide

## Pre-Release Checklist

- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] `docs/CHANGELOG.md` updated with new version section
- [ ] No uncommitted changes (`git status`)
- [ ] On `main` branch with latest changes pulled
- [ ] No `.env` files or secrets in tracked files

---

## Option A: Automated Release

The `prepare-release.js` script handles everything in one command:

```bash
node scripts/prepare-release.js patch   # 2.0.0 -> 2.0.1
node scripts/prepare-release.js minor   # 2.0.0 -> 2.1.0
node scripts/prepare-release.js major   # 2.0.0 -> 3.0.0
node scripts/prepare-release.js 2.1.0   # explicit version
```

This script will:
1. Validate `package.json` fields
2. Check git working directory is clean
3. Run all test suites
4. Bump version in `package.json` and `bin/cli.js`
5. Generate `RELEASE_NOTES.md` from `docs/CHANGELOG.md`
6. Create a git commit and annotated tag

After it completes:

```bash
git push && git push --tags
npm publish
```

## Option B: Manual Release

### 1. Bump Version

```bash
node scripts/version-bump.js patch
```

Or manually edit `package.json` and `bin/cli.js`, then:

```bash
git add package.json bin/cli.js
git commit -m "chore: bump version to 2.0.1"
git tag -a v2.0.1 -m "v2.0.1"
```

### 2. Push

```bash
git push
git push --tags
```

### 3. Create GitHub Release

1. Go to https://github.com/askelira/askelira/releases/new
2. Select the tag you just pushed (e.g. `v2.0.1`)
3. Title: `v2.0.1`
4. Body: paste from `RELEASE_NOTES.md` or the relevant `docs/CHANGELOG.md` section
5. Click "Publish release"

This triggers the `publish.yml` workflow automatically.

### 4. Publish to npm

If not using the CI workflow, publish manually:

```bash
npm login
npm publish --access public
```

Verify:

```bash
npm info askelira version
```

---

## Electron Builds

### Local Build

```bash
# macOS
npm run electron:build

# Windows (from Windows or with Wine)
npm run electron:build -- --win

# Linux
npm run electron:build -- --linux

# All platforms
npm run electron:build -- --mac --win --linux
```

Output goes to `dist/`:
- `AskElira-x.y.z.dmg` (macOS)
- `AskElira-Setup-x.y.z.exe` (Windows)
- `AskElira-x.y.z.AppImage` (Linux)

### CI Build

Creating a GitHub release triggers `.github/workflows/publish.yml`, which builds for all three platforms and uploads artifacts to the release.

### Code Signing

For signed builds, set these repository secrets:

| Secret | Description |
|--------|-------------|
| `CSC_LINK` | Base64-encoded code signing certificate |
| `CSC_KEY_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple ID for notarization (macOS) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password for notarization |

---

## Docker Deployment

### Build and Run

```bash
docker build -t askelira .
docker run -p 3000:3000 -p 5678:5678 --env-file .env askelira
```

### Docker Compose

```bash
docker compose up -d
```

Check health:

```bash
docker compose ps
```

### Push to Registry

```bash
docker tag askelira askelira/askelira:2.0.1
docker tag askelira askelira/askelira:latest
docker push askelira/askelira:2.0.1
docker push askelira/askelira:latest
```

---

## npm Publishing Secrets

Set `NPM_TOKEN` as a GitHub repository secret for CI publishing:

1. Generate a token: https://www.npmjs.com/settings/tokens
2. Select "Automation" token type
3. Go to repo Settings > Secrets and variables > Actions
4. Add `NPM_TOKEN` with the token value

---

## Post-Publish Verification

After publishing, verify everything works:

```bash
# Check npm
npm info askelira version

# Test global install
npm install -g askelira
askelira --version

# Test CLI
askelira templates

# Check Docker
docker run --rm askelira askelira --version
```

---

## Troubleshooting

### `npm publish` fails with 403

- Check you're logged in: `npm whoami`
- Check package name isn't taken: `npm info askelira`
- Ensure `publishConfig.access` is `"public"` in `package.json`

### `npm publish` fails with 402

- Scoped packages require a paid account for private publishing
- Set `"access": "public"` in `publishConfig`

### Git tag already exists

```bash
# Delete local tag
git tag -d v2.0.1

# Delete remote tag
git push origin :refs/tags/v2.0.1
```

Then re-run the release script.

### Electron build fails on CI

- macOS builds require `macos-latest` runner
- Windows builds may need `windows-latest` with appropriate certificates
- Linux builds need `ubuntu-latest`
- Check that `electron` and `electron-builder` are in `devDependencies`

### Docker build fails

- Ensure `.dockerignore` excludes `node_modules`
- Check that all `COPY` paths exist in the build context
- Alpine images may need additional packages for native modules:
  ```dockerfile
  RUN apk add --no-cache python3 make g++
  ```

### Version mismatch after publish

If `package.json` and `bin/cli.js` have different versions:

```bash
node scripts/version-bump.js patch
```

This updates both files atomically.

### Release notes empty

Ensure `docs/CHANGELOG.md` has a section matching the version:

```markdown
## [2.0.1] — 2026-03-20

### Fixed
- Description of fix
```

The `prepare-release.js` script extracts the section matching the new version number.
