import NetworkInterface from './NetworkInterface';

class NetworkManager {

    private clients: NetworkInterface[];
    constructor() {
        this.clients = [];
    }

    public register(client: NetworkInterface) {
        this.clients.push(client);
    }

    // just send it to all the other registered clients
    public broadcast(sender: NetworkInterface, packet) {
        console.log(this.clients);
        for (let client of this.clients) {
            if (client === sender) {
                continue;
            }
            client.receive(packet);
        }
    }
}

export default NetworkManager;