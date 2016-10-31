import * as IT from '../types/InterfaceTypes';

class EditableText implements IT.EditableTextInterface {
    private container: HTMLDivElement;
    private clientIdField: HTMLElement; // some sort of id field, might be a header
    private textarea: HTMLTextAreaElement;

    private id: string;

    public insertCallback = null;  //implements in interface

    constructor(parent: HTMLDivElement) {
        this.container = document.createElement('div');
        this.container.className = 'client-container';

        this.clientIdField = document.createElement('h2');
        this.clientIdField.className = 'client-id';

        this.textarea = document.createElement('textarea');
        this.textarea.className = 'client-textarea';

        this.container.appendChild(this.clientIdField);
        this.container.appendChild(this.textarea);

        parent.appendChild(this.container);

        this.textarea.addEventListener('onkeyup', this.keyUp);
    }

    public setId(id: string): void {
        this.clientIdField.innerHTML = id;
    }


    public setContent(text: string): void {
        this.textarea.value = text;
    }

    public setCursorPosition(pos: number): void {
        this.textarea.selectionStart = pos;
        this.textarea.selectionEnd = pos;
    }

    public getCursorPosition(): number {
        let selectionStart = this.textarea.selectionStart;
        let selectionEnd = this.textarea.selectionEnd;

        // ASSERT needed
        //  for now, require that selectionEnd === selectionStart

        return selectionStart;
    }

    private keyUp(event): void {

        let cursor = this.getCursorPosition();
        let content = this.getContent();

        /*
            important keycodes:
                8 - backspace
                46 - delete
        */

        let key = event.keyCode; 

        if (key === 8) {
            // how to retrieve what was deleted?
            // perhaps ask the original backing store?
            // but this is contained above in owner of this class...

            // TODO

            console.error('deletion not implemented yet');

        } else if (key === 46) {
            // TODO
            console.error('deletion not implemented yet');
        } else {
            let inserted = content[cursor-1];
            this.insertCallback(inserted, cursor - 1);
        }
    }

    private getContent(): string {
        return this.textarea.value;
    }
}

export default EditableText;