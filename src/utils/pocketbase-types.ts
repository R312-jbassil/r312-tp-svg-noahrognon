export enum Collections {
    Svg = 'svgs',
    Users = 'users',
}

export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: Collections;
    expand?: Record<string, unknown>;
}

export interface ChatMessage {
    role: string;
    content: string;
}

export interface SvgRecord extends BaseRecord {
    name: string;
    code_svg: string;
    chat_history: ChatMessage[] | string | null;
    owner: string;
    is_public: boolean;
    likes_count: number;
}

export interface UserRecord extends BaseRecord {
    name?: string;
    username?: string;
    email: string;
    avatar?: string;
}
