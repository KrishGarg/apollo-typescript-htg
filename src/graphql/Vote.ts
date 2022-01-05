import { ForbiddenError } from "apollo-server";
import { extendType, intArg, nonNull, objectType } from "nexus";

export const Vote = objectType({
  name: "Vote",
  definition(t) {
    t.nonNull.field("link", {
      type: "Link",
    });
    t.nonNull.field("user", {
      type: "User",
    });
  },
});

export const VoteMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("vote", {
      type: "Vote",
      args: {
        linkId: nonNull(intArg()),
      },
      async resolve(parent, args, ctx) {
        const { userId } = ctx;
        const { linkId } = args;

        if (!userId) {
          throw new ForbiddenError("Cannot vote without logging in.");
        }

        const link = await ctx.prisma.link.update({
          where: {
            id: linkId,
          },
          data: {
            voters: {
              connect: {
                id: userId,
              },
            },
          },
        });

        const user = await ctx.prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

        return {
          link,
          user: user!,
        };
      },
    });
  },
});
