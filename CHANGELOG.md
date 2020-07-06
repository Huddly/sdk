#### 0.5.1 (2020-07-06)

##### New Features

* **boxfish, huddlygo:**  added current and usb to diagnostics info ([879aefcd](https://github.com/Huddly/sdk/commit/879aefcde3f0abcb9b58cead68d1b1dfba0fe1f4))


#### 0.5.0 (2020-05-25)

##### New Features

* **Dwarffish support:**  added support for dwarffish 0x51 ([f9f6047](https://github.com/Huddly/sdk/commit/f9f6047dae17def6274530bd9deffa4475cd436b))
* **Clownfish support:**  added support for clownfish  ([c9d25f0](https://github.com/Huddly/sdk/commit/c9d25f0049a422f09e1a0dfab94ad35f32f0026c))

#### 0.4.2 (2020-04-16)

##### Chores

* **deps:**
  *  [security] bump acorn from 6.4.0 to 6.4.1 ([d7ca906b](https://github.com/Huddly/sdk/commit/d7ca906bb5c2bcc3424037cead0af8398e2f2ebc))
  *  bump acorn from 6.3.0 to 6.4.1 in /examples/rest ([bf912538](https://github.com/Huddly/sdk/commit/bf9125382ebab30211204c071ff2312360ac1ef7))
  *  bump semver from 6.3.0 to 7.3.2 ([071b640d](https://github.com/Huddly/sdk/commit/071b640d8f0ac1228d84002ff2bb1bf312c0929f))
* **deps-dev:**
  *  bump cz-conventional-changelog from 2.1.0 to 3.1.0 ([ed4add1e](https://github.com/Huddly/sdk/commit/ed4add1e1e33aa6a3f3d7478506a391c7f8ad462))
  *  bump mocha from 6.2.2 to 7.1.1 ([cd0dd086](https://github.com/Huddly/sdk/commit/cd0dd086dcfa95907818ebd71eb7a7f541616b51))
  *  bump sinon-chai from 3.3.0 to 3.5.0 ([4eda43dc](https://github.com/Huddly/sdk/commit/4eda43dc27e7c7c5b8ee488112ebaa85d42a11fd))
  *  bump eslint-plugin-react from 7.17.0 to 7.19.0 ([04cd5e28](https://github.com/Huddly/sdk/commit/04cd5e2815f102c72e4cdd28960284ccdc40fc9f))
  *  bump nyc from 14.1.1 to 15.0.1 ([1b42ffd7](https://github.com/Huddly/sdk/commit/1b42ffd78c5524fd78cf3efa423e522ae90966f5))
  *  bump nock from 11.7.0 to 12.0.3 ([ba855323](https://github.com/Huddly/sdk/commit/ba8553233595c1370746e9a8d4c332ca2ac962d4))
  *  bump eslint-plugin-import from 2.19.1 to 2.20.2 ([e854dab1](https://github.com/Huddly/sdk/commit/e854dab189fa0c5ffa487384d8734917b17cf59e))
  *  bump ts-node from 8.5.4 to 8.8.2 ([d47f7595](https://github.com/Huddly/sdk/commit/d47f75950f74c4a5859987f7e82c68a6e2835c7b))
* **examples:**  Update dependencies to latest releases ([a5cfbe4f](https://github.com/Huddly/sdk/commit/a5cfbe4f7cc7f38aeba8f3c9a72a2d866f9fcb52))
* **Node:**  Support for Node 12 LTS ([fa0600b9](https://github.com/Huddly/sdk/commit/fa0600b99d5b6f33c6cdda346cab2929be35e1c5))
* **package.json:**  Update dependencies and devDependencies of sdk ([8e07e8f0](https://github.com/Huddly/sdk/commit/8e07e8f0c07df7e7b0b6443b113183f7fa62d44f))

##### Documentation Changes

*  Added documentation for the detector ([#237](https://github.com/Huddly/sdk/pull/237)) ([de0bea1d](https://github.com/Huddly/sdk/commit/de0bea1d3142e9f0befa90162a5690eb6bc3fd54))
* **Contribution:**  Added description for release process ([7a7399fe](https://github.com/Huddly/sdk/commit/7a7399fef9be93672580a6326b063840a749d4af))
* **CONTRIBUTING.md:**  Bumped version of compodoc ([e6ca4ffb](https://github.com/Huddly/sdk/commit/e6ca4ffbfdf548330846460917c0131a6033d312))

##### New Features

* **Dartfish support:**  Added correct dartfish device class ([02ad6696](https://github.com/Huddly/sdk/commit/02ad6696cc233a64f1218794dcfe99fb8da0c259))
*  Injectable device factory so you can create custom or extend iDeviceManager clasess ([41176b91](https://github.com/Huddly/sdk/commit/41176b91de803b745bc1162694cf9a8934b97fc1))
* **getErrorLog:**  Add option for disallowing legacy mode. ([12f730cd](https://github.com/Huddly/sdk/commit/12f730cd153d930f208fba85a48e52a8ed397ceb))
* **detector:**  Detector should not be dependent on autozoom with newer camera software ([715a5e43](https://github.com/Huddly/sdk/commit/715a5e43176dd61d9a7a9d35649b6157733acd20))
* **Added options how long to search for device:**  Option for setting # of times looking for device ([056c533f](https://github.com/Huddly/sdk/commit/056c533faac96f8b7c39c7607a0ac99be210a1ae))
* **Added support for dartfish PID in factory.ts:**  Added support for dartfish PID ([e6c03775](https://github.com/Huddly/sdk/commit/e6c037755cee8d47b5f0f1dbd8e68ca46aa5e856))
* **Examples:**  Added an example where a specific camera is targeted ([1c88a341](https://github.com/Huddly/sdk/commit/1c88a34137e7b84da248281d8f2c2eb2e363d81f))

##### Bug Fixes

* **api.ts:**  getErrorLog recursive call with exact parameters ([09f6d3ad](https://github.com/Huddly/sdk/commit/09f6d3ad7fd0a359def1b95d079f5fe15b8ea92f))
* **getErrorLog:**
  *  Throw exception with error from camera on failure. ([d364036d](https://github.com/Huddly/sdk/commit/d364036d3dd608a58cfe817160037b2155098dd4))
  *  Don't fall so quickly back to legacy method. Retry once. ([c90c3759](https://github.com/Huddly/sdk/commit/c90c3759dc02c6f606122fcadb59c8a8992c00b7))
* **examples:**  Update sdk examples to use latest sdk version (0.4.0) ([3b462f73](https://github.com/Huddly/sdk/commit/3b462f73cdd51032b69619c99fc42625c677c8b0))

##### Other Changes

*  add support for PID=0x51 ([5642a2e2](https://github.com/Huddly/sdk/commit/5642a2e2610087cd427cc1f0cbee00278df29cf7))

#### 0.4.1 (2019-11-27)

##### Documentation Changes

*  Added documentation for the detector ([#237](https://github.com/Huddly/sdk/pull/237)) ([de0bea1d](https://github.com/Huddly/sdk/commit/de0bea1d3142e9f0befa90162a5690eb6bc3fd54))
* **Contribution:**  Added description for release process ([7a7399fe](https://github.com/Huddly/sdk/commit/7a7399fef9be93672580a6326b063840a749d4af))
* **CONTRIBUTING.md:**  Bumped version of compodoc ([e6ca4ffb](https://github.com/Huddly/sdk/commit/e6ca4ffbfdf548330846460917c0131a6033d312))

##### New Features
* **Examples:**  Added an example where a specific camera is targeted ([1c88a341](https://github.com/Huddly/sdk/commit/1c88a34137e7b84da248281d8f2c2eb2e363d81f))

##### Bug Fixes

* **examples:**  Update sdk examples to use latest sdk version (0.4.0) ([3b462f73](https://github.com/Huddly/sdk/commit/3b462f73cdd51032b69619c99fc42625c677c8b0))

### 0.4.0 (2019-10-14)

##### Chores

* **Changelog:**
  *  Creating package.json scripts that generate changelog ([098d3349](https://github.com/Huddly/sdk/commit/098d334982402bdfde09775ba8f505a5e2ffcd8c))
* **Dependencies:**  Updated project dependencies ([bed7abd2](https://github.com/Huddly/sdk/commit/bed7abd2245e778433a58cc02e4df703aa7ce1f8))
* **package.json:**  Update and audit dependencies ([7f1973eb](https://github.com/Huddly/sdk/commit/7f1973ebff3119acb95a21d6c227a32db482f8a8))

##### Documentation Changes

* **CONTRIBUTING.md:**
  * Proper guidelins on making comitizen formated commits ([14e7d4c5](https://github.com/Huddly/sdk/commit/14e7d4c5196b5bf1ce37565ab17d722eba921a1f))
  * Compodoc documentation generating how to guide ([8e96ad24](https://github.com/Huddly/sdk/commit/8e96ad2427a5591006f1c6a00b75fdb1d9f5841b))

##### New Features

* **Autozoom/Detector:**  Add setter method for options class attribute ([a58dfeee](https://github.com/Huddly/sdk/commit/a58dfeee6ea38b31013f39283f99c0306a20b234))
* **DeviceManager:**
  *  Get url for latest released firmware for huddly device ([f3c1c63f](https://github.com/Huddly/sdk/commit/f3c1c63f55522c0675d6d54e02ff87d6f4bad71f))
* **Detector:**
  *  Detections on preview stream is default behavior ([3989f25b](https://github.com/Huddly/sdk/commit/3989f25bda35497b4b6092fd368378c7367ade03))
  *  Refactoring Detector in AutozoomCtl and Detector classes ([303e5a66](https://github.com/Huddly/sdk/commit/303e5a66f3d50b4e9f778e3e1e1400ab9ff2e477))
  *  Detections without streaming support ([158e0ba0](https://github.com/Huddly/sdk/commit/158e0ba097f6d6896fa43e8a911ba8643185c404))
* **error log:**  Implement error log reading without file transfer ([35733b93](https://github.com/Huddly/sdk/commit/35733b93f0af49e98a562b3896ce05764480df1f))
* **boxfish.ts:**  Added FSBL upgrade to boxfish ([efd0459e](https://github.com/Huddly/sdk/commit/efd0459efb01c807478e8b9ae9b0df1596583540))

##### Bug Fixes

* **AutozoomControl:** Enable/Disable needs to query product info ([8d335e93](https://github.com/Huddly/sdk/commit/8d335e93b0e9b663d2fbb3fa3606afc9d24d1747))

##### Refactors

* **Factory.ts:**  Remove confusing warning logs on factory class ([b76d74a3](https://github.com/Huddly/sdk/commit/b76d74a3c854e6a3526150fe995f2b5383a8e4f7))
* **AutozoomControl:**
  *  Rename AutozoomCtl to AutozoomControl ([dc48a706](https://github.com/Huddly/sdk/commit/dc48a7060e91fc34d269b2b54eb7f26c398bfb0f))
