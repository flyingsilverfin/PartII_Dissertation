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


    public localInsert(id: string) {
        this.push('i', id);
    }

    public localDelete(id: string) {
        this.push('d', id);
    }

    private push(type: 'i' | 'd', id: string) {
        this.opStack[this.opStackPointer] = [type, id]; // javascript feature, arrays are just hasmaps
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
    public undo(): NT.NetworkPacket {

        if (!this.undoAvailable()) {
            throw new NoUndosAvailableException("Already at bottom of Undo stack, can't undo");
        }

        let op = this.back();
        let inverseType : "ui" | "ud" = op[0] === 'i' ? 'ui' : 'ud';    // not sure why i need to specify this, TS should do it
        let bundle: CT.UndoMessage = {
            id: [op[1]]
        };

        let packet: NT.NetworkPacket = {
            origin: null,
            type: inverseType,
            bundle: bundle
        }

        return packet;
    }

    public redo(): NT.NetworkPacket {
        if (!this.redoAvailable()) {
            throw new NoUndosAvailableException("Already at top of Undo stack, can't redo");
        }

        let op = this.forward();
        let inverseType : "ri" | "rd" = op[0] === 'i' ? 'ri' : 'rd';    // not sure why i need to specify this, TS should do it
        let bundle: CT.UndoMessage = {
            id: [op[1]]
        };

        let packet: NT.NetworkPacket = {
            origin: null,
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