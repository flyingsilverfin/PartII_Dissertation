import * as CT from '../types/CRDTTypes';



class MapCRDTDatastructure implements CT.CRDTDatastructure {

    private nextCounter;
    private id: number;

    private map: CT.MapCRDT;

    constructor(id: number) {

        this.map = {
            '0' : {
                next: null,
                char: ''
            }
        };

    }

    // implements interface
    insert(bundle) {

    }

    // implements interface
    delete(bundle){

    }

    // implements interface
    read() {
        // writing to array then joining seems to be fastest way of doing this

        let arr = [];
        let entry = this.map[0];
        while (entry.next !== null) {
            if (!entry.deleted) {
                arr.push(entry.char);
            }
            entry = this.map[entry.next]
        }

        return arr.join('');
    }

}

export default MapCRDTDatastructure;