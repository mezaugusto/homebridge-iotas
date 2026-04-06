# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-04-06

### Fixed

- Fixed HomeKit rejecting accessories when device serial number, manufacturer, or model are empty strings (now falls back to sensible defaults)

## [3.0.0] - 2026-04-05

### Added

- Full rewrite using modern Homebridge v2 architecture
- Plugin Settings GUI support via `config.schema.json`
- Proper TypeScript ESM module structure
- Unit tests using Node.js native test runner
- Support for Homebridge v2.0 beta

### Changed

- **BREAKING**: Plugin renamed to `homebridge-iotas-v2` - update your config
- **BREAKING**: Platform name changed to `homebridge-iotas-v2`
- Migrated from CommonJS to ESM modules
- Replaced axios with native `fetch` API
- Replaced callback-based handlers with async `onGet`/`onSet`
- Updated minimum Node.js requirement to v20.18.0+
- Updated minimum Homebridge requirement to v1.8.0+
- Improved code organization with separate files for platform, accessories, and API client

### Removed

- Removed axios dependency
- Removed nodemon, ts-node, rimraf dev dependencies
- Removed vitest in favor of Node.js native test runner

### Fixed

- Door locks no longer incorrectly appear as thermostats
- Improved error handling for API failures
- Better token refresh handling

## [2.x and earlier]

Previous versions were maintained under different repositories:

- [stevesample/homebridge-iotas-switch](https://github.com/stevesample/homebridge-iotas-switch)
- [kpsuperplane/homebridge-iotas](https://github.com/kpsuperplane/homebridge-iotas)
