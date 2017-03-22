import * as T from '../types/Types';
import * as IT from '../types/InterfaceTypes';

import {insertIntoString, deleteAt} from './Helper';


class EditableText implements IT.EditableTextInterface {
    private container: HTMLDivElement;
    private clientIdField: HTMLElement; // some sort of id field, might be a header
    private textarea: HTMLTextAreaElement;

    private id: string;

    private preChangeTextLength: number  = 0;
    private currentCursorPosition: number = 0;

    private optimized: boolean;
    private movementDirection = 0;

    public insertCallback = null;   //implements in interface
    public deleteCallback = null;
    public commitCallback = null;   // for word insert optimization

    constructor(parent: HTMLDivElement, optimized=false) {
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
        this.textarea.addEventListener('input', this.oninput.bind(this));
        this.textarea.addEventListener('focus', this.onfocus.bind(this));
        this.textarea.addEventListener('onblur', this.onblur.bind(this));

        this.currentCursorPosition = 0;
        this.optimized = optimized;
    }

    public setId(id: T.ClientId): void {
        this.clientIdField.innerHTML = id.toString();
    }


    public setContent(text: string): void {
        this.textarea.value = text;
        this.setDirection(0);   // force client to commit it's own changes immediately
    }

    public incrementCursorPosition(n?:number): void {
        if (n === undefined) {
            n = 1;
        }
        this.currentCursorPosition += n

        this.setDirection(n);

        
        this.textarea.selectionStart = this.currentCursorPosition;
        this.textarea.selectionEnd = this.currentCursorPosition;
    }

    public decrementCursorPosition(n?:number): void {
        if (n === undefined) {
            n = 1;
        } 
        this.currentCursorPosition -= n;

        this.setDirection(-n);

        this.textarea.selectionStart = this.currentCursorPosition;
        this.textarea.selectionEnd = this.currentCursorPosition;
    }

    public onblur(event): void {
        this.setDirection(0);
    }


    /*
        Direction tracking, only relevant if implementing word insert optimization
    */
    private setDirection(n: number) {
        if (!this.optimized) {
            return;
        }

        // if lose focus, direction changes (ie insert -> delete or delete -> insert)
        // then the client should commit
        if (n === 0 || this.movementDirection != n) {
            this.commitCallback();
        }

        this.movementDirection = n;
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
        //  let cursor = this.textareaCursorPosition();
        this.currentCursorPosition = this.textareaCursorPosition();
    }

    public mockInsert(chars: string, after: number): void {
        console.log('mock insert');
        debugger

        let content = this.getContent();

        if (after > content.length) {
            console.error('Cannot do mock insert at: ' + after + ', content is not that long');
            return;
        }
    
        // insert 
        content = insertIntoString(chars, after, content);

        this.setContent(content);
        this.setCursorPosition(after + chars.length);

        this.insertCallback(chars, after, true);
    }

    public mockDelete(index: number): void {
        let content = this.getContent();

        // TODO check >= is correct
        if (index >= content.length) {
            console.error('Cannot do mock delete at: ' + index + ', content is not that long');
            return;
        }
        
        content = deleteAt(content, index);

        this.setContent(content);
        this.setCursorPosition(index);

        this.deleteCallback(index);
        
    }

    private oninput(event): void {

        let textareaCursor = this.textareaCursorPosition();
        let content = this.getContent();

        // if cursor has not changed position:
        if (textareaCursor === this.currentCursorPosition) {
            this.setDirection(-1);
            this.deleteCallback(textareaCursor + 1);
        } else if (textareaCursor <= this.currentCursorPosition - 1) {
            if (textareaCursor < this.currentCursorPosition - 1) {
                console.error('Deleting more than 1 character at a time is currently not supported');
                this.setCursorPosition(textareaCursor);
                return;
            }
            this.decrementCursorPosition();
            this.deleteCallback(textareaCursor+1);  // cursor is now at position left of where the char was
        } else {
            // must have been 1 or more insert
            if (this.preChangeTextLength > this.getContent().length + 1) {
                console.error('Inserting more than 1 character a time currently not supported');
                this.setCursorPosition(textareaCursor);
                return;
            }
            let inserted = content[textareaCursor-1];
            console.log('[Debug] inserted char ' + inserted + ' at position ' + (textareaCursor-1));

            this.incrementCursorPosition();
            this.insertCallback(inserted, textareaCursor - 1);
        }

        // in all cases the currentCursorPosition should be updated!
    }

    private getContent(): string {
        return this.textarea.value;
    }
}

export default EditableText;