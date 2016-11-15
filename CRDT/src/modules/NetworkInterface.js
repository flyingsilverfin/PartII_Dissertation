"use strict";
var NetworkInterface = (function () {
    function NetworkInterface(networkManager) {
        this.networkManager = networkManager;
        this.networkManager.register(this);
    }
    NetworkInterface.prototype.send = function (packet) {
        this.networkManager.broadcast(this, packet);
    };
    NetworkInterface.prototype.receive = function (packet) {
        // ASSERT NEEDED
        //  this.insertPacketReceived !== null
        //  this.deletePacketReceived !== null
        // demultiplex packet type
        if (packet.type === 'i') {
            this.insertPacketReceived(packet.bundle);
        }
        else if (packet.type === 'd') {
            this.deletePacketReceived(packet.bundle);
        }
        else {
            console.error('Received unknown network type: ' + packet.type);
        }
    };
    return NetworkInterface;
}());
exports.__esModule = true;
exports["default"] = NetworkInterface;
