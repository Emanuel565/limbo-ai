"use server";

import { currentUser } from "@clerk/nextjs/server";
import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;

const client = apiKey ? new SchematicClient({ apiKey }) : null;

export async function getTemporaryAccessToken() {
  const user = await currentUser();

  if (!user || !client) {
    return null;
  }

  const response = await client.accesstokens.issueTemporaryAccessToken({
    resourceType: "company",
    lookup: {
      id: user.id,
    },
  });

  return response.data.token;
}
