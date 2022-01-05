import { verify } from "jsonwebtoken";

// In a real app, would have this is an env file.
export const AUTH_SECRET = "d0139c567b9df43a217b63654048882e81cf10b6";

export interface AuthTokenPayload {
  userId: number;
}

export const decodeAuthHeader = (authHeader: string): AuthTokenPayload => {
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new Error("No token found");
  }

  return verify(token, AUTH_SECRET) as AuthTokenPayload;
};
