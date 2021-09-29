#### 0.6.2 (2021-09-29)

##### Chores

*  update @huddly/camera-switch-proto@0.0.4 ([d8ec9435](https://github.com/Huddly/sdk/commit/d8ec94353ac9e0cd10372f3e40cb2858c037158d))
* **package-lock.json:**  fix critical audit dependencies ([d17a3c5d](https://github.com/Huddly/sdk/commit/d17a3c5d4b4022995e8c4d5848363d5f27345a0a))
* **deps:**
  *  bump tmpl from 1.0.4 to 1.0.5 in /examples/rest ([0136759c](https://github.com/Huddly/sdk/commit/0136759c21a8f036e7929459613149239a9a28b4))
  *  bump tar from 6.1.8 to 6.1.11 ([3602830d](https://github.com/Huddly/sdk/commit/3602830d7f6772db3dfb8ef7e3444a5cd91c68af))

##### Documentation Changes

*  Canvas documentation and sdk usage example ([59d6c320](https://github.com/Huddly/sdk/commit/59d6c320d2772585b28fe281605ad98e052d6689))

##### New Features

* **canvas:**  Enable/Disable enhance mode ([9383fdc0](https://github.com/Huddly/sdk/commit/9383fdc006b4b8624443c311abe0a71e39bf4f67))
*  factory supports dartfish/canvas ([e0fbddaa](https://github.com/Huddly/sdk/commit/e0fbddaadfd29adcbef5b656eaf80f1a2c3b2bcf))

##### Bug Fixes

* **IpAutozoomControl:**  Add start,stop methods ([5ffb8a6a](https://github.com/Huddly/sdk/commit/5ffb8a6a1b771de47da58187e321d625231b42f2))
*  update product names, pid and vid info ([d3216468](https://github.com/Huddly/sdk/commit/d3216468d3573c268fee228a060a94556f056266))

##### Other Changes

*  Grpc PTZ object from amera should not be used directly ([722095b6](https://github.com/Huddly/sdk/commit/722095b669f256381d92e14dac6bf5e27d0ba357))

##### Refactors

*  remove IAutozoomControl (use ICnnControl) ([7fb68634](https://github.com/Huddly/sdk/commit/7fb68634b774b4f9f101316d3c96c9ca23f88ff0))
*  ONE & Canvas update supported features ([0c012247](https://github.com/Huddly/sdk/commit/0c0122476fc115c4c1e3b46155d48bcab469bdfc))

##### Tests

* **factory.ts:**  add test for ACE device ([f070190b](https://github.com/Huddly/sdk/commit/f070190bab7bf2a8817ce00ea13f4ea1a23e2d2c))

#### 0.6.1 (2021-08-23)

##### Documentation Changes

* **Readme:**  Remove broken dependency badges ([ac6400ea](https://github.com/Huddly/sdk/commit/ac6400ea8f576dd4dec549ce76fe4b1eafba1ab2))

##### New Features

*  Export BASE product id on factory.ts ([506e6b40](https://github.com/Huddly/sdk/commit/506e6b40a210eb9b8eb961609aa707f4acc9ee27))
*  Export huddly vendor id on factory.ts ([31b5e614](https://github.com/Huddly/sdk/commit/31b5e6143bb8c1243d713f5b6c7b9440f91d9dd0))

##### Bug Fixes

*  Update L1 pid from 3E9 to 0x3E9 ([c5c6ffeb](https://github.com/Huddly/sdk/commit/c5c6ffeb6d241efb4527c3cc1eca8827fd122ab7))
*  webpack bundle with new grpc dependencies ([262751f4](https://github.com/Huddly/sdk/commit/262751f4d1436a9e7ea74eeb6fafba8ac11d131e))

##### Other Changes

*  Avoid discovery hang for BASE ([66d4230e](https://github.com/Huddly/sdk/commit/66d4230e6f362c497c5514e4aab16b6a9ef201cc))

### 0.6.0 (2021-08-16)

##### Chores

*  bump version for camera-proto and camera-switch-proto ([5915df1d](https://github.com/Huddly/sdk/commit/5915df1d09e2f5aeee054761c6dac02ec9c8c53e))
*  fix audit issues ([75bc4672](https://github.com/Huddly/sdk/commit/75bc467261f1b665f61f9a58a542ce639e831ade))
*  cleanup of tests for ace device ([3e62fadf](https://github.com/Huddly/sdk/commit/3e62fadff725f1e1981be4371906a8456d6b9211))
*  bump huddlyproto version to 0.0.3 ([0c1cef17](https://github.com/Huddly/sdk/commit/0c1cef1702e8714c2687571f220f93641cf05394))
*  update dependencies to latest wanted ([c4ee23e4](https://github.com/Huddly/sdk/commit/c4ee23e4658ae0db51831551536a800923b7c966))
*  upgrade package json & lock for lts 14 ([a3af1730](https://github.com/Huddly/sdk/commit/a3af1730bfb83bf13575b660b5f9cb3306ae4f4e))
*  Update dependencies for sdk and the example projects ([4b1b8a7e](https://github.com/Huddly/sdk/commit/4b1b8a7e0d97a8994be5f5a2f69fdede3578ef54))
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

##### Continuous Integration

*  build sdk for lts v14 on travis ([aaf2cccf](https://github.com/Huddly/sdk/commit/aaf2cccf0669fa5fb91acb0832e93c778f6c9e38))
*  dont build v8 on travis anymore ([b4d68974](https://github.com/Huddly/sdk/commit/b4d689740a21224e90456e87170171b56cdb4b00))

##### Documentation Changes

*  Describe/Add more options to IDeviceApiOpts ([b38192cc](https://github.com/Huddly/sdk/commit/b38192cc6785e14390bb3be665daa47ae0fb9b97))
*  Add jsdocs for the new service classes ([e9c9b368](https://github.com/Huddly/sdk/commit/e9c9b368a4be38c61c532e54dba656d699072106))
*  update l1 sdk usage example project ([e814ed01](https://github.com/Huddly/sdk/commit/e814ed01d7b2d97f2e40d0c589ab738f4b5b9bd5))
*  Add jsdocs for AceUpgrader ([b44734d8](https://github.com/Huddly/sdk/commit/b44734d8f217a8ecbe1cfef4e70ec692b36972d3))
*  Added documentation for the detector ([#237](https://github.com/Huddly/sdk/pull/237)) ([de0bea1d](https://github.com/Huddly/sdk/commit/de0bea1d3142e9f0befa90162a5690eb6bc3fd54))
* **Contribution:**  Added description for release process ([7a7399fe](https://github.com/Huddly/sdk/commit/7a7399fef9be93672580a6326b063840a749d4af))
* **CONTRIBUTING.md:**  Bumped version of compodoc ([e6ca4ffb](https://github.com/Huddly/sdk/commit/e6ca4ffbfdf548330846460917c0131a6033d312))

##### New Features

* **Ace:**
  *  Autozoom Control added ([0293627b](https://github.com/Huddly/sdk/commit/0293627bd35f07dc94e4f554471c968f8789a17e))
  *  Initial support for getState ([d678dc3c](https://github.com/Huddly/sdk/commit/d678dc3c4efc1e471c98ed92dd9bd7ae46da4e88))
  *  device info should be assign to the ace object ([276124f1](https://github.com/Huddly/sdk/commit/276124f1e70a93de1f1f2a3838a605dfac9525b4))
  *  Read and erase app log ([f1e3d930](https://github.com/Huddly/sdk/commit/f1e3d9303f146fae639c8bd5fcf9ad7cdefcee5d))
  *  Added interface for uvc-type commands ([d656b4ef](https://github.com/Huddly/sdk/commit/d656b4ef3876b8dc0dd0594381bf3f36b21420ad))
*  support upgrading ace by sending file buffer of cpio file ([c28b9eff](https://github.com/Huddly/sdk/commit/c28b9eff499d23e9199d4b96fe8fa83db6c115f4))
*  allow consumer to set custom logger ([986a72c0](https://github.com/Huddly/sdk/commit/986a72c0e36e4f3a6b913fbd920c8d74cf9d26ce))
*  Logger supports writing to file ([0024ba53](https://github.com/Huddly/sdk/commit/0024ba5338fff4bb9f5d4e34072d5b40a44d1747))
*  SDK support for Huddly Service (Win) ([3094336d](https://github.com/Huddly/sdk/commit/3094336de3af8e4c31dbf9921f6e6a1e4e0c8604))
*  add l1 windows service protofile ([b2375492](https://github.com/Huddly/sdk/commit/b2375492e639330b8544e705c1f21b000fdac0ef))
*  huddlyproto npm package ([ecdad1ab](https://github.com/Huddly/sdk/commit/ecdad1abbbb7e9b79ee5f02a749d3872f63d639f))
*  working fw upgrade for L1/Ace ([fdafc740](https://github.com/Huddly/sdk/commit/fdafc7406b52be3221ee62e778c8986e6af27880))
*  discovery supports multiple apis ([2f4a2e34](https://github.com/Huddly/sdk/commit/2f4a2e342e947b4ee90b6a237d585660a8bdc8e1))
*  build grpc proto files ([8bf2f3ac](https://github.com/Huddly/sdk/commit/8bf2f3ac85fd750aa027a0f8cece94f8109ed18f))
*  Ace discovery support and getInfo ([04fc25b4](https://github.com/Huddly/sdk/commit/04fc25b40547974b23642826a9d9b9674b602b2f))
*  Further abstraction on transport implementation ([dbecd489](https://github.com/Huddly/sdk/commit/dbecd4893526ff54af98a827ff7f65398ac4390a))
*  Injectable device factory so you can create custom or extend iDeviceManager clasess ([41176b91](https://github.com/Huddly/sdk/commit/41176b91de803b745bc1162694cf9a8934b97fc1))
* **facebasedexposurecontrol:**  sdk supports enable/disable face based exposure control ([6a461e0b](https://github.com/Huddly/sdk/commit/6a461e0b015bb9597de6534ed0d2b2c7a10ade9f))
* **package.json:**  add typescript watcher script ([2e329e8c](https://github.com/Huddly/sdk/commit/2e329e8c70f664e568d91a3afdc4b03971e7ea65))
* **boxfish, huddlygo:**  added current and usb to diagnostics info ([879aefcd](https://github.com/Huddly/sdk/commit/879aefcde3f0abcb9b58cead68d1b1dfba0fe1f4))
* **Dartfish support:**  Added correct dartfish device class ([02ad6696](https://github.com/Huddly/sdk/commit/02ad6696cc233a64f1218794dcfe99fb8da0c259))
* **getErrorLog:**  Add option for disallowing legacy mode. ([12f730cd](https://github.com/Huddly/sdk/commit/12f730cd153d930f208fba85a48e52a8ed397ceb))
* **detector:**  Detector should not be dependent on autozoom with newer camera software ([715a5e43](https://github.com/Huddly/sdk/commit/715a5e43176dd61d9a7a9d35649b6157733acd20))
* **Added options how long to search for device:**  Option for setting # of times looking for device ([056c533f](https://github.com/Huddly/sdk/commit/056c533faac96f8b7c39c7607a0ac99be210a1ae))
* **Added support for dartfish PID in factory.ts:**  Added support for dartfish PID ([e6c03775](https://github.com/Huddly/sdk/commit/e6c037755cee8d47b5f0f1dbd8e68ca46aa5e856))
* **Examples:**  Added an example where a specific camera is targeted ([1c88a341](https://github.com/Huddly/sdk/commit/1c88a34137e7b84da248281d8f2c2eb2e363d81f))

##### Bug Fixes

* **ace.ts:**  updated proto dep/files to match dependecies ([c4c95db2](https://github.com/Huddly/sdk/commit/c4c95db26ea7f89185248bbff2544be759723c37))
*  Suport npm link by adding dev mode on sdk ([6deb38c1](https://github.com/Huddly/sdk/commit/6deb38c1cdd1f6f49722ef20acfad8f74698076d))
*  remove the Empty() and Chunk() workarounds ([2647e67c](https://github.com/Huddly/sdk/commit/2647e67c77f8301cce27849ce00d0647590f0d88))
*  generated proto files in correct lib path ([aedd7850](https://github.com/Huddly/sdk/commit/aedd7850e36abff33e0751577d60aa62b0292aaf))
*  empty resolve requires void promise ([2b4554f3](https://github.com/Huddly/sdk/commit/2b4554f3b0ec5ec015fb1ddd1ebbfbe13eb50b22))
* **prettier:**  ignore prettifying generated proto ([a9d83f29](https://github.com/Huddly/sdk/commit/a9d83f29c204e75658f284300cf2a3b7b65bd42f))
* **update package deps:**  update deps ([d968befc](https://github.com/Huddly/sdk/commit/d968befc3edec5a6f53d3a0d36ec3ab821b698d5))
* **api.ts:**  getErrorLog recursive call with exact parameters ([09f6d3ad](https://github.com/Huddly/sdk/commit/09f6d3ad7fd0a359def1b95d079f5fe15b8ea92f))
* **getErrorLog:**
  *  Throw exception with error from camera on failure. ([d364036d](https://github.com/Huddly/sdk/commit/d364036d3dd608a58cfe817160037b2155098dd4))
  *  Don't fall so quickly back to legacy method. Retry once. ([c90c3759](https://github.com/Huddly/sdk/commit/c90c3759dc02c6f606122fcadb59c8a8992c00b7))
* **examples:**  Update sdk examples to use latest sdk version (0.4.0) ([3b462f73](https://github.com/Huddly/sdk/commit/3b462f73cdd51032b69619c99fc42625c677c8b0))

##### Other Changes

*  Ace->resetSettings promises must run in sequence ([23241007](https://github.com/Huddly/sdk/commit/23241007bb1af3720441af2c265aee71b24f75d0))
*  bump camera-proto and lock jszip ([19764d53](https://github.com/Huddly/sdk/commit/19764d53eaae271cd3329a2c540bf8b5f53e0069))
*  complete coverage for ace.ts class ([7585c67c](https://github.com/Huddly/sdk/commit/7585c67c56ec164a9ad19ac4732982da28049b20))
*  Ace->setPanTiltZoom ([4338b1cd](https://github.com/Huddly/sdk/commit/4338b1cd593f09fff4e07affc609e0d16d8ca80f))
*  Add support for reset settings ([e64799d3](https://github.com/Huddly/sdk/commit/e64799d30d965edb1e4b3ece9b7fee5610400ffa))
*  fix ace upgrade progress events ([1ab60bcc](https://github.com/Huddly/sdk/commit/1ab60bcc483410daa344807ce83fb3cf6cbe856a))
*  fix audit issues (lock jszip) ([b11bcf9a](https://github.com/Huddly/sdk/commit/b11bcf9a817deb6928d6565e74dc937661030bd4))
*  add support for PID=0x51 ([5642a2e2](https://github.com/Huddly/sdk/commit/5642a2e2610087cd427cc1f0cbee00278df29cf7))

##### Refactors

*  rename multicastInterfaceAddr to targetInterfaceAddr ([9ff12ef9](https://github.com/Huddly/sdk/commit/9ff12ef99eda0e22fb88ab6782a9ea600f556db0))
*  node8 does not like ().then().catch().finally() ([592fcdcf](https://github.com/Huddly/sdk/commit/592fcdcff9f5d70465c7b73159349bed3a221efc))
*  Ace.ts rewrite setPanTiltZoom function ([9e1b6960](https://github.com/Huddly/sdk/commit/9e1b6960f90b28a1f361bc2893c9845c1df0ae8d))
*  use @huddly/camera-proto and @huddly/camera-switch-proto packages ([3defe04a](https://github.com/Huddly/sdk/commit/3defe04afe5c4fd5f8abb782d5eb19531dcc39dd))
*  remove @huddly/huddlyproto pkg folder ([0d881be0](https://github.com/Huddly/sdk/commit/0d881be04354b6126115133f770d4f3ef9c2e44c))
*  test command should be run explicilty in travis ([f0bde072](https://github.com/Huddly/sdk/commit/f0bde07211c1e3220b25ef578e5cdf0b8d49af38))
*  use @huddly/huddlyproto package ([a49367f8](https://github.com/Huddly/sdk/commit/a49367f8ba4ca42b5fc6b3621348e9ddf97826d6))
*  fix logger interface and implementation ([49c32543](https://github.com/Huddly/sdk/commit/49c325439f2f35ee782abf0e005f6885f282ac0e))
*  update example index.js ([8e857714](https://github.com/Huddly/sdk/commit/8e857714c86d2b0991e40d8889b708568ba0f7bb))
* **ace.ts:**  rename uptime function ([9d4d0fcb](https://github.com/Huddly/sdk/commit/9d4d0fcb79b14aaea02b1e6059606ce76c0e73d8))
* **Logger:**  static logger class ([dbe83637](https://github.com/Huddly/sdk/commit/dbe83637b2eb035c62003694934b34e188c242bb))

##### Tests

*  unit tests for sdk Logger ([8a25245b](https://github.com/Huddly/sdk/commit/8a25245b64dc93f0722add598b425c93aa6223db))
*  unit test service code ([efd93396](https://github.com/Huddly/sdk/commit/efd93396e0c97587e321ff608ba2c2af2135caf7))
*  Unit test AceUpgrader class ([9f33e404](https://github.com/Huddly/sdk/commit/9f33e40489e7970be5ada942dcdba9c76f20d91e))

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
