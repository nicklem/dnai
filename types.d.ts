import {BaseMessage} from "@langchain/core/messages";

export type NodeId = GraphDefinition["nodes"][number]["id"]

export type Node<T extends {} = {}> = {
    id: string;
} & T;

export type ModelNode = Node<{
    type: 'model'
    model: string;
    temperature: number;
}>;

export type ToolNode = Node<{
    type: 'tool'
}>;

export type Edge = {
    from: NodeId;
    to: NodeId;
}

export type ConditionalEdge = {
    from: NodeId;
    to: NodeId[];
    router: string;
}

export type InternalState = {
    __messages: BaseMessage[];
}

export type ReservedKeys = `__${string}`;

export type InitialState = Record<string, any> & {
    init__query: string;
} & {
    [k in ReservedKeys]?: never;
}

export type GraphDefinition = {
    initState: InitialState;
    entryPoint: NodeId;
    nodes: Array<ModelNode | ToolNode>;
    edges: Array<Edge | ConditionalEdge>;
}

