import { adminAuth } from "./firebase-admin";

export async function requireAuth(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization token");
  }

  //   if (!user.admin) {
  //     throw new Error("Admins only");
  //   }

  const token = authHeader.split("Bearer ")[1];

  const decodedToken = await adminAuth.verifyIdToken(token);

  return decodedToken; // contains uid, email, etc.
}
