import { extendType, nonNull, objectType, stringArg } from "nexus";
import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { AUTH_SECRET } from "../utils/auth";
import { AuthenticationError } from "apollo-server";

export const AuthPayload = objectType({
  name: "AuthPayload",
  definition(t) {
    t.nonNull.string("token");
    t.nonNull.field("user", {
      type: "User",
    });
  },
});

export const SignupMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("signup", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
        name: nonNull(stringArg()),
      },
      async resolve(parent, args, ctx) {
        const { email, password, name } = args;

        const hashedPassword = await hash(password, 10);

        const user = await ctx.prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
          },
        });

        const token = sign(
          {
            userId: user.id,
          },
          AUTH_SECRET
        );

        return {
          token,
          user,
        };
      },
    });
  },
});

export const LoginMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("login", {
      type: "AuthPayload",
      args: {
        email: nonNull(stringArg()),
        password: nonNull(stringArg()),
      },
      async resolve(parent, args, ctx) {
        const { email, password } = args;

        const user = await ctx.prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (!user)
          throw new AuthenticationError("No user with the given email exists.");

        const isValid = await compare(password, user.password);

        if (!isValid) throw new AuthenticationError("Invalid Password.");

        const token = sign(
          {
            userId: user.id,
          },
          AUTH_SECRET
        );

        return {
          token,
          user,
        };
      },
    });
  },
});
