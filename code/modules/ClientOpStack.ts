import * as NT from '../types/NetworkTypes';
import * as CT from '../types/CRDTTypes';


import {NoUndosAvailableException, NoRedosAvailableException} from './Helper';



export default class ClientOpStack {

    private opStack: any[];
    private opStackPointer;

    constructor() {
        this.opStack = [];
        this.opStackPointer = 0;
    }


    public localInsert(startId: string, len: number) {
        this.push('i', startId, len);
    }

    // if len is negative, then we go backward in the counter
    // if len is positive, then we go forward
    public localDelete(startId: string, len: number) {
        this.push('d', startId, len);
    }

    private push(type: 'i' | 'd', startId: string, len: number) {
        this.opStack[this.opStackPointer] = [type, startId, len]; // javascript feature, arrays are just hashmaps
        this.opStackPointer++;
    }

    
    public undoAvailable(): boolean {
        return this.opStackPointer > 0;
    }

    public redoAvailable(): boolean {
        return this.opStackPointer < this.opStack.length
    }

    // prepares the inverse operation of whatever is on the stack
    // origin is set by caller
    public undo(): NT.PreparedPacket {

        if (!this.undoAvailable()) {
            throw new NoUndosAvailableException("Already at bottom of Undo stack, can't undo");
        }

        let op = this.back();
        let inverseType : "ui" | "ud" = op[0] === 'i' ? 'ui' : 'ud';    // not sure why i need to specify this, TS should do it

        // generate list of ID's to undo (either insert or delete, delete could go backwards or forwards from start ID)
        let undoIds = [];
        let startingClock = parseInt(op[1].split('.')[0]);
        let client = op[1].split('.')[1];
        let step = op[2]/Math.abs(op[2]);   // could be positive or negative
        for (let i = 0; i < Math.abs(op[2]); i++) {
            let clockValue = startingClock + step*i;
            undoIds.push(clockValue + '.' + client);
        }

        let bundle: CT.UndoMessage = {
            id: undoIds
        };

        let packet: NT.PreparedPacket = {
            type: inverseType,
            bundle: bundle
        }

        return packet;
    }

    public redo(): NT.PreparedPacket {
        if (!this.redoAvailable()) {
            throw new NoUndosAvailableException("Already at top of Undo stack, can't redo");
        }

        let op = this.forward();
        let inverseType : "ri" | "rd" = op[0] === 'i' ? 'ri' : 'rd';    // not sure why i need to specify this, TS should do it


        // generate list of ID's to undo (either insert or delete, delete could go backwards or forwards from start ID)
        let undoIds = [];
        let startingClock = parseInt(op[1].split('.')[0]);
        let client = op[1].split('.')[1];
        let step = op[2]/Math.abs(op[2]);   // could be positive or negative
        for (let i = 0; i < Math.abs(op[2]); i++) {
            let clockValue = startingClock + step*i;
            undoIds.push(clockValue + '.' + client);
        }

        undoIds.reverse(); // grouped undos should execute in the opposite order

        let bundle: CT.UndoMessage = {
            id: undoIds
        };

        let packet: NT.PreparedPacket = {
            type: inverseType,
            bundle: bundle
        }

        return packet;
    }


    private back(): any {
        this.opStackPointer--;
        return this.opStack[this.opStackPointer];
    }

    private forward(): any {
        this.opStackPointer++;
        return this.opStack[this.opStackPointer-1];
    }

}