import {config} from 'dotenv';
import {ChatOpenAI} from "@langchain/openai";
import {AIMessage, BaseMessage, HumanMessage} from "@langchain/core/messages";
import {END, MessageGraph} from "@langchain/langgraph";
import {ToolNode as LCToolNode} from "@langchain/langgraph/prebuilt";
import {StructuredTool} from "@langchain/core/tools";
import {graphDefinition} from "./graph";
import {ModelNode, ToolNode} from "./types";
import {makeDummySearch, makeDummyTimer} from "./dummy-tools";

config();

// TODO fix any

const router = (state: BaseMessage[]) => {
    const toolCalls = (state[state.length - 1] as AIMessage).tool_calls ?? [];
    if(toolCalls.length) {
        const toolId = toolCalls[toolCalls.length - 1]?.name;
        console.log("Calling tool: ", toolId);
        return toolId;
    }
    return END;
}

const routers: Record<string, any> = {
    router,
    __default: router
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
    modelNodes: ModelNode[],
    tools: Record<string, StructuredTool>,
    toolsPerModel: Record<string, string[]>
) {
    const models: Record<string, any> = {};

    modelNodes.forEach(node => {
        const {model, id, temperature} = node;
        const boundTools = toolsPerModel[id].map(toolId => tools[toolId]);
        switch(model) {
            case "gpt-3.5-turbo-0613":
                let output: any = new ChatOpenAI({
                    model,
                    temperature,
                });
                if(boundTools.length) {
                    output = output.bindTools(boundTools);
                }
                models[id] = output;
                break;
        }
    });

    return models;
}

async function main() {
    const toolsPerModel = graphDefinition.conditionalEdges.reduce((acc, edge) => {
        acc[edge.from] = edge.to;
        return acc;
    }, {} as Record<string, string[]>);

    const tools = initTools(graphDefinition.tools);
    const models = initModels(graphDefinition.models, tools, toolsPerModel);

    const graph = new MessageGraph();

    graphDefinition.models.forEach((node: ModelNode) => {
        const model = models[node.id];
        if(!model) return;
        const modelNode = async (state: BaseMessage[]) => {
            const response = await model.invoke(state);
            return [response];
        }

        graph.addNode(node.id, modelNode);
    });

    graphDefinition.tools.forEach((node: ToolNode) => {
        const tool = tools[node.id];
        if(!tool) return;
        const toolNode = new LCToolNode<BaseMessage[]>([tool], node.id);

        graph.addNode(node.id, toolNode);
    });

    graphDefinition.edges.forEach((edge: any) => {
        graph.addEdge(edge.from, edge.to);
    });

    graphDefinition.conditionalEdges.forEach(edge => {
        const from = edge.from as any;
        const router = routers[edge.router ?? "__default"];

        graph.addConditionalEdges(from, router);
    });

    const runnable = graph.compile();

    const response = await runnable.invoke([new HumanMessage(
        "Set a timer for the time it takes a golark to boil. Feel free to search for more information."
    )]);

    console.log(`AI response: \`${(response[response.length - 1] as AIMessage).content}\``);
}

main();
