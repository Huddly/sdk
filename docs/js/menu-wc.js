'use strict';


customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">huddly-sdk</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#additional-pages"'
                            : 'data-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Additional Information</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="chapter inner">
                                        <a data-type="chapter-link" href="additional-documentation/detector.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-a028636532e4612c39dedd405fdc32ff"' : 'data-target="#xs-additional-page-a028636532e4612c39dedd405fdc32ff"' }>
                                                <span class="link-name">Detector</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-a028636532e4612c39dedd405fdc32ff"' : 'id="xs-additional-page-a028636532e4612c39dedd405fdc32ff"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/detector/previous-detectors.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Previous Detectors</a>
                                            </li>
                                        </ul>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Ace.html" data-type="entity-link">Ace</a>
                            </li>
                            <li class="link">
                                <a href="classes/AceUpgradeError.html" data-type="entity-link">AceUpgradeError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AceUpgrader.html" data-type="entity-link">AceUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/AttachError.html" data-type="entity-link">AttachError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AutozoomControl.html" data-type="entity-link">AutozoomControl</a>
                            </li>
                            <li class="link">
                                <a href="classes/Boxfish.html" data-type="entity-link">Boxfish</a>
                            </li>
                            <li class="link">
                                <a href="classes/BoxfishHpk.html" data-type="entity-link">BoxfishHpk</a>
                            </li>
                            <li class="link">
                                <a href="classes/CameraSwitchService.html" data-type="entity-link">CameraSwitchService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ClownFish.html" data-type="entity-link">ClownFish</a>
                            </li>
                            <li class="link">
                                <a href="classes/DartFish.html" data-type="entity-link">DartFish</a>
                            </li>
                            <li class="link">
                                <a href="classes/DetectionsConverter.html" data-type="entity-link">DetectionsConverter</a>
                            </li>
                            <li class="link">
                                <a href="classes/Detector.html" data-type="entity-link">Detector</a>
                            </li>
                            <li class="link">
                                <a href="classes/DeviceFactory.html" data-type="entity-link">DeviceFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/Dwarffish.html" data-type="entity-link">Dwarffish</a>
                            </li>
                            <li class="link">
                                <a href="classes/FaseBasedExposureControl.html" data-type="entity-link">FaseBasedExposureControl</a>
                            </li>
                            <li class="link">
                                <a href="classes/HPKUpgradeError.html" data-type="entity-link">HPKUpgradeError</a>
                            </li>
                            <li class="link">
                                <a href="classes/HPKUpgrader.html" data-type="entity-link">HPKUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/HuddlyGo.html" data-type="entity-link">HuddlyGo</a>
                            </li>
                            <li class="link">
                                <a href="classes/HuddlyGoUpgrader.html" data-type="entity-link">HuddlyGoUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/HuddlySdk.html" data-type="entity-link">HuddlySdk</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpAutozoomControl.html" data-type="entity-link">IpAutozoomControl</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpBaseDevice.html" data-type="entity-link">IpBaseDevice</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpCameraUpgrader.html" data-type="entity-link">IpCameraUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpDetector.html" data-type="entity-link">IpDetector</a>
                            </li>
                            <li class="link">
                                <a href="classes/IpFaceBasedExposureControl.html" data-type="entity-link">IpFaceBasedExposureControl</a>
                            </li>
                            <li class="link">
                                <a href="classes/See.html" data-type="entity-link">See</a>
                            </li>
                            <li class="link">
                                <a href="classes/SeeUpgrader.html" data-type="entity-link">SeeUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpgradeStatus.html" data-type="entity-link">UpgradeStatus</a>
                            </li>
                            <li class="link">
                                <a href="classes/UpgradeStatusStep.html" data-type="entity-link">UpgradeStatusStep</a>
                            </li>
                            <li class="link">
                                <a href="classes/UvcBaseDevice.html" data-type="entity-link">UvcBaseDevice</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/ConverterOpts.html" data-type="entity-link">ConverterOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SDKOpts.html" data-type="entity-link">SDKOpts</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});