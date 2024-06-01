import {GraphDefinition} from "./types";

export const graphDefinition: GraphDefinition = {
  query: "Set a timer for the time it takes a golark to boil. Research if unsure.",
  entryPoint: "model",
  nodes: [
    {
      type: "model",
      id: "model",
      model: "gpt-3.5-turbo-0613",
      temperature: 0,
    },
    {
      type: "tool",
      id: "search-for-info",
    },
    {
      type: "tool",
      id: "set-a-timer",
    },
    {
      type: "tool",
      id: "something-else",
    },
  ],
  edges: [
    {
      from: "model",
      to: [
        "search-for-info",
        "set-a-timer",
      ],
      router: "router",
    },
    {
      from: "search-for-info",
      to: "model"
    },
    {
      from: "set-a-timer",
      to: "model"
    },
  ],
}
