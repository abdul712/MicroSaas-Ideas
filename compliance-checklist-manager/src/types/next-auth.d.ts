import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      organizationId: string;
      permissions: string[];
      department?: string | null;
      organization: {
        id: string;
        name: string;
        industry: string;
        size: string;
        location: string;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    organizationId: string;
    permissions: string[];
    department?: string | null;
    organization: {
      id: string;
      name: string;
      industry: string;
      size: string;
      location: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    organizationId: string;
    permissions: string[];
    department?: string | null;
    organization: {
      id: string;
      name: string;
      industry: string;
      size: string;
      location: string;
    };
  }
}