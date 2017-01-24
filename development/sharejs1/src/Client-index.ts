declare var sharejs: any;

import Client from '../modules/Client';


let parentWindow = window.parent;
let id = parseInt(window.frameElement.id);

(<any>window).getId = function() {
    return id;
}



let setup = (<any>parentWindow).getClientSetup(id);
let logger = setup.logger;
(<any>window).logPacket = logger.logPacket.bind(logger);
(<any>window).log = logger.log.bind(logger);

new Client(id, setup.experimentName, sharejs, setup.scheduler, setup.events, (<any>parentWindow).clientReady);
