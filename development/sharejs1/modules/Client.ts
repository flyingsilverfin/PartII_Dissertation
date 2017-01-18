declare var sharejs;


import EventDrivenScheduler from '../modules/EventDrivenScheduler';
import * as T from '../types/Types';

class Client {


    private doc: any;   // sharejs doc
    private id: string;
 
    // private interface: EditableText;
    


    constructor(id: T.ClientId, sharejs, scheduler: EventDrivenScheduler, events: T.ScheduledEvents) {

        console.log(id)

        setTimeout( function() {
            sharejs.open('testdoc', 'text', 'http://localhost:8000/channel', function(err, doc) {
                console.log(err, doc);

                let interfaceContainer = <HTMLDivElement>document.getElementById('client-container');
                let ta = document.createElement('textarea');
                ta.id = id.toString();
                interfaceContainer.appendChild(ta);
                doc.attach_textarea(ta);
            })
        }, id*1000);

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
