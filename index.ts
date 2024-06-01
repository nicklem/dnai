import {config} from 'dotenv';
import {ChatOpenAI} from "@langchain/openai";
import {AIMessage, BaseMessage, HumanMessage} from "@langchain/core/messages";
import {END, START, StateGraph} from "@langchain/langgraph";
import {ToolNode as LCToolNode} from "@langchain/langgraph/prebuilt";
import {StructuredTool} from "@langchain/core/tools";
import {graphDefinition} from "./graph";
import {ConditionalEdge, Edge, InternalState, ModelNode, NodeId, ToolNode} from "./types";
import {makeDummySearch, makeDummyTimer} from "./dummy-tools";
import {BaseChatModel} from "@langchain/core/dist/language_models/chat_models";

config();

// TODO fix any

const router = (state: InternalState): string => {
    const messages = state.__messages;
    const toolCalls = (messages[messages.length - 1] as AIMessage).tool_calls ?? [];
    if(toolCalls.length) {
        const toolId = toolCalls[toolCalls.length - 1]?.name;
        console.log("Calling tool: ", toolId);
        return toolId;
    }
    return END;
}

const routers: Record<string, any> = {
    router,
}

function initTools(toolNodes: ToolNode[]) {
    const tools: Record<string, StructuredTool> = {};

    toolNodes.forEach(node => {
        const {id} = node;

        switch(id) {
            case "search-for-info":
                tools[id] = makeDummySearch(id);
                break;
            case "set-a-timer":
                tools[id] = makeDummyTimer(id);
                break;
        }
    });

    return tools;
}

function initModels(
    defModels: ModelNode[],
    tools: Record<string, StructuredTool>,
    toolsPerModel: Record<string, string[]>
) {
    const models: Record<string, BaseChatModel> = {};

    defModels.forEach(node => {
        const {model, id, temperature} = node;
        const boundTools = toolsPerModel[id].map(toolId => tools[toolId]);
        switch(model) {
            case "gpt-3.5-turbo-0613":
                let output = new ChatOpenAI({
                    model,
                    temperature,
                });
                if(boundTools.length) {
                    output = output.bindTools(boundTools) as ChatOpenAI;
                }
                models[id] = output;
                break;
        }
    });

    return models;
}

async function main() {
    const defModels = graphDefinition.nodes.filter(({type}) => type === "model") as ModelNode[];
    const defTools = graphDefinition.nodes.filter(({type}) => type === "tool") as ToolNode[];
    const defEdges = graphDefinition.edges.filter(({to}) => typeof to === "string") as Edge[];
    const defConditionalEdges = graphDefinition.edges.filter(({to}) => Array.isArray(to)) as ConditionalEdge[];

    const toolsPerModel = defConditionalEdges.reduce(
        (acc, edge) => {
            const prevTools = acc[edge.from] ?? [];
            const newTools = edge.to;
            const uniqueTools = new Set([...prevTools, ...newTools]);
            acc[edge.from] = Array.from(uniqueTools);
            return acc;
        },
        {} as Record<NodeId, NodeId[]>
    );

    const tools = initTools(defTools);
    const models = initModels(defModels, tools, toolsPerModel);

    const graph = new StateGraph<InternalState>({
        channels: {
            __messages: {
                value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
                default: () => [],
            },
        },
    });

    defModels.forEach((node: ModelNode) => {
        const model = models[node.id];
        if(!model) return;

        const modelNode = async (state: InternalState) => {
            return {__messages: [await model.invoke(state.__messages)]};
        };

        graph.addNode(node.id, modelNode);
    });

    defTools.forEach((node: ToolNode) => {
        const tool = tools[node.id];
        if(!tool) return;
        const baseToolNode = new LCToolNode<BaseMessage[]>([tool], node.id);

        const toolNode = async (state: InternalState): Promise<Partial<InternalState>> => {
            return { __messages: await baseToolNode.invoke(state.__messages) };
        };

        graph.addNode(node.id, toolNode);
    });

    graph.addEdge(START, graphDefinition.entryPoint as any);

    defEdges.forEach((edge: Edge) => {
        graph.addEdge(edge.from as any, edge.to as any);
    });

    defConditionalEdges.forEach(edge => {
        const from = edge.from as any;
        const router = routers[edge.router];

        graph.addConditionalEdges(from, router);
    });

    const runnable = graph.compile();

    const initialState: InternalState = Object.assign(
        {},
        graphDefinition.initState,
        {
            __messages: [new HumanMessage(graphDefinition.initState.init__query)]
        },
    )

    const response = await runnable.invoke(initialState);

    const reply = response.__messages[response.__messages.length - 1].content;

    console.log(`AI response: \`${reply}\``);
}

main();
