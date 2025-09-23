export enum Collections {
    Svg = "svgs",
}

export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: Collections;
}

export interface ChatMessage {
    role: string;
    content: string;
}

export interface SvgRecord extends BaseRecord {
    name: string;
    code_svg: string;
    chat_history: ChatMessage[] | string | null;
}
