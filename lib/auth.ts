import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "skip",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "skip",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      try {
        const admin = supabaseAdmin();
        const { data } = await admin.from("profiles").select("id").eq("email", user.email).single();
        if (!data) {
          await admin.from("profiles").insert({
            id: user.id, email: user.email, name: user.name, avatar: user.image, plan: "free",
          });
        }
      } catch { /* non-fatal */ }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
        try {
          const admin = supabaseAdmin();
          const { data } = await admin.from("profiles").select("plan").eq("id", token.sub).single();
          if (data) (session.user as { plan?: string }).plan = data.plan;
        } catch { /* non-fatal */ }
      }
      return session;
    },
  },
  pages: { signIn: "/" },
};
