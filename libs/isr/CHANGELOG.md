# Changelog

This file was generated using [@jscutlery/semver](https://github.com/jscutlery/semver).

## [18.0.3](https://github.com/rx-angular/rx-angular/compare/isr@18.0.2...isr@18.0.3) (2024-08-23)


### Bug Fixes

* **isr:** filter urlsOnHold by cacheKey instead of url ([bca4374](https://github.com/rx-angular/rx-angular/commit/bca4374d19dc7c26a57cc431ffc1644ec9a54830))
* **isr:** handle response sent in render ([a553e5b](https://github.com/rx-angular/rx-angular/commit/a553e5bd1dd552f1a4193b35ae418da9eda5d90f))



## [18.0.2](https://github.com/rx-angular/rx-angular/compare/isr@18.0.1...isr@18.0.2) (2024-07-11)


### Bug Fixes

* **isr:** fix import path ([2935422](https://github.com/rx-angular/rx-angular/commit/29354220cf6b0f1c758903288f9aa84c2bda2a2e))
* **isr:** refactor regeneration function ([622964e](https://github.com/rx-angular/rx-angular/commit/622964ecf5ac3f747b3de7999b65bd6bccc24942))



## [18.0.1](https://github.com/rx-angular/rx-angular/compare/isr@18.0.0...isr@18.0.1) (2024-06-06)


### Bug Fixes

* **isr:** invalidation issue with url ([4622995](https://github.com/rx-angular/rx-angular/commit/4622995fd1eadd0940b6578de370d9c8a92a3b75))



# [18.0.0](https://github.com/rx-angular/rx-angular/compare/isr@17.1.0...isr@18.0.0) (2024-05-31)


### Features

* **isr:** add `inlineCriticalCss` support ([001b507](https://github.com/rx-angular/rx-angular/commit/001b507f5a2463698312afcad87fa612735e6825))
* upgrade to ng 18 ([#1730](https://github.com/rx-angular/rx-angular/issues/1730)) ([c2b2873](https://github.com/rx-angular/rx-angular/commit/c2b2873f9f1a5bdf06a751226f65ea9149afadcf))


### BREAKING CHANGES

* bump peerDependency to @angular/core to ^18.0.0

* feat: upgrade to ng 18

* chore: add missing @angular/build dev dependency

* chore: update CI to node 20



# [17.1.0](https://github.com/rx-angular/rx-angular/compare/isr@17.0.0...isr@17.1.0) (2024-02-05)


### Features

* add ssr-isr app for testing ([7857591](https://github.com/rx-angular/rx-angular/commit/7857591719c3237cf8988ca1bdf3356d86594230))
* update isr to be used with application builder ([bf36e07](https://github.com/rx-angular/rx-angular/commit/bf36e0707d409e9331cc44f5545854e81cd441af))



# [17.0.0](https://github.com/rx-angular/rx-angular/compare/isr@16.0.0...isr@17.0.0) (2023-11-17)


### Features

* bump Angular to v17 ([a814fb6](https://github.com/rx-angular/rx-angular/commit/a814fb66d396410e695e47a72e499a6d1cca213a))
* **isr:** add the possibility to create the cache in several variants ([#1608](https://github.com/rx-angular/rx-angular/issues/1608)) ([084f4fa](https://github.com/rx-angular/rx-angular/commit/084f4fa1f503054d9efb714b980f08f55530b09b))


### BREAKING CHANGES

* Minimum required `@angular/core` version is now `^17.0.0`
