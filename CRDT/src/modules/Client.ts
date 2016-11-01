import * as CT from '../types/CRDTTypes';
import * as C from '../types/ClientTypes';
import * as NT from '../types/NetworkTypes';
import MapCRDT from './MapCRDT';
import EditableText from './EditableText';
import NetworkInterface from './NetworkInterface';


class Client implements C.Client {

    private id: string;
    private dt: CT.CRDT;    // our CRDT (datastructure)

    private interface: EditableText;
    private network: NetworkInterface;

    // state variables
    // parallel lists of char array and CRDT IDs of chars
    private charArray: string[];
    private idArray: string[];


    constructor(networkManager: NetworkManager) {

        // 1 in a million collision... Would probably have the bootstrapping server hand out unique ID's
        this.id = Math.round(Math.random()*1000000).toString();

        this.dt = new MapCRDT(this.id);

        let interfaceContainer = <HTMLDivElement>document.getElementById('container');


        this.interface = new EditableText(interfaceContainer);
        this.interface.setId(this.id);
        this.interface.insertCallback = this.charInsertedLocal.bind(this);

        this.network = new NetworkInterface(networkManager);
        this.network.packet //TODO

        this.updateParallelArrays();


    }


    // interesting it doesn't type check this automatically with the required structure of this.interface.insertCallback
    private charInsertedLocal(char: string, after: number): void {

        let nextT = this.dt.getNextTs().toString();
        let opId = nextT + '.' + this.id;

        let idOfAfter = this.getIdOfStringIndex(after);
        let bundle: CT.InsertMessage = {
            id: opId,
            char: char,
            after: idOfAfter
        };

        this.dt.insert(bundle);

        // TODO add UNIT TEST in dt.insert

        // TODO
        //  send to network/other client


        let networkPacket: NT.NetworkPacket = {
            origin: this.id,
            bundle: bundle
        }

        this.networkInterface.send(networkPacket);




        // this is bad - does a O(N) retrieval each insert!
        //  #optmize potential
        this.updateParallelArrays();
    }

    private updateParallelArrays(): void {
        let readValues = this.dt.read();
        this.charArray = readValues.charArray;
        this.idArray = readValues.idArray;
    }

    private getIdOfStringIndex(after: number): string {
        return this.idArray[after];
    }

}


export default Client;