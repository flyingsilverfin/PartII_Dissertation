"use strict";
var CC = require('./CRDTComparator');
var MapCRDT = (function () {
    function MapCRDT(id) {
        this.id = id;
        this.nextCounter = 1;
        // keep '0' as as an anchorpoint
        this.map = {
            '0': {
                next: null,
                char: ''
            }
        };
    }
    // implements interface
    MapCRDT.prototype.insert = function (bundle) {
        // ASSERT NEEDED:
        //  this.map[bundle.id] === undefined 
        var id = bundle.id; // id.timestamp to insert this char with
        var char = bundle.char;
        var after = bundle.after; // id.timestamp to insert this char after
        // implement core CRDT insert algorithm here
        // may want to abstract out into separate class to plug into other datastructures if desired
        var entryBeforeId = after;
        var entryBefore = this.map[after];
        // move forward until hit a next element which is less than id
        // entryBefore.next may be null! (will often be null)
        while (CC.compare(id, entryBefore.next) < 0) {
            entryBeforeId = entryBefore.next;
            entryBefore = this.map[entryBeforeId];
        }
        console.log('Inserting after: ' + entryBeforeId + ' with id ' + id);
        // insert new entry into linked list
        var newEntry = {
            char: char,
            next: entryBefore.next
        };
        entryBefore.next = id;
        this.map[id] = newEntry;
        // update local lamport timestamp
        var t = parseInt(id.split('.')[0]);
        // ASSERT NEEDED
        //  t >= this.nextCounter
        this.nextCounter = t + 1;
    };
    // implements interface
    MapCRDT.prototype.delete = function (bundle) {
        var idToDelete = bundle.deleteId;
        this.map[idToDelete]['deleted'] = true;
    };
    // implements interface
    MapCRDT.prototype.read = function () {
        // writing to array then joining seems to be fastest way of doing this
        var charArray = [];
        var idArray = [];
        var id = '0';
        var entry;
        while (id !== null) {
            entry = this.map[id];
            if (!entry.deleted) {
                // TODO unsure of how to handle deletion still!
                charArray.push(entry.char);
                idArray.push(id);
            }
            id = entry.next;
        }
        return { charArray: charArray, idArray: idArray };
    };
    MapCRDT.prototype.getNextTs = function () {
        return this.nextCounter;
    };
    return MapCRDT;
}());
exports.__esModule = true;
exports["default"] = MapCRDT;
