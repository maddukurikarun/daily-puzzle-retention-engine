# Authentication Flows Documentation

## Overview

This application supports two authentication methods:
1. **Google OAuth** - For users who want to sync across devices
2. **Guest Mode** - For quick anonymous play with local storage

---

## 🔐 Google OAuth Flow

### How It Works

```
User clicks "Continue with Google"
    ↓
handleGoogleLogin() in page.tsx
    ↓
signIn('google', { callbackUrl, redirect: true })
    ↓
NextAuth redirects to Google OAuth
    ↓
User authenticates with Google
    ↓
Google redirects back with OAuth code
    ↓
NextAuth callbacks execute in order:
    1. signIn callback (lib/auth.ts)
       - Validates email exists
       - Checks if user exists in database
       - Creates new user OR updates existing user
       - Returns true (success) or false (failure)
    
    2. jwt callback (lib/auth.ts)
       - Adds user data to JWT token
       - Fetches user ID from database
       - Stores: id, email, name, isGuest in token
    
    3. session callback (lib/auth.ts)
       - Populates session object with token data
       - Makes user data available to useSession() hook
    ↓
NextAuth redirects to callbackUrl (home page)
    ↓
useSession() hook detects session change
    ↓
useEffect in page.tsx runs (session change detected)
    ↓
handleAuthSession() executes:
    - Initializes IndexedDB
    - Extracts user data from session
    - Saves user to IndexedDB (offline access)
    - Loads user data (streaks, activities)
    - Sets user state → UI updates
    ↓
User is logged in and can play!
```

### Key Files

- **[lib/auth.ts](lib/auth.ts)** - NextAuth configuration with callbacks
- **[app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts)** - NextAuth API route handler
- **[app/page.tsx](app/page.tsx)** - Frontend logic and UI

### Code Flow

#### 1. User Clicks Button
```typescript
// app/page.tsx
async function handleGoogleLogin() {
  console.log('🔐 Initiating Google Sign-In...');
  
  const result = await signIn('google', { 
    callbackUrl: window.location.origin,
    redirect: true,
  });
}
```

#### 2. NextAuth Callbacks Execute
```typescript
// lib/auth.ts

// CALLBACK 1: signIn - validates and creates/updates user
async signIn({ user, account, profile }) {
  if (!user.email) return false;
  
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  });
  
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { email, name, isGuest: false }
    });
  }
  
  return true; // Allow sign in
}

// CALLBACK 2: jwt - enriches token with database ID
async jwt({ token, user }) {
  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });
    
    token.id = dbUser.id;
    token.email = user.email;
    token.name = user.name;
  }
  
  return token;
}

// CALLBACK 3: session - populates session from token
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id;
    session.user.email = token.email;
    session.user.name = token.name;
  }
  
  return session;
}
```

#### 3. Frontend Detects Session
```typescript
// app/page.tsx

// useSession() hook provides current session state
const { data: session, status } = useSession();

// React effect watches for session changes
useEffect(() => {
  if (status === 'loading') return;
  
  async function handleAuthSession() {
    await db.initDB();
    
    if (session?.user?.email) {
      // User authenticated - save to IndexedDB
      const authUser = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        isGuest: false,
      };
      
      await db.saveUser(authUser);
      setUser(authUser);
      await loadUserData(authUser);
    }
  }
  
  handleAuthSession();
}, [session, status]);
```

---

## 🎮 Guest Mode Flow

### How It Works

```
User clicks "Play as Guest"
    ↓
handleGuestLogin() in page.tsx
    ↓
POST request to /api/guest
    ↓
API handler (app/api/guest/route.ts):
    - Calls createGuestUser() from lib/auth.ts
    - Generates unique guest ID
    - Creates user in database with isGuest: true
    - Returns user data (id, guestId)
    ↓
Response received in handleGuestLogin()
    ↓
Guest user object created:
    - id: database ID
    - guestId: unique guest identifier
    - isGuest: true
    - name: 'Guest User'
    ↓
User saved to IndexedDB (db.saveUser)
    ↓
User state updated (setUser)
    ↓
Load user data (loadUserData)
    ↓
User can play!
```

### Key Files

- **[app/api/guest/route.ts](app/api/guest/route.ts)** - Guest user creation API
- **[lib/auth.ts](lib/auth.ts)** - createGuestUser() function
- **[app/page.tsx](app/page.tsx)** - Frontend logic and UI

### Code Flow

#### 1. User Clicks Button
```typescript
// app/page.tsx
async function handleGuestLogin() {
  console.log('🎮 Creating guest user...');
  
  // Call API to create guest user
  const response = await fetch('/api/guest', {
    method: 'POST',
  });
  
  const data = await response.json();
  
  // Create guest user object
  const guestUser = {
    id: data.user.id,
    guestId: data.user.guestId,
    isGuest: true,
    name: 'Guest User',
  };
  
  // Save to IndexedDB
  await db.saveUser(guestUser);
  setUser(guestUser);
  await loadUserData(guestUser);
}
```

#### 2. API Creates Guest User
```typescript
// app/api/guest/route.ts
export async function POST(req: NextRequest) {
  try {
    const guest = await createGuestUser();
    
    return NextResponse.json({
      success: true,
      user: {
        id: guest.id,
        guestId: guest.guestId,
        isGuest: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    );
  }
}
```

#### 3. Helper Function in auth.ts
```typescript
// lib/auth.ts
export async function createGuestUser() {
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
```

---

## 🔄 Key Differences

| Feature | Google OAuth | Guest Mode |
|---------|--------------|------------|
| **Redirect** | Yes (to Google, then back) | No (stays on page) |
| **Database** | Creates user with email | Creates user with guestId |
| **Session** | NextAuth session (JWT) | Local state only |
| **Sync** | Syncs across devices | Local only |
| **API Calls** | NextAuth handles | Single POST to /api/guest |
| **Callbacks** | 3 callbacks (signIn, jwt, session) | Direct response |
| **State Management** | useSession() hook | useState() |

---

## 🛠️ Environment Variables Required

For Google OAuth to work, you need:

```env
# Google OAuth Credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

Guest mode works without any environment variables.

---

## 📱 User Experience

### Google OAuth
1. Click "Continue with Google"
2. Redirected to Google login page
3. Authenticate with Google account
4. Redirected back to app
5. Logged in automatically

### Guest Mode
1. Click "Play as Guest"
2. Instant - no redirect
3. Start playing immediately

---

## 🔍 Debugging Tips

### Check Google OAuth
```bash
# Check environment variables
Get-Content .env | Select-String "GOOGLE|NEXTAUTH"

# Monitor console logs
# Look for these messages:
# 🔐 Google Sign In attempt for: [email]
# ✓ Created new authenticated user: [id]
# ✓ JWT token enriched with user ID: [id]
# ✓ Session populated for user: [email]
# ✓ Authenticated user setup complete
```

### Check Guest Mode
```bash
# Monitor console logs
# Look for these messages:
# 🎮 Creating guest user...
# ✓ Guest user created: [id]
# ✓ Guest user setup complete
```

---

## 📚 Related Documentation

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth Setup Guide](SETUP_GUIDE.md)
- [Database Schema](prisma/schema.prisma)
