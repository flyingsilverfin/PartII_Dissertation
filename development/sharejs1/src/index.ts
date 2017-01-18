declare var require: any;
declare var share: any;
declare var textarea: any;
declare var bcsocket: any;


/*declare var sharejs: any;

import Client from '../modules/Client';

let clients = []

for (let i = 0; i < 10; i++) {

    console.log(sharejs);
    sharejs.open('testdoc', 'text', 'http://localhost:8000/channel', function(err, doc) {
        console.log('got doc');
        clients.push(new Client(i, doc, null, null));
    });
}*/


for (let i = 0; i < 10; i++) {
    let iframe = document.createElement('iframe');

    iframe.id = i.toString();
    iframe.src = "http://localhost:9000/client-index.html";
    document.body.appendChild(iframe);
}