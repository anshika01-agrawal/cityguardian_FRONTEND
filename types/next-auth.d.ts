import type { DefaultSession, DefaultUser, User as AuthUser } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'citizen' | 'employee' | 'admin';
      email: string;
      name: string;
      image?: string | null;
    };
    expires: string;
  }

  interface User {
    id: string;
    role: 'citizen' | 'employee' | 'admin';
    email: string;
    name: string;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'citizen' | 'employee' | 'admin';
    email: string;
    name: string;
    picture?: string;
    sub?: string;
  }
}