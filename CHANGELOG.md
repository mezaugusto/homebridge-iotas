# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.4](https://github.com/mezaugusto/homebridge-iotas/compare/v3.0.3...v3.0.4) (2026-04-07)


### Bug Fixes

* feature update incorrect response handling ([#12](https://github.com/mezaugusto/homebridge-iotas/issues/12)) ([1ec546c](https://github.com/mezaugusto/homebridge-iotas/commit/1ec546c66c1f4fc7c12eabe6c793c1fc50e515f9))

## [3.0.3](https://github.com/mezaugusto/homebridge-iotas/compare/v3.0.2...v3.0.3) (2026-04-07)


### Bug Fixes

* Jasco dimmer not turning off reliably ([#10](https://github.com/mezaugusto/homebridge-iotas/issues/10)) ([5903982](https://github.com/mezaugusto/homebridge-iotas/commit/5903982c63da5be0bfbb09b09e2beededad94313))

## [3.0.2](https://github.com/mezaugusto/homebridge-iotas/compare/v3.0.1...v3.0.2) (2026-04-06)


### Bug Fixes

* consolidate release and publish into single workflow ([#7](https://github.com/mezaugusto/homebridge-iotas/issues/7)) ([578fdd3](https://github.com/mezaugusto/homebridge-iotas/commit/578fdd39fb9613d36632f464e1879cd80a7bebe0))

## [3.0.2](https://github.com/mezaugusto/homebridge-iotas/compare/v3.0.1...v3.0.2) (2026-04-06)


### Bug Fixes

* consolidate release and publish into single workflow ([#7](https://github.com/mezaugusto/homebridge-iotas/issues/7)) ([578fdd3](https://github.com/mezaugusto/homebridge-iotas/commit/578fdd39fb9613d36632f464e1879cd80a7bebe0))

## [3.0.1](https://github.com/mezaugusto/homebridge-iotas/compare/v3.0.0...v3.0.1) (2026-04-06)


### Bug Fixes

* homekit serial number warnings ([#3](https://github.com/mezaugusto/homebridge-iotas/issues/3)) ([afc30f0](https://github.com/mezaugusto/homebridge-iotas/commit/afc30f009129f2c24009ac3337cea1abf0f7e6e0))

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
