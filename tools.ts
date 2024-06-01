import {DynamicStructuredTool} from "@langchain/core/tools";
import * as z from "zod";

function dummySearchForInfo() {
    return new DynamicStructuredTool({
        name: "dummySearchForInfo",
        description: "Searches for information on the web.",
        schema: z.object({
            query: z.string().describe("The query to search for."),
        }),
        func: async ({query}) => "It takes 42 minutes to boil a golark.",
    })
}

function dummySetATimer() {
    return new DynamicStructuredTool({
        name: "dummySetATimer",
        description: "Sets a timer.",
        schema: z.object({
            time: z.number().describe("The time in minutes to set the timer for."),
        }),
        func: async ({time}) => "Timer set.",
    })
}

const toolFactories: Record<string, () => DynamicStructuredTool> = {
    dummySearchForInfo,
    dummySetATimer,
}

export default toolFactories;
