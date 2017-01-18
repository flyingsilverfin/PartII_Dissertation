export default class Time {


    private t: number;

    constructor() {
        this.t = 0;
    }

    public forward(dt): void {
        this.t += dt;
    }

    public time(): number {
        return this.t;
    }
}