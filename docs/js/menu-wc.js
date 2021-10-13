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
                                        <a data-type="chapter-link" href="additional-documentation/examples.html" data-context-id="additional">
                                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#additional-page-8ca1d4e00aecfd0c791bb89268726675"' : 'data-target="#xs-additional-page-8ca1d4e00aecfd0c791bb89268726675"' }>
                                                <span class="link-name">Examples</span>
                                                <span class="icon ion-ios-arrow-down"></span>
                                            </div>
                                        </a>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="additional-page-8ca1d4e00aecfd0c791bb89268726675"' : 'id="xs-additional-page-8ca1d4e00aecfd0c791bb89268726675"' }>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/examples/peoplecount-in-a-meeting-room.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Peoplecount in a meeting room</a>
                                            </li>
                                            <li class="link for-chapter2">
                                                <a href="additional-documentation/examples/rest-api.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">REST api</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/get-detections.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Get detections</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/detector-start.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Detector start</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/detector-stop.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Detector stop</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/camera-info.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Camera info</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/upgrade.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Upgrade</a>
                                            </li>
                                            <li class="link for-chapter3">
                                                <a href="additional-documentation/examples/rest-api/upgrade-status.html" data-type="entity-link" data-context="sub-entity" data-context-id="additional">Upgrade status</a>
                                            </li>
                                        </ul>
                                    </li>
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
                                    <li class="link ">
                                        <a href="additional-documentation/canvas.html" data-type="entity-link" data-context-id="additional">Canvas</a>
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
                                <a href="classes/DiagnosticsMessage.html" data-type="entity-link" >DiagnosticsMessage</a>
                            </li>
                            <li class="link">
                                <a href="classes/HuddlySdk.html" data-type="entity-link" >HuddlySdk</a>
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
                                <a href="interfaces/AutozoomControlOpts.html" data-type="entity-link" >AutozoomControlOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DetectorOpts.html" data-type="entity-link" >DetectorOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICnnControl.html" data-type="entity-link" >ICnnControl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDetector.html" data-type="entity-link" >IDetector</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDeviceManager.html" data-type="entity-link" >IDeviceManager</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IDeviceUpgrader.html" data-type="entity-link" >IDeviceUpgrader</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IHuddlyService.html" data-type="entity-link" >IHuddlyService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ILogger.html" data-type="entity-link" >ILogger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IServiceOpts.html" data-type="entity-link" >IServiceOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SDKOpts.html" data-type="entity-link" >SDKOpts</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UpgradeOpts.html" data-type="entity-link" >UpgradeOpts</a>
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
                        </ul>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});