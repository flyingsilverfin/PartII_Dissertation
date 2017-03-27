
export interface EditableTextInterface {
    insertCallback: InsertCallback
}

export type InsertCallback = (char: string, after: number) => void;

interface Test {
    isEnabled: () => void;
}
