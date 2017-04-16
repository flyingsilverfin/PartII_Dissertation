declare var sharejs;


import RealtimeScheduler from '../modules/RealtimeScheduler';
import * as T from '../types/Types';

class Client {

    private DISABLE_INTERFACE = true;

    private doc: any;   // sharejs doc
    private id: string;
 
    // private interface: EditableText;
    


    constructor(id: T.ClientId, experimentName, sharejs, scheduler: RealtimeScheduler, events: T.ScheduledEvents, readyCallback) {
        console.log('id: ' + id);

        //use subdomains trick - given an ID it's subdomain is id/5
        let subdomain = Math.floor((id/5)).toString();

        sharejs.open(experimentName, 'text', 'http://' + subdomain + '.localhost:8000/channel', function(err, doc) {            
            if (err) {
                console.error(err);
                console.error("Quitting sharejs doc initialization");
                return;
            }
 
            if (doc.getText().length > 0) {
                console.error('Starting document is not empty (just a heads up)');
            }

            let interfaceContainer = <HTMLDivElement>document.getElementById('client-container');
            let ta = document.createElement('textarea');
            ta.id = id.toString();
            interfaceContainer.appendChild(ta);

            
if (!this.DISABLE_INTERFACE) {
    console.log('attaching text area');
            doc.attach_textarea(ta);
}
            for (let eventTime in events.insert) {
                let time = parseFloat(eventTime);
                let insert = events.insert[time];


                scheduler.addEvent(time, 0, function() {
                    //console.log("Client: " + id + " inserted: " + insert.chars + " after: " + insert.after + " at: " + time);

                    doc.insert(insert.after, insert.chars, null);
if (!this.DISABLE_INTERFACE) {
                    ta.value = doc.getText();   // wasn't updating otherwise for some reason
}
                }.bind(this))

            }

            for (let eventTime in events.delete) {
                let time = parseFloat(eventTime);
                let deletes = events.delete[eventTime];
                for (let i = 0; i < deletes.length; i++) {  //array of indices
                    let toDelete = deletes[i]; 
                    scheduler.addEvent(time, i, function() {
                        doc.del(toDelete, 1, null);
                    })
                }
            }

            readyCallback();
        }.bind(this))

        /*

        // 'events' are stored as a map between time and items to insert and delete

        for (let eventTime in events.insert) {
            let time = parseFloat(eventTime);   // TODO this is weird... shouldn't be necessary
            let inserts = events.insert[time];

            let self = this;

            for (let i = 0; i < inserts.length; i++) {
                let mockInsert = inserts[i];
                scheduler.addEvent(time, i, function() {
                    // schedule to be transmit! :D
                    self.mockInsert(mockInsert.char, mockInsert.after);
                });
            }
        }

        for (let eventTime in events.delete) {
            let time = parseFloat(eventTime);
            let deletes = events.delete[eventTime];

            let self = this;

            for (let i = 0; i < deletes.length; i++) {
                let mockDelete = deletes[i];
                scheduler.addEvent(time, i, function() {
                    self.mockDelete(mockDelete.index);
                });
            }

        }
        */

    }
}

export default Client;
