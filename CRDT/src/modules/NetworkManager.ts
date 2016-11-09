import NetworkInterface from './NetworkInterface';

class NetworkManager {

    private id = 0;
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

    public getId(): number {
        this.id++;
        return this.id - 1;
    }
}

export default NetworkManager;