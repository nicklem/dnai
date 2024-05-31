import {START} from "@langchain/langgraph";

export type NodeId =
    GraphDefinition["tools"][number]["id"]
    | GraphDefinition["models"][number]["id"]
    | typeof START;

export type Node<T extends {} = {}> = {
    id: string;
} & T;

export type ModelNode = Node<{
    model: string;
    temperature: number;
}>;

export type ToolNode = Node;

export type Edge = {
    from: NodeId;
    to: NodeId;
}

export type ConditionalEdge = {
    from: NodeId;
    to: NodeId[];
    router?: string;
}

export type GraphDefinition = {
    models: ModelNode[];
    tools: ToolNode[];
    edges: Edge[];
    conditionalEdges: ConditionalEdge[];
}

