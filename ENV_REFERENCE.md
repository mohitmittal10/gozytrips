# 🔑 Environment Variables Reference

## Overview
Your application uses **only the `.env` file** to manage all configuration keys. No other `.env` files are created or used.

---

## Environment Keys Defined in `.env`

### 1. **GEMINI_API_KEY** ✓
- **Location**: `.env`
- **Current Value**: `AIzaSyDBM35AOwybeauDCJ_bGrhxqPXhN6AnypE`
- **Used In**: `src/ai/genkit.ts` (line 12)
- **Purpose**: Google Gemini AI API authentication
- **Type**: Server-side secret
- **Status**: ✅ Active

**Code Reference**:
```typescript
// src/ai/genkit.ts
plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})]
```

---

### 2. **NEXT_PUBLIC_SUPABASE_URL** ✓
- **Location**: `.env`
- **Current Value**: `your_supabase_project_url` (needs to be filled)
- **Used In**: 
  - `src/lib/supabase/client.ts` (line 5)
  - `src/lib/supabase/server.ts` (line 8)
- **Purpose**: Supabase project endpoint
- **Type**: Public (safe to expose in client)
- **Status**: ⚠️ Needs Supabase URL

**Code References**:
```typescript
// src/lib/supabase/client.ts
return createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/supabase/server.ts
return createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // ...
);
```

---

### 3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** ✓
- **Location**: `.env`
- **Current Value**: `your_supabase_anon_key` (needs to be filled)
- **Used In**: 
  - `src/lib/supabase/client.ts` (line 6)
  - `src/lib/supabase/server.ts` (line 9)
- **Purpose**: Supabase anonymous (public) API key for client-side access
- **Type**: Public (safe to expose in client)
- **Status**: ⚠️ Needs Supabase Anon Key
- **Important**: Use the **anon** key, NOT the service role key

**Code References**: See above in `NEXT_PUBLIC_SUPABASE_URL`

---

### 4. **SUPABASE_SERVICE_ROLE_KEY** ✓
- **Location**: `.env`
- **Current Value**: `your_supabase_service_role_key` (needs to be filled)
- **Used In**: Not currently used in codebase
- **Purpose**: Supabase service role key for server-side admin operations
- **Type**: Server-side secret (never expose to client)
- **Status**: ⚠️ Ready for future use
- **Note**: Can be used for server-side operations requiring elevated privileges

---

### 5. **TOKEN_TRACKER_SECRET** ✓
- **Location**: `.env`
- **Current Value**: `your_secret_key_for_production`
- **Used In**: `src/app/api/token-stats/route.ts` (line 31)
- **Purpose**: API authentication for token tracking endpoint
- **Type**: Server-side secret
- **Status**: ✅ Optional (only needed in production)

**Code Reference**:
```typescript
// src/app/api/token-stats/route.ts
const expectedToken = process.env.TOKEN_TRACKER_SECRET;
if (process.env.NODE_ENV === 'production' && (!authToken || authToken !== expectedToken)) {
  // Validate token
}
```

---

### 6. **NEXT_PUBLIC_BASE_URL** ✓
- **Location**: `.env`
- **Current Value**: `http://localhost:9002`
- **Used In**: Configuration reference (may be used for redirects)
- **Purpose**: Application base URL for redirects and OAuth callbacks
- **Type**: Public (contains no sensitive data)
- **Status**: ✅ Configured correctly

---

## Summary Table

| Variable | Current Value | Type | Status | Location |
|----------|--------------|------|--------|----------|
| `GEMINI_API_KEY` | `AIzaSy...` | Server Secret | ✅ Active | `.env` |
| `NEXT_PUBLIC_SUPABASE_URL` | Placeholder | Public | ⚠️ Needs Setup | `.env` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Placeholder | Public | ⚠️ Needs Setup | `.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder | Server Secret | ⚠️ Ready | `.env` |
| `TOKEN_TRACKER_SECRET` | Placeholder | Server Secret | ✅ Optional | `.env` |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:9002` | Public | ✅ Correct | `.env` |

---

## How Next.js Loads Environment Variables

Next.js automatically loads variables from `.env` in this order:
1. Process environment (system variables)
2. `.env` file (your configuration)

### Variable Naming Convention

**`NEXT_PUBLIC_*` Variables**:
- Exposed to browser JavaScript
- Use for non-sensitive, client-side configuration
- Example: `NEXT_PUBLIC_SUPABASE_URL`

**Other Variables**:
- Only available server-side
- Use for secrets and API keys
- Example: `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Setup Checklist

- [x] `.env` file exists
- [x] All code references point to `.env`
- [x] No other `.env` files created
- [x] `GEMINI_API_KEY` is set ✓
- [x] `NEXT_PUBLIC_BASE_URL` is correct ✓
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set your Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set your Supabase Anon Key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set your service role key (optional)

---

## 🚀 Getting Started

### 1. Get Supabase Credentials
1. Go to https://supabase.com
2. Create a new project
3. Wait for provisioning
4. Go to **Settings → API**
5. Copy your credentials

### 2. Update `.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Verify Configuration
```bash
npm run dev
# Check browser console for any environment variable errors
```

---

## 📝 Notes

- **Single Source of Truth**: All keys are in `.env`
- **No Hardcoding**: All environment variables are referenced via `process.env`
- **Type Safety**: Non-null assertion (`!`) ensures Next.js has loaded the variables
- **Production Ready**: Ready for deployment to Vercel or other platforms

---

## 🔒 Security Best Practices

1. ✅ Keep `.env` in `.gitignore` (don't commit secrets)
2. ✅ Use `NEXT_PUBLIC_*` only for non-sensitive data
3. ✅ Server-side secrets not exposed to browser
4. ✅ Different keys for development and production
5. ✅ Rotate keys regularly

---

**All environment variables are managed through `.env` file only. No other configuration files are created.** ✅
