import {GraphDefinition} from "./types";
import * as fs from "node:fs";

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

/**
 * If this file is run directly, save the graph definition to a file.
 */
if (require.main === module) {
  const toSave = {
    $schema: 'schema.json',
    ...graphDefinition,
  }
  console.log("Saving graph definition to graph.json");
  fs.writeFileSync("graph.json", JSON.stringify(toSave, null, 2));
}
