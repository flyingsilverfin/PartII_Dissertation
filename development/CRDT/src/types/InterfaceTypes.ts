
export interface EditableTextInterface {
    insertCallback: InsertCallback
}

export type InsertCallback = (char: string, after: number) => void;
