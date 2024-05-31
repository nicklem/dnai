import {GraphDefinition} from "./types";

export const graphDefinition: GraphDefinition = {
  models: [
    {
      id: "model",
      model: "gpt-3.5-turbo-0613",
      temperature: 0,
    }
  ],
  tools: [
    {
      id: "search-for-info",
    },
    {
      id: "set-a-timer",
    },
    {
      id: "something-else",
    },
  ],
  edges: [
    {
      from: "__start__",
      to: "model"
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
  conditionalEdges: [
    {
      from: "model",
      to: [
        "search-for-info",
        "set-a-timer",
      ],
      router: "router",
    }
  ]
}
