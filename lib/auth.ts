// NextAuth Configuration with Google OAuth and Guest Mode Support
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

// Validate required environment variables
const validateEnvVars = () => {
  const errors: string[] = [];
  
  if (!process.env.GOOGLE_CLIENT_ID) {
    errors.push('GOOGLE_CLIENT_ID');
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET');
  }
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET');
  }
  
  if (errors.length > 0) {
    console.error(`❌ MISSING required environment variables: ${errors.join(', ')}`);
    console.error('Please check your .env file and ensure all required variables are set.');
  }
  
  if (!process.env.NEXTAUTH_URL) {
    console.warn('⚠️ NEXTAUTH_URL not set. Using default (may cause issues in production).');
  }
  
  return errors.length === 0;
};

// Validate on module load
validateEnvVars();

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile"
        }
      }
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 Google Sign In attempt for:', user.email);
      
      // Validate user has email
      if (!user.email) {
        console.error('❌ No email provided by Google OAuth');
        return false;
      }
      
      try {
        // Check if user already exists
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          // Existing user - update their info if needed
          console.log('✓ Found existing user:', dbUser.id);
          
          // Update to authenticated user if they were a guest
          if (dbUser.isGuest) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                isGuest: false,
                name: user.name || dbUser.name,
                email: user.email,
                guestId: null,
              },
            });
            console.log('✓ Converted guest user to authenticated user');
          }
        } else {
          // New user - create account
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || 'User',
              isGuest: false,
            },
          });
          console.log('✓ Created new authenticated user:', dbUser.id);
        }
        
        return true;
      } catch (error) {
        console.error('❌ Database error during sign in:', error);
        return false;
      }
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log('🎫 JWT callback triggered:', trigger || 'initial');
      
      // On initial sign-in, add user data to token
      if (user && user.email) {
        token.email = user.email;
        token.name = user.name || undefined;
        
        try {
          // Fetch user from database to get the ID
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.isGuest = dbUser.isGuest;
            console.log('✓ JWT token enriched with user ID:', dbUser.id);
          } else {
            console.error('❌ User not found in database:', user.email);
            return token;
          }
        } catch (error) {
          console.error('❌ Error fetching user for JWT:', error);
          return token;
        }
      }
      
      // Ensure token always has user ID (recover if missing)
      if (!token.id && token.email) {
        console.warn('⚠️ Token missing ID, recovering from database...');
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.isGuest = dbUser.isGuest;
            console.log('✓ Recovered user ID:', dbUser.id);
          }
        } catch (error) {
          console.error('❌ Failed to recover user ID:', error);
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      console.log('📋 Session callback for:', token.email);
      
      // Populate session with user data from token
      if (session.user) {
        if (token.id) {
          session.user.id = token.id as string;
        }
        if (token.email) {
          session.user.email = token.email as string;
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
        
        console.log('✓ Session populated for user:', session.user.email);
      } else {
        console.error('❌ Session user object is missing');
      }
      
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
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
