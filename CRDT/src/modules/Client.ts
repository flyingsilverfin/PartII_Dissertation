import * as CT from '../types/CRDTTypes';
import * as C from '../types/ClientTypes';
import MapCRDT from './MapCRDT';
import EditableText from './EditableText';


class Client implements C.Client {

    private id: string;
    private dt: CT.CRDT;    // our CRDT (datastructure)

    private interface: EditableText;

    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor() {

        // 1 in a million collision... Would probably have the bootstrapping server hand out unique ID's
        this.id = Math.round(Math.random()*1000000).toString();

        this.dt = new MapCRDT(this.id);

        let interfaceContainer = <HTMLDivElement>document.getElementById('container');


        this.interface = new EditableText(interfaceContainer);
        this.interface.setId(this.id);


        this.interface.insertCallback = this.charInsertedLocal;

        let readValues = this.dt.read();
        this.charArray = readValues.charArray;
        this.idArray = readValues.idArray;

    }


    // interesting it doesn't type check this automatically with the required structure of this.interface.insertCallback
    private charInsertedLocal(char: string, after: number): void {
        let nextT = this.dt.getNextTs().toString();
        let insertId = nextT + '.' + this.id;

        let idOfAfter = this.getIdOfStringIndex(after);

        let msg: CT.InsertMessage = {
            id: insertId,
            char: char,
            after: idOfAfter
        };

        this.dt.insert(msg);
        // TODO
        //  send to network/other client
    }


    private getIdOfStringIndex(after: number): string {
        return this.idArray[after];
    }

}


export default Client;