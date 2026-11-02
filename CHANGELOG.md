# [0.4.0](https://github.com/labcabrera/rmu-api-attack-tables/compare/0.3.1...0.4.0) (2026-11-02)


* feat!: rewrite the API in NestJS on the rmu-api-core template (spec 035) ([559aaee](https://github.com/labcabrera/rmu-api-attack-tables/commit/559aaee29bdaa130d1284e019a34669caedbe97c))
* feat!: serve only the Medium attack tables, without size (spec 033) ([7ce4611](https://github.com/labcabrera/rmu-api-attack-tables/commit/7ce46110887897557ddd162b6e5c003ae533393e))


### Bug Fixes

* list the elemental balls and cones fumble table by its file name (spec 030) ([5fa3d10](https://github.com/labcabrera/rmu-api-attack-tables/commit/5fa3d10c26cf8bcc4654a4f15b1896928fdb8140))
* validate requests without implicit conversion (spec 044) ([12e8d87](https://github.com/labcabrera/rmu-api-attack-tables/commit/12e8d875dae147b7710792ea9ce6b0a5fa38a18c))


### Features

* bundle every Core Law critical and fumble table (spec 034) ([b4eaa01](https://github.com/labcabrera/rmu-api-attack-tables/commit/b4eaa011b40635bcbc6d95947b0635f13c312e2c))
* configurable tables directory and injury data passthrough (spec 013) ([e142deb](https://github.com/labcabrera/rmu-api-attack-tables/commit/e142deb863b64cffdfd75b82f4a50bc13ab4ba38))
* effects the book only gives in the text (spec 034, phase 4) ([bef7227](https://github.com/labcabrera/rmu-api-attack-tables/commit/bef7227b8a1e0744e69c6a4f54a5389921936ccb))
* get /v1/info with the name and version of the api ([e277f50](https://github.com/labcabrera/rmu-api-attack-tables/commit/e277f5065615d9500b0f85a7245405033a92baed))
* spell casting modifiers and spell failure tables (spec 030) ([1fd7c56](https://github.com/labcabrera/rmu-api-attack-tables/commit/1fd7c5642cb359f02ca4a15faafb435b7d4a0cb7))


### BREAKING CHANGES

* every endpoint but /v1/health needs a bearer token, errors follow the
common {statusCode, error, code, message, timestamp, path} format, integer parameters
are strict and the root / is gone.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
* the {size} path segment is removed; callers apply the
attack size to the Medium result.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
