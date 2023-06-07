#### 0.10.1 (2023-06-07)

##### New Features

* **crew:**  added crew device ([#568](https://github.com/Huddly/sdk/pull/568)) ([96304276](https://github.com/Huddly/sdk/commit/96304276cb7a0c4d34150e334f2f5163c6b73f5d))
* **ipUpgrade:**  New cpio file format ([#565](https://github.com/Huddly/sdk/pull/565)) ([2911c3b2](https://github.com/Huddly/sdk/commit/2911c3b2d29a0f8addc31011ce1fca6d62373558))

### 0.10.0 (2023-06-01)

##### Build System / Dependencies

* **package:**  update sdk-interface dep ([87e01f6a](https://github.com/Huddly/sdk/commit/87e01f6a80aa8aef0ee83820709bf94c98b40a9e))

##### New Features

* **ipAutozoomController:**  _setMode added for legacy support ([16e43476](https://github.com/Huddly/sdk/commit/16e43476934df9f6f4c94c3d90c00c2e515fae1c))
* **usbAdapterCamera:**  added support l1 and s1 through usb adapter ([1ac09dfd](https://github.com/Huddly/sdk/commit/1ac09dfdae24283d66bb0d36f79b51f1a1e8226c))
*  added smartbase device ([b05b9773](https://github.com/Huddly/sdk/commit/b05b97731603f341e157e347581ddb81e1d35618))

##### Bug Fixes

* **api.ts:**  using newer msgpack library for handling encoding ([58230059](https://github.com/Huddly/sdk/commit/58230059de6811c74441ed1054c5f49c65f26a7c))

#### 0.9.2 (2023-05-12)

##### New Features

* **caClient:**  added client that communicates with the certificate authority ([924becce](https://github.com/Huddly/sdk/commit/924becce5fb22c6c9f8ad8cd28545aaebdba7f27))

#### 0.9.1 (2023-03-03)

##### Chores

* **deps:**
  *  bump json5 from 1.0.1 to 1.0.2 ([1c487d06](https://github.com/Huddly/sdk/commit/1c487d06f125affe0827dfced348334687795118))
  *  bump loader-utils from 1.4.0 to 1.4.2 ([eff582e8](https://github.com/Huddly/sdk/commit/eff582e841859233c37dc492268ae27ee5052fc7))

##### Bug Fixes

* **ipAutozoomControl:**  should not need to check az status when using enable/disable ([c427fefd](https://github.com/Huddly/sdk/commit/c427fefd9ba52b737dae897a65a732169ec52c0d))
* **ipUpgrader:**  fix bug where upgrader is unable to use new cpio files ([a3cdb88c](https://github.com/Huddly/sdk/commit/a3cdb88cdc022d76546444586cedc487dd345ca2))

### 0.9.0 (2022-11-02)

##### Build System / Dependencies

* **deps:**  bump sdk-interfaces from 0.2.1 to 0.2.2 ([ac5c80d0](https://github.com/Huddly/sdk/commit/ac5c80d07cfe6b070bc7ff867b144e7fa44de67d))

##### New Features

*  added static function getConnectedCameras ([3e66435a](https://github.com/Huddly/sdk/commit/3e66435a2eb45450ee67e3cf326a4a5378d6cb5b))

### 0.8.0 (2022-10-20)

##### Build System / Dependencies

*  update @huddly/camera-proto to v1.2.0 ([b9ba1bf3](https://github.com/Huddly/sdk/commit/b9ba1bf3c237005e4b0dad0e62b7713e9bff1b1a))
*  update @huddly/camera-proto to v1.1.5 ([84f05e1c](https://github.com/Huddly/sdk/commit/84f05e1c5ba310e43bace44948b1dbf8c522ed11))
*  add eslint-plugin-react-hooks to package-lock ([4df9b5f6](https://github.com/Huddly/sdk/commit/4df9b5f60371e91773ab153c2274c34d662c7167))

##### Chores

* **deps:**  bump protobufjs from 6.11.2 to 6.11.3 ([e900d42c](https://github.com/Huddly/sdk/commit/e900d42ce96c3636b6bb6cefac6bbd40b4185bbb))

##### Documentation Changes

*  updated html files ([53beb474](https://github.com/Huddly/sdk/commit/53beb4742bbfc14e47fd47c71912580f962e6d79))
*  Add known issues section to readme ([2b280fac](https://github.com/Huddly/sdk/commit/2b280fac64289a57967111255f51f8690c4b2817))

##### New Features

*  autozoom modes ([51d48413](https://github.com/Huddly/sdk/commit/51d484130c3e4e9a8b7a411745bbf6dd8bc0b937))

##### Bug Fixes

*  S1 detections now has correct height coordinates ([eb6544a9](https://github.com/Huddly/sdk/commit/eb6544a9564f7901cf4c4ce2f8c4d181d8c8766e))
*  bufferStream now correctly implements destroy method ([926b052c](https://github.com/Huddly/sdk/commit/926b052cd063c2eac5594dfe13ce09ff4a748484))
*  Remove protobuf related dependencies ([5fc4a2aa](https://github.com/Huddly/sdk/commit/5fc4a2aa4580fc2fca15077186f91dd7f608dc85))
*  hotfix for dartfish upgrader crashing when verifying upgrade ([306590cd](https://github.com/Huddly/sdk/commit/306590cd3dc4cd4e90b3ae226ba35aa4c332de36))

##### Tests

* **ipbase:**
  *  added tests for getOptionCertificates ([0343e5dc](https://github.com/Huddly/sdk/commit/0343e5dc1698ff6e2f5516e65174e68914106b5a))
  *  added tests for getOptionCertificates ([8abe2eba](https://github.com/Huddly/sdk/commit/8abe2eba648cba43cd0c8afb1d561de7b83ed8a3))

### 0.7.0 (2022-04-04)

##### Build System / Dependencies

*  bump cpio-stream ([9baa6d0e](https://github.com/Huddly/sdk/commit/9baa6d0e09b347f82a4cc5dd1ac27656943264fe))

##### Chores

*  Update @huddly/camera-proto to v1.0.14 ([a5908171](https://github.com/Huddly/sdk/commit/a5908171cd53f4d1f26472e61d8054d78bc694dd))
*  fix audit issues with minimist ([21dba5d0](https://github.com/Huddly/sdk/commit/21dba5d0b92a3bde1da9e788089aa4b9282afb02))

##### Documentation Changes

*  Document breaking changes with v0.7.0 ([dd172150](https://github.com/Huddly/sdk/commit/dd172150b395524c70c8cf7ec58975b4d9598dad))
*  Fix up wrong memberOf value for IpBaseDevice methods ([da55869e](https://github.com/Huddly/sdk/commit/da55869e4b198c7e3f60ade918cfd03a96fa3413))
* **Readme.md:**  Document automatic updates of sdk ([3a8617a1](https://github.com/Huddly/sdk/commit/3a8617a137e87644aeb357fec9c4f3743faaf06d))

##### New Features

*  implement #getUpgrader directly on Ace and See controllers ([94a292bb](https://github.com/Huddly/sdk/commit/94a292bb38352b32f0dc264bdcb758821e7389b2))
*  Get upgrader should be called from See or Ace controller ([114f5095](https://github.com/Huddly/sdk/commit/114f509554aadf6bac6a2b3a594b4cd5d5cdc886))
*  Create SeeUpgrader class that extends IpCameraUpgrader ([ff7e6646](https://github.com/Huddly/sdk/commit/ff7e6646c802269b82c015bd80ff1d5b3c7255ed))
*  AceUpgrader now extends IpCameraUpgrader base class ([a4f86672](https://github.com/Huddly/sdk/commit/a4f8667252ec6ca7f34b735aa215d5b8b65612e5))
*  Create a base ip camera upgrader class ([d4612fe4](https://github.com/Huddly/sdk/commit/d4612fe48d62cc07b346d0affaddc32f13fc9212))
*  on getDevice error, emit stacktrace ([25e1611d](https://github.com/Huddly/sdk/commit/25e1611d33e3c32a9bc660ade0e7310ac510a4cd))
*  SDK support for S1 Huddly devices ([01b65f0d](https://github.com/Huddly/sdk/commit/01b65f0d857255b8d687e74bdaa66ac16bbd6e0c))
*  sdk-interfaces v0.2.0 ([bab56ce6](https://github.com/Huddly/sdk/commit/bab56ce6642c0808c4399c8301a445714823eb77))
*  remove all the fileTransfer legacy functions ([86a03bf0](https://github.com/Huddly/sdk/commit/86a03bf0100b236485530662826c843897509724))

##### Bug Fixes

* **ace:**  add return after reject where missing ([9dd78608](https://github.com/Huddly/sdk/commit/9dd78608eca99f2c267078dbf5ddb6c93f8ad0b7))

##### Refactors

*  create IpBaseDevice, Ace & See extend it ([2fb875f0](https://github.com/Huddly/sdk/commit/2fb875f069afc3515aae0ed5d58b2e001b597ad4))

##### Tests

*  fix factory ACE failing test ([6fd66152](https://github.com/Huddly/sdk/commit/6fd66152350d70fad60fe779635aa7bd5a50fdae))
*  update unit tests after removing legacy code ([6b793014](https://github.com/Huddly/sdk/commit/6b793014a7efed935652f406032601325add1918))

#### 0.6.6 (2022-02-17)

##### Chores

*  Build & Test sdk with Node16 ([40345f48](https://github.com/Huddly/sdk/commit/40345f48b523c7f080a519c29db04654189978f2))
* **package.json:**  updated jszip dependency ([f178ed67](https://github.com/Huddly/sdk/commit/f178ed676677fd0ae7e9ecf6d59ea29eb5fc5b1d))
* **deps:**  bump node-fetch from 2.6.5 to 2.6.7 ([2357c03e](https://github.com/Huddly/sdk/commit/2357c03e25f219b108ee840d0dc7cfee384ded8b))

##### Documentation Changes

* **Readme.md:**  Direct users to sdk code sample repo ([f22a72f9](https://github.com/Huddly/sdk/commit/f22a72f9851b4425dd03d3a6b04541bc2fbe89ff))
*  Update docs html files ([37707e88](https://github.com/Huddly/sdk/commit/37707e88933ee40c47ca2d37b58180efcbcdf9ac))
*  Remove code samples from sdk repo ([ac031a96](https://github.com/Huddly/sdk/commit/ac031a9649dbb2b1933e2ec881983faf976c6781))

##### New Features

*  Slack notify when build fails (master) ([7dda4da1](https://github.com/Huddly/sdk/commit/7dda4da1a33e1d3c839520f1d032ffcf4d651fc1))
*  Cron trigger master branch (Mon-Fri @ 0700) ([607c90b0](https://github.com/Huddly/sdk/commit/607c90b0a7b21dfe618c574d802e83106b2b99e8))
*  Allow audit check to have a whitelist ([bafbbffe](https://github.com/Huddly/sdk/commit/bafbbffe6c19068bf0b9f2b383fae3ce9e7521cc))
*  Introduce dependency audit-check ([d7b5fa53](https://github.com/Huddly/sdk/commit/d7b5fa53a5866bb3a7125d6723bb36faf909840a))

##### Bug Fixes

*  Vulnerability check bugfix for node16 ([13533872](https://github.com/Huddly/sdk/commit/13533872fd3cad7b2255a56ca73cd8090a3f9ed7))
*  vulnerabilities & remove cz-conventional-changelog ([15cd40f5](https://github.com/Huddly/sdk/commit/15cd40f5e85b2f4064e5d5506e1099edc5f615c2))
* **az-controllere:**  Increase timeout for az status call ([70aec20b](https://github.com/Huddly/sdk/commit/70aec20b2d92d430fad05c48d6806d2e6c9a74aa))

##### Other Changes

*  Init & setMode should be backward-compatible ([4a57e3fd](https://github.com/Huddly/sdk/commit/4a57e3fd67b283a086e9e48e93cd66ca5ff83223))

##### Tests

*  Install chalk-js for terminal styling ([b00fbf57](https://github.com/Huddly/sdk/commit/b00fbf57ff92dddf93374d83276d4b1cd6024a6c))

#### 0.6.5 (2022-01-26)

##### Chores

*  use https for forked cpio-stream (works better in CI) ([ec19a005](https://github.com/Huddly/sdk/commit/ec19a005001774dd9cd9bed8eabf8d99c392a791))
*  bump @huddly/sdk-interfaces to v0.1.1 ([8aa12a96](https://github.com/Huddly/sdk/commit/8aa12a9625b55454024b5c0d81d043d497938ee9))

##### Documentation Changes

*  Update the documentation html files ([20c3883d](https://github.com/Huddly/sdk/commit/20c3883d653b3ddbba5f435f9ff1bf32cd9a61e5))
*  Update jsdocs after interface restructuring ([6dc971f2](https://github.com/Huddly/sdk/commit/6dc971f2e95c67d972f926c658a007d1228361d7))

##### New Features

*  Support new autozoom mode 'Plaza' (aka 'Gallery View') on IQ ([5551c9b5](https://github.com/Huddly/sdk/commit/5551c9b5d2d25283139ce03685a1791f41b26e51))
*  switch to github actions from travis ([740f09da](https://github.com/Huddly/sdk/commit/740f09dade45b44c9294000f3d72ecdb00490ef3))
*  Refactor our interfaces to separate repo/npm ([d83fdd6e](https://github.com/Huddly/sdk/commit/d83fdd6e2882c512e7eae824ac23ae09f20ba1c6))

##### Refactors

*  Grpc client init only on Ace.ts ([796a34e8](https://github.com/Huddly/sdk/commit/796a34e88143842e8298abb90b641c7daed20406))
*  Use Logger and HuddlyHex from sdk-interfaces ([a4a7c48d](https://github.com/Huddly/sdk/commit/a4a7c48d300aa1e7d8295fec080b415ab98ee777))
*  remove compodoc command on package.json ([1813bfec](https://github.com/Huddly/sdk/commit/1813bfec52f0373c3ea2a332c9cb60d9c6bea1f0))

#### 0.6.4 (2021-12-16)

##### Chores

*  update camera-proto version ([15b704a3](https://github.com/Huddly/sdk/commit/15b704a38263934ab2a62460c73b6dd2d4110859))
*  remove ./node_modules prefix from npm scripts ([71b750ac](https://github.com/Huddly/sdk/commit/71b750ac22f53deba7847626f08d1765caa40a13))
*  use pretty-quick for pre-commits ([588b5ea1](https://github.com/Huddly/sdk/commit/588b5ea14bfabac7282ad4c601c24309fc4f61fd))
*  bump prettier version (includes some new formatting rules) ([1ad4255f](https://github.com/Huddly/sdk/commit/1ad4255f34c50a07fb599513235a8ede4ba81886))
*  Update @huddly/camera-switch-proto@0.0.6 ([0c77290e](https://github.com/Huddly/sdk/commit/0c77290e38da9b7dc0ee6745ad5ba32f4e844734))
*  use escaped double quotes since windows does not like singles ([c9873d05](https://github.com/Huddly/sdk/commit/c9873d0519afc5cf1d805ea17b65bdd055eb2584))
* **pacakge.json:**  remove webpack dependencies (sdk not supported on browsers) ([6fa27d9c](https://github.com/Huddly/sdk/commit/6fa27d9c4cfebde33727c07a6fee63f812f6e17b))

##### Documentation Changes

*  Commit documentation changes ([77cae6a8](https://github.com/Huddly/sdk/commit/77cae6a866172e378374453326ab0dd3fce87eb4))
*  Add example docs for Huddly L1 ([3a6aef98](https://github.com/Huddly/sdk/commit/3a6aef982a7c99a5e80950875d7f15b36c1ff5ba))
*  Update info on supported node versions for sdk ([5cadd1d7](https://github.com/Huddly/sdk/commit/5cadd1d714e2603eb8feec0ec89d55041cb0556b))
*  fix link to ICnnControl from main page ([6bb2b39a](https://github.com/Huddly/sdk/commit/6bb2b39a3aaad8f417d8afc2611642580307300c))
*  huddly l1 example readme update ([9053adbd](https://github.com/Huddly/sdk/commit/9053adbd48cb51129da4a68bb94e08f058be0ba2))
*  List more interface docs on main page ([a2448476](https://github.com/Huddly/sdk/commit/a2448476f789793d9878e72920a0ac91c6b5c7c0))
*  Update docs to sync with latest sdk release ([798cdbec](https://github.com/Huddly/sdk/commit/798cdbec2308a09d5b461c257d3f557c099551e8))

##### New Features

*  Detectors can now optionally emit raw detections data ([891a0715](https://github.com/Huddly/sdk/commit/891a0715c39372bba3db6b2fff350994df3919c2))
* **cameraSwitchService:**  fw upgrade schedule ([fbc6c35c](https://github.com/Huddly/sdk/commit/fbc6c35c62409b12ddb32213a74e727fc96a9bb8))

##### Bug Fixes

* **ipDetector:**  await stop promise on destroy ([70724462](https://github.com/Huddly/sdk/commit/707244624d3324d1e51ba5b78b310259c86a17be))
*  added return statement after reject in ace.ts & ipDetector.ts ([ea6b7ace](https://github.com/Huddly/sdk/commit/ea6b7aced5a46366f407acc62c001bf73810cd07))
*  temporary workaround for not emitting dummy rawDetections ([af44c170](https://github.com/Huddly/sdk/commit/af44c17092fed96759012f41341a9adffbf72756))
*  ipDetector now does not emit duplicate or invalid detections ([6312cc53](https://github.com/Huddly/sdk/commit/6312cc53f3722a8770c65d10ece0b209dcb20a5a))
*  glob pattern for prettier now correctly matches all ts files in all subdirs ([5208dab3](https://github.com/Huddly/sdk/commit/5208dab300848d50fd86a1b7ff9c8627ea9c0b3a))
* **ipdetector.ts:**  _stopDetections should invoke setCnnFeature with the correct mode ([34c10eff](https://github.com/Huddly/sdk/commit/34c10effc280fa0ac6777de41a34e84bcf25c914))
* **package.json:**  Fix publish-package npm command ([a7270e51](https://github.com/Huddly/sdk/commit/a7270e51c3a6661865023058247bcf01b2a76a90))
* **pacakge.json:**  Use https for npmjs registry ([22b1124f](https://github.com/Huddly/sdk/commit/22b1124fe619f2b39ba275d907f4d0dd5954d797))

##### Other Changes

* **cameraswitchservice.ts:**  Send correct type ([ba42e834](https://github.com/Huddly/sdk/commit/ba42e83406d486d3e0bd830a7e482079bbe9f8fd))

##### Refactors

*  fix improperly formatted files ([14cd2343](https://github.com/Huddly/sdk/commit/14cd2343f459394a5197beff4afcc817b8dade8a))
* **index.ts:**  sdk ERROR event includes device instance ([6eff42cf](https://github.com/Huddly/sdk/commit/6eff42cf09492043a0bc94585fd64fb8556f1abf))

##### Tests

* **cameraswitchservice:**  Assert grpc out call type ([54e388d9](https://github.com/Huddly/sdk/commit/54e388d951df861a6379d09379fc61c7612fd267))

#### 0.6.3 (2021-10-08)

##### Chores

*  resolve audit issues with eslint and mocha ([b113e5fe](https://github.com/Huddly/sdk/commit/b113e5fecc60b3e1ab2fd6a7816821e2468457c1))
*  update example code ([84bfd388](https://github.com/Huddly/sdk/commit/84bfd388e470544f438d0d0c1a687f3e43951c81))
* **package.json:**  bump @Huddly/camera-proto -> 1.0.9 ([acdc8af5](https://github.com/Huddly/sdk/commit/acdc8af5628c848b2a69660eda55cec92416c6a5))

##### Bug Fixes

*  pin down camera-proto & camera-switch-proto ([657e6d23](https://github.com/Huddly/sdk/commit/657e6d23e947f3f0826b6455084942453b4c2954))

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
