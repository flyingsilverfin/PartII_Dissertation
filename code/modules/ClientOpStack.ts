

export default class ClinetOpStack {

    private opStack: any[];
    private opStackPointer;

    constructor() {
        this.opStack = [];
        this.opStackPointer = 0;
    }

    public push(op: any) {
        this.opStack[this.opStackPointer] = op; // javascript feature, arrays are just hasmaps
        this.opStackPointer++;
    }

    public back(): any {
        this.opStackPointer--;
        return this.opStack[this.opStackPointer];
    }

}