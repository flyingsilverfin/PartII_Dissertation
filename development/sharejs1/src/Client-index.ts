declare var sharejs: any;

import Client from '../modules/Client';


let parentWindow = window.parent;
let id = parseInt(window.frameElement.id);
let setup = (<any>parentWindow).getClientSetup(id);

new Client(id, setup.experimentName, sharejs, setup.scheduler, setup.events, (<any>parentWindow).clientReady);
