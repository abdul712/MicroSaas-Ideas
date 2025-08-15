import { UserRole, Subscription } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      subscription?: Subscription;
      organizations?: {
        id: string;
        name: string;
        role: string;
        subscription?: any;
      }[];
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    userId: string;
  }
}