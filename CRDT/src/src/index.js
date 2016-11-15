"use strict";
var Client_1 = require('../modules/Client');
var NetworkManager_1 = require('../modules/NetworkManager');
var nm = new NetworkManager_1["default"]();
for (var i = 0; i < 2; i++) {
    new Client_1["default"](nm);
}
