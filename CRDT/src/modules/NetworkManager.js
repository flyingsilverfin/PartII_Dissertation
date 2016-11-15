"use strict";
var NetworkManager = (function () {
    function NetworkManager() {
        this.id = 0;
        this.clients = [];
    }
    NetworkManager.prototype.register = function (client) {
        this.clients.push(client);
    };
    // just send it to all the other registered clients
    NetworkManager.prototype.broadcast = function (sender, packet) {
        console.log(this.clients);
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            if (client === sender) {
                continue;
            }
            client.receive(packet);
        }
    };
    NetworkManager.prototype.getId = function () {
        this.id++;
        return this.id - 1;
    };
    return NetworkManager;
}());
exports.__esModule = true;
exports["default"] = NetworkManager;
