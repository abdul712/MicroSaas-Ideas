import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      organizationId?: string;
      organization?: {
        id: string;
        name: string;
        slug: string;
        planType: string;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: string;
    organizationId?: string;
    organization?: {
      id: string;
      name: string;
      slug: string;
      planType: string;
    };
  }
}