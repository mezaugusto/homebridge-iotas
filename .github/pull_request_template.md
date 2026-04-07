## Description

<!-- Briefly describe what this PR does -->

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with [release-please](https://github.com/googleapis/release-please-action) for automated releases. Commit messages determine what's included in release PRs:

| Prefix      | When to use                       |
| ----------- | --------------------------------- |
| `fix:`      | Bug fixes                         |
| `feat:`     | New features                      |
| `feat!:`    | Breaking changes                  |
| `docs:`     | Documentation only                |
| `chore:`    | Maintenance (deps, CI, etc.)      |
| `refactor:` | Code changes without new features |

**Examples:**

- `fix: handle empty serial numbers in accessory info`
- `feat: add support for humidity sensors`
- `feat!: drop Node.js 18 support`
- `docs: update README installation steps`

## Checklist

- [ ] Code builds without errors (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
