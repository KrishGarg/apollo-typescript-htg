import { Prisma } from "@prisma/client";
import { ForbiddenError, UserInputError } from "apollo-server";
import {
  arg,
  enumType,
  extendType,
  inputObjectType,
  intArg,
  list,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "nexus";
import { NexusGenObjects } from "../../nexus-typegen";

export const Link = objectType({
  name: "Link",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("description");
    t.nonNull.string("url");
    t.nonNull.field("createdAt", {
      type: "DateTime",
    });
    t.field("postedBy", {
      type: "User",
      async resolve(parent, args, ctx) {
        return await ctx.prisma.link
          .findUnique({
            where: {
              id: parent.id,
            },
          })
          .postedBy();
      },
    });
    t.nonNull.list.nonNull.field("voters", {
      type: "User",
      async resolve(parent, args, ctx) {
        return await ctx.prisma.link
          .findUnique({
            where: {
              id: parent.id,
            },
          })
          .voters();
      },
    });
  },
});

export const Feed = objectType({
  name: "Feed",
  definition(t) {
    t.nonNull.list.nonNull.field("links", { type: Link });
    t.nonNull.int("count");
  },
});

export const LinksQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("feed", {
      type: "Feed",
      args: {
        filter: nullable(stringArg()),
        skip: nullable(intArg()),
        take: nullable(intArg()),
        orderBy: arg({ type: list(nonNull("LinkOrderByInput")) }),
      },
      async resolve(parent, args, ctx) {
        const where = args.filter
          ? {
              OR: [
                { description: { contains: args.filter } },
                { url: { contains: args.filter } },
              ],
            }
          : {};

        const links = await ctx.prisma.link.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.LinkOrderByWithRelationInput>
            | undefined,
        });

        const count = await ctx.prisma.link.count({ where });

        return {
          links,
          count,
        };
      },
    });
  },
});

export const CreateLinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("createPost", {
      type: "Link",
      args: {
        description: nonNull(stringArg()),
        url: nonNull(stringArg()),
      },
      async resolve(parent, args, ctx) {
        const { description, url } = args;
        const { userId } = ctx;

        if (!userId) {
          throw new ForbiddenError("Cannot post without logging in.");
        }

        const link = await ctx.prisma.link.create({
          data: {
            description,
            url,
            postedBy: { connect: { id: userId } },
          },
        });

        return link;
      },
    });
  },
});

export const GetLinkByIdQuery = extendType({
  type: "Query",
  definition(t) {
    t.nullable.field("link", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, args, ctx) {
        const { id } = args;

        const link = await ctx.prisma.link.findUnique({
          where: {
            id,
          },
        });

        return link;
      },
    });
  },
});

export const UpdateLinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("updateLink", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
        url: nullable(stringArg()),
        description: nullable(stringArg()),
      },
      async resolve(parent, args, ctx) {
        const { id, description, url } = args;

        if (!description && !url) {
          throw new UserInputError(
            "Neither the new description nor the new url was sent."
          );
        }

        let toUpdateFields: { description?: string; url?: string } = {};

        if (description) toUpdateFields["description"] = description;
        if (url) toUpdateFields["url"] = url;

        const updatedLink = await ctx.prisma.link.update({
          data: toUpdateFields,
          where: {
            id,
          },
        });

        return updatedLink;
      },
    });
  },
});

export const deleteLinkMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nullable.field("deleteLink", {
      type: "Link",
      args: {
        id: nonNull(intArg()),
      },
      async resolve(parent, args, ctx) {
        const { id } = args;

        const oldLink = await ctx.prisma.link.delete({
          where: {
            id,
          },
        });

        return oldLink;
      },
    });
  },
});

export const LinkOrderByInput = inputObjectType({
  name: "LinkOrderByInput",
  definition(t) {
    t.field("description", { type: Sort });
    t.field("url", { type: Sort });
    t.field("createdAt", { type: Sort });
  },
});

export const Sort = enumType({
  name: "Sort",
  members: ["asc", "desc"],
});
