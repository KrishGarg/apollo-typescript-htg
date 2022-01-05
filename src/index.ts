import { ApolloServer } from "apollo-server";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import type { GraphQLSchema } from "graphql";

import { schema } from "./schema";
import { context } from "./context";

export const server = new ApolloServer({
  schema: schema as unknown as GraphQLSchema,
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
  context,
  debug: false,
});

const port = 3000;

server.listen({ port }).then(({ url }) => {
  console.info(`Server is ready at ${url}`);
});
