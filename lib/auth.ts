// NextAuth Configuration with Guest Mode Support
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Guest user management
export async function createGuestUser(): Promise<{ id: string; guestId: string }> {
  const guestId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  const user = await prisma.user.create({
    data: {
      isGuest: true,
      guestId,
      name: 'Guest User',
    },
  });

  return {
    id: user.id,
    guestId: user.guestId!,
  };
}

export async function findGuestUser(guestId: string) {
  return await prisma.user.findUnique({
    where: { guestId },
  });
}
