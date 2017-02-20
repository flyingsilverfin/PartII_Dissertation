declare var sharejs: any;

import Client from '../modules/Client';
import * as T from '../types/Types';


let parentWindow = window.parent;
let id = parseInt(window.frameElement.id);

(<any>window).getId = function() {
    return id;
}



let setup: T.ExperimentSetup = (<any>parentWindow).getClientSetup(id);
let logger = setup.logger;
(<any>window).logPacket = logger.logPacket.bind(logger);
(<any>window).log = logger.log.bind(logger);
(<any>window).logJoin = logger.logJoin.bind(logger);

let whenToJoin = setup.whenToJoin;
let scheduler = setup.scheduler;

scheduler.addEvent(whenToJoin, 0, function() {
    new Client(id, setup.experimentName, sharejs, scheduler, setup.events, (<any>parentWindow).clientReady);
});
