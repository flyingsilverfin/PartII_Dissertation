"use strict";
var MapCRDT_1 = require('./MapCRDT');
var EditableText_1 = require('./EditableText');
var NetworkInterface_1 = require('./NetworkInterface');
var Client = (function () {
    function Client(networkManager) {
        // 1 in a million collision... Would probably have the bootstrapping server hand out unique ID's
        // this.id = Math.round(Math.random()*1000000).toString();
        this.id = networkManager.getId().toString();
        this.dt = new MapCRDT_1["default"](this.id);
        var interfaceContainer = document.getElementById('container');
        this.interface = new EditableText_1["default"](interfaceContainer);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);
        this.interface.deleteCallback = this.charDeletedLocal.bind(this);
        this.network = new NetworkInterface_1["default"](networkManager); // network manager registers itself
        this.network.insertPacketReceived = this.insertReceived.bind(this);
        this.network.deletePacketReceived = this.deleteReceived.bind(this);
        this.updateParallelArrays();
        /*
                this.insertReceived({
                    after: '0',
                    char: 'a',
                    id: '1.1'
                });
                this.insertReceived({
                    after: '0',
                    char: 'b',
                    id: '1.2'
                });
                this.insertReceived({
                    after:'0',
                    char:'2',
                    id: '2.0'
                })
                this.insertReceived({
                    after: '0',
                    char: 'c',
                    id: '1.0'
                });
        */
    }
    // interesting it doesn't type check this automatically with the required structure of this.interface.insertCallback
    Client.prototype.charInsertedLocal = function (char, after) {
        var nextT = this.dt.getNextTs().toString();
        var opId = nextT + '.' + this.id;
        var idOfAfter = this.getIdOfStringIndex(after);
        var bundle = {
            id: opId,
            char: char,
            after: idOfAfter
        };
        this.dt.insert(bundle);
        // TODO add UNIT TEST in dt.insert
        var networkPacket = {
            origin: this.id,
            type: 'i',
            bundle: bundle
        };
        this.network.send(networkPacket);
        // this is bad - does a O(N) retrieval each insert!
        //  #optmize potential
        this.updateParallelArrays();
    };
    Client.prototype.insertReceived = function (bundle) {
        this.dt.insert(bundle);
        // get old cursor position and 'after'
        var oldCursorPosition = this.interface.getCursorPosition();
        var oldAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.updateParallelArrays();
        // probably possible to do this more cleanly
        var newAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.interface.setContent(this.charArray.join(''));
        if (oldAfterId !== newAfterId) {
            this.interface.incrementCursorPosition();
        }
    };
    Client.prototype.charDeletedLocal = function (index) {
        var deletedId = this.getIdOfStringIndex(index);
        var bundle = {
            deleteId: deletedId
        };
        this.dt.delete(bundle);
        var networkPacket = {
            origin: this.id,
            type: 'd',
            bundle: bundle
        };
        this.network.send(networkPacket);
        this.updateParallelArrays();
    };
    Client.prototype.deleteReceived = function (bundle) {
        this.dt.delete(bundle);
        // get old cursor position and 'after'
        var oldCursorPosition = this.interface.getCursorPosition();
        var oldAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.updateParallelArrays();
        // probably possible to do this more cleanly
        var newAfterId = this.getIdOfStringIndex(oldCursorPosition);
        this.interface.setContent(this.charArray.join(''));
        if (oldAfterId !== newAfterId) {
            this.interface.decrementCursorPosition();
        }
    };
    Client.prototype.updateParallelArrays = function () {
        var readValues = this.dt.read();
        this.charArray = readValues.charArray;
        this.idArray = readValues.idArray;
    };
    Client.prototype.getIdOfStringIndex = function (after) {
        return this.idArray[after];
    };
    return Client;
}());
exports.__esModule = true;
exports["default"] = Client;
