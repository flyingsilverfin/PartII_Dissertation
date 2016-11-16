import * as IT from '../types/InterfaceTypes';

class EditableText implements IT.EditableTextInterface {
    private container: HTMLDivElement;
    private clientIdField: HTMLElement; // some sort of id field, might be a header
    private textarea: HTMLTextAreaElement;

    private id: string;

    private preChangeTextLength: number  = 0;
    private currentCursorPosition: number = 0;

    public insertCallback = null;  //implements in interface
    public deleteCallback = null;

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

        this.textarea.addEventListener('keydown', this.keydown.bind(this));
        // this.textarea.addEventListener('keyup', this.keyUp.bind(this));
        this.textarea.addEventListener('input', this.oninput.bind(this));
        this.textarea.addEventListener('focus', this.onfocus.bind(this));

        this.currentCursorPosition = 0;
    }

    public setId(id: string): void {
        this.clientIdField.innerHTML = id;
    }


    public setContent(text: string): void {
        this.textarea.value = text;
    }

    public incrementCursorPosition(): void {
        this.currentCursorPosition += 1;
        this.textarea.selectionStart = this.currentCursorPosition;
        this.textarea.selectionEnd = this.currentCursorPosition;
    }

    public decrementCursorPosition(): void {
        this.currentCursorPosition -= 1;
        this.textarea.selectionStart = this.currentCursorPosition;
        this.textarea.selectionEnd = this.currentCursorPosition;
    }


    private setCursorPosition(pos: number): void {
        this.currentCursorPosition = pos;
        this.textarea.selectionStart = pos;
        this.textarea.selectionEnd = pos;
    }

    public getCursorPosition(): number {
        return this.currentCursorPosition;
    }

    private textareaCursorPosition(): number {
        // ASSERT needed
        //  require that selectionEnd === selectionStart
        let selectionStart = this.textarea.selectionStart;
        let selectionEnd = this.textarea.selectionEnd;

        return selectionStart;
    }

    private getTextLength(): number {
        return this.textarea.value.length;
    }

    private onfocus(event): void {
        this.textarea.selectionStart = this.currentCursorPosition;
        this.textarea.selectionEnd = this.currentCursorPosition;
    }

    private keydown(event): void {
        console.log('updating onkeydown pre-change values');
        this.preChangeTextLength = this.getTextLength();
        this.currentCursorPosition = this.textareaCursorPosition();
    }

    // private keyUp(event): void {

    //     /*
    //         HAHAHA this doesn't work on keys held down!
    //     */


    //     console.log('[Debug] keyup detected')

    //     // the most comprehensive thing I can think of for 

    //     let cursor = this.getCursorPosition();

    //     // if a key was pressed that had no effect we can ignore it
    //     if (this.getTextLength() === this.preChangeTextLength) {
    //         return;
    //     }

    //     let content = this.getContent();

    //     /*
    //         important keycodes:
    //             8 - backspace
    //             46 - delete
    //     */

    //     let key = event.keyCode; 

    //     if (key === 8) {
    //         // how to retrieve what was deleted?
    //         // perhaps ask the original backing store?
    //         // but this is contained above in owner of this class...

    //         // TODO

    //         console.error('deletion not implemented yet');

    //     } else if (key === 46) {
    //         // TODO
    //         console.error('deletion not implemented yet');
    //     } else {
    //         let inserted = content[cursor-1];
    //         console.log('[Debug] inserted char ' + inserted + ' at position ' + (cursor-1));
    //         this.insertCallback(inserted, cursor - 1);
    //     }
    // }

    private oninput(event): void {
        debugger;

        let textareaCursor = this.textareaCursorPosition();
        let content = this.getContent();

        // if cursor has not changed position:
        if (textareaCursor === this.currentCursorPosition) {
            this.deleteCallback(textareaCursor + 1)
        } else if (textareaCursor <= this.currentCursorPosition - 1) {
            if (textareaCursor < this.currentCursorPosition - 1) {
                console.error('Deleting more than 1 character at a time is currently not supported');
                this.setCursorPosition(textareaCursor);
                return;
            }
            this.currentCursorPosition--;
            this.deleteCallback(textareaCursor+1)  // cursor is now at position left of where the char was
        } else {
            // must have been 1 or more insert
            if (this.preChangeTextLength > this.getContent().length + 1) {
                console.error('Inserting more than 1 character a time currently not supported');
                this.setCursorPosition(textareaCursor);
                return;
            }
            let inserted = content[textareaCursor-1];
            console.log('[Debug] inserted char ' + inserted + ' at position ' + (textareaCursor-1));
            this.currentCursorPosition++;
            this.insertCallback(inserted, textareaCursor - 1);
        }

        // in all cases the currentCursorPosition should be updated!
    }

    private getContent(): string {
        return this.textarea.value;
    }
}

export default EditableText;