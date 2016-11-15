"use strict";
var Client_1 = require('../modules/Client');
var NetworkManager_1 = require('../modules/NetworkManager');
var tmpTest_1 = require('../tests/tmpTest');
var tsUnit = require('tsunit.external/tsUnit');
// prepare tests
var test = new tsUnit.Test(tmpTest_1["default"]);
// Run the test
var result = test.run();
// Display in the element with id="results"
result.showResults('results');
// run main code
var nm = new NetworkManager_1["default"]();
for (var i = 0; i < 2; i++) {
    new Client_1["default"](nm);
}
