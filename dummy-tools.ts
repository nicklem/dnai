import {DynamicStructuredTool} from "@langchain/core/tools";
import * as z from "zod";

export function makeDummySearch(id: string) {
    return new DynamicStructuredTool({
        name: "search-for-info",
        description: "Searches for information on the web.",
        schema: z.object({
            query: z.string().describe("The query to search for."),
        }),
        func: async ({query}) => "It takes 42 minutes to boil a golark.",
    })
}

export function makeDummyTimer(id: string) {
    return new DynamicStructuredTool({
        name: "set-a-timer",
        description: "Sets a timer.",
        schema: z.object({
            time: z.number().describe("The time in minutes to set the timer for."),
        }),
        func: async ({time}) => "Timer set.",
    })
}
