'use strict';



var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

customElements.define('compodoc-menu', function (_HTMLElement) {
    _inherits(_class, _HTMLElement);

    function _class() {
        _classCallCheck(this, _class);

        var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

        _this.isNormalMode = _this.getAttribute('mode') === 'normal';
        return _this;
    }

    _createClass(_class, [{
        key: 'connectedCallback',
        value: function connectedCallback() {
            this.render(this.isNormalMode);
        }
    }, {
        key: 'render',
        value: function render(isNormalMode) {
            let tp = lithtml.html(
'<nav>\n    <ul class="list">\n        <li class="title">\n            \n                <a href="index.html" data-type="index-link">huddly-sdk</a>\n            \n        </li>\n\n        <li class="divider"></li>\n        ' + (isNormalMode ? '' : '') + '\n        <li class="chapter">\n            <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>\n            <ul class="links">\n                \n                    <li class="link">\n                        <a href="overview.html" data-type="chapter-link">\n                            <span class="icon ion-ios-keypad"></span>Overview\n                        </a>\n                    </li>\n                    <li class="link">\n                        <a href="index.html" data-type="chapter-link">\n                            <span class="icon ion-ios-paper"></span>README\n                        </a>\n                    </li>\n                \n                \n                \n                    <li class="link">\n                        <a href="dependencies.html"\n                            data-type="chapter-link">\n                            <span class="icon ion-ios-list"></span>Dependencies\n                        </a>\n                    </li>\n                \n            </ul>\n        </li>\n        \n        <li class="chapter">\n            <div class="simple menu-toggler" data-toggle="collapse"\n              ' + (isNormalMode ? 'data-target="#additional-pages"' : 'data-target="#xs-additional-pages"') + '>\n                <span class="icon ion-ios-book"></span>\n                <span>Examples</span>\n                <span class="icon ion-ios-arrow-down"></span>\n            </div>\n            <ul class="links collapse"\n                ' + (isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"') + '>\n                \n                    <li class="link ">\n                        <a href="additional-documentation/peoplecount-in-a-meeting-room.html" data-type="entity-link" data-context-id="additional">Peoplecount in a meeting room</a>\n                    </li>\n                \n                    <li class="link ">\n                        <a href="additional-documentation/rest-api.html" data-type="entity-link" data-context-id="additional">REST api</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/get-detections.html" data-type="entity-link" data-context-id="additional">Get detections</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/detector-start.html" data-type="entity-link" data-context-id="additional">Detector start</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/detector-stop.html" data-type="entity-link" data-context-id="additional">Detector stop</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/camera-info.html" data-type="entity-link" data-context-id="additional">Camera info</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/upgrade.html" data-type="entity-link" data-context-id="additional">Upgrade</a>\n                    </li>\n                \n                    <li class="link for-chapter2">\n                        <a href="additional-documentation/rest-api/upgrade-status.html" data-type="entity-link" data-context-id="additional">Upgrade status</a>\n                    </li>\n                \n            </ul>\n        </li>\n        \n        \n        \n        \n        \n        \n        <li class="chapter">\n            <div class="simple menu-toggler" data-toggle="collapse"\n            ' + (isNormalMode ? 'data-target="#classes-links"' : 'data-target="#xs-classes-links"') + '>\n                <span class="icon ion-ios-paper"></span>\n                <span>Classes</span>\n                <span class="icon ion-ios-arrow-down"></span>\n            </div>\n            <ul class="links collapse"\n            ' + (isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"') + '>\n                \n                    <li class="link">\n                        <a href="classes/HuddlySdk.html" data-type="entity-link">HuddlySdk</a>\n                    </li>\n                \n            </ul>\n        </li>\n        \n        \n        \n        \n        \n        <li class="chapter">\n            <div class="simple menu-toggler" data-toggle="collapse"\n                ' + (isNormalMode ? 'data-target="#interfaces-links"' : 'data-target="#xs-interfaces-links"') + '>\n                <span class="icon ion-md-information-circle-outline"></span>\n                <span>Interfaces</span>\n                <span class="icon ion-ios-arrow-down"></span>\n            </div>\n            <ul class="links collapse"\n            ' + (isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"') + '>\n                \n                    <li class="link">\n                        <a href="interfaces/DetectorOpts.html" data-type="entity-link">DetectorOpts</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/IDetector.html" data-type="entity-link">IDetector</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/IDeviceManager.html" data-type="entity-link">IDeviceManager</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/IDeviceUpgrader.html" data-type="entity-link">IDeviceUpgrader</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/InterpolationParams.html" data-type="entity-link">InterpolationParams</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/SDKOpts.html" data-type="entity-link">SDKOpts</a>\n                    </li>\n                \n                    <li class="link">\n                        <a href="interfaces/UpgradeOpts.html" data-type="entity-link">UpgradeOpts</a>\n                    </li>\n                \n            </ul>\n        </li>\n        \n        \n        \n        <li class="chapter">\n            <div class="simple menu-toggler" data-toggle="collapse"\n            ' + (isNormalMode ? 'data-target="#miscellaneous-links"' : 'data-target="#xs-miscellaneous-links"') + '>\n                <span class="icon ion-ios-cube"></span>\n                <span>Miscellaneous</span>\n                <span class="icon ion-ios-arrow-down"></span>\n            </div>\n            <ul class="links collapse"\n            ' + (isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"') + '>\n                \n                    <li class="link">\n                      <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>\n                    </li>\n                \n                \n                \n                \n                    <li class="link">\n                      <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>\n                    </li>\n                \n            </ul>\n        </li>\n        \n        \n        \n        \n        \n    </ul>\n</nav>'
);
        this.innerHTML = tp.strings;
        }
    }]);

    return _class;
}(HTMLElement));