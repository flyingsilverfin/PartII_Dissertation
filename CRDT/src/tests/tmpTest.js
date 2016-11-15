"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var tsUnit = require('tsunit.external/tsUnit');
var MapCRDT_1 = require('../modules/MapCRDT');
function d(x) {
    return x + 1;
}
var MapCRDTTester = (function (_super) {
    __extends(MapCRDTTester, _super);
    function MapCRDTTester() {
        _super.apply(this, arguments);
        this.target = new MapCRDT_1["default"]('1');
    }
    return MapCRDTTester;
}(tsUnit.TestClass));
