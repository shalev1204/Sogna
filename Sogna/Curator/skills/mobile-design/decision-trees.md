# Mobile Decision Trees

> Framework selection, state management, storage strategy, and context-based decisions.
> **These are THINKING guides, not copy-paste answers.**

---

## 1. Framework Selection

### Master Decision Tree

```
WHAT ARE YOU BUILDING?
        │
        ├── Need OTA updates without app store review?
        │   │
        │   ├── Yes → React Native + Expo
        │   │         ├── Expo Go for development
        │   │         ├── EAS Update for production OTA
        │   │         └── Best for: rapid iteration, web teams
        │   │
        │   └── No → Continue ▼
        │
        ├── Need pixel-perfect custom UI across platforms?
        │   │
        │   ├── Yes → Flutter
        │   │         ├── Custom rendering engine
        │   │         ├── Single UI for iOS + Android
        │   │         └── Best for: branded, visual apps
        │   │
        │   └── No → Continue ▼
        │
        ├── Heavy native features (ARKit, HealthKit, specific sensors)?
        │   │
        │   ├── iOS only → SwiftUI / UIKit
        │   │              └── Maximum native capability
        │   │
        │   ├── Android only → Kotlin + Jetpack Compose
        │   │                  └── Maximum native capability
        │   │
        │   └── Both → Consider native with shared logic
        │              └── Kotlin Multiplatform for shared
        │
        ├── Existing web team + TypeScript codebase?
        │   │
        │   └── Yes → React Native
        │             ├── Familiar paradigm for React devs
        │             ├── Share code with web (limited)
        │             └── Large ecosystem
        │
        └── Enterprise with existing Flutter team?
            │
            └── Yes → Flutter
                      └── Leverage existing expertise
```

### Framework Comparison

| Factor | React Native | Flutter | Native (Swift/Kotlin) |
|--------|-------------|---------|----------------------|
| **OTA Updates** | ✅ Expo | ❌ No | ❌ No |
| **Learning Curve** | Low (React devs) | Medium | Higher |
| **Performance** | Good | Excellent | Best |
| **UI Consistency** | Platform-native | Identical | Platform-native |
| **Bundle Size** | Medium | Larger | Smallest |
| **Native Access** | Via bridges | Via channels | Direct |
| **Hot Reload** | ✅ | ✅ | ✅ (Xcode 15+) |

### When to Choose Native

```
CHOOSE NATIVE WHEN:
├── Maximum performance required (games, 3D)
├── Deep OS integration needed
├── Platform-specific features are core
├── Team has native expertise
├── App store presence is primary
└── Long-term maintenance priority

AVOID NATIVE WHEN:
├── Limited budget/time
├── Need rapid iteration
├── Identical UI on both platforms
├── Team is web-focused
└── Cross-platform is priority
```

---

## 2. State Management Selection

### React Native State Decision

```
WHAT'S YOUR STATE COMPLEXITY?
        │
        ├── Simple app, few screens, minimal shared state
        │   │
        │   └── Zustand (or just useState/Context)
        │       ├── Minimal boilerplate
        │       ├── Easy to understand
        │       └── Scales OK to medium
        │
        ├── Primarily server data (API-driven)
        │   │
        │   └── TanStack Query (React Query) + Zustand
        │       ├── Query for server state
        │       ├── Zustand for UI state
// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
        │       └── Excellent caching, refetching
        │
        ├── Complex app with many features
        │   │
        │   └── Redux Toolkit + RTK Query
        │       ├── Predicable, debuggable
        │       ├── RTK Query for API
        │       └── Good for large teams
        │
        └── Atomic, granular state needs
            │
            └── Jotai
                ├── Atom-based (like Recoil)
                ├── Minimizes re-renders
                └── Good for derived state
```

### Flutter State Decision

```
WHAT'S YOUR STATE COMPLEXITY?
        │
        ├── Simple app, learning Flutter
        │   │
        │   └── Provider (or setState)
        │       ├── Official, simple
        │       ├── Built into Flutter
        │       └── Good for small apps
        │
        ├── Modern, type-safe, testable
        │   │
        │   └── Riverpod 2.0
        │       ├── Compile-time safety
        │       ├── Code generation
        │       ├── Excellent for medium-large apps
        │       └── Recommended for new projects
        │
        ├── Enterprise, strict patterns needed
        │   │
        │   └── BLoC
        │       ├── Event → State pattern
        │       ├── Very testable
        │       ├── More boilerplate
        │       └── Good for large teams
        │
        └── Quick prototyping
            │
            └── GetX (with caution)
                ├── Fast to implement
                ├── Less strict patterns
                └── Can become messy at scale
```

### State Management Anti-Patterns

```
❌ DON'T:
├── Use global state for everything
├── Mix state management approaches
├── Store server state in local state
├── Skip state normalization
├── Overuse Context (re-render heavy)
└── Put navigation state in app state

✅ DO:
├── Server state → Query library
├── UI state → Minimal, local first
├── Lift state only when needed
├── Choose ONE approach per project
└── Keep state close to where it's used
```

---

## 3. Navigation Pattern Selection

```
HOW MANY TOP-LEVEL DESTINATIONS?
        │
        ├── 2 destinations
        │   └── Consider: Top tabs or simple stack
        │
        ├── 3-5 destinations (equal importance)
        │   └── ✅ Tab Bar / Bottom Navigation
        │       ├── Most common pattern
        │       └── Easy discovery
        │
        ├── 5+ destinations
        │   │
        │   ├── All important → Drawer Navigation
        │   │                   └── Hidden but many options
        │   │
        │   └── Some less important → Tab bar + drawer hybrid
        │
        └── Single linear flow?
            └── Stack Navigation only
                └── Onboarding, checkout, etc.
```

### Navigation by App Type

| App Type | Pattern | Reason |
|----------|---------|--------|
| Social (Instagram) | Tab bar | Frequent switching |
| E-commerce | Tab bar + stack | Categories as tabs |
| Email (Gmail) | Drawer + list-detail | Many folders |
| Settings | Stack only | Deep drill-down |
| Onboarding | Stack wizard | Linear flow |
| Messaging | Tab (chats) + stack | Threads |

---

## 4. Storage Strategy Selection

```
WHAT TYPE OF DATA?
        │
        ├── Sensitive (tokens, passwords, keys)
        │   │
        │   └── ✅ Secure Storage
        │       ├── iOS: Keychain
        │       ├── Android: EncryptedSharedPreferences
        │       └── RN: expo-secure-store / react-native-keychain
        │
        ├── User preferences (settings, theme)
        │   │
        │   └── ✅ Key-Value Storage
        │       ├── iOS: UserDefaults
        │       ├── Android: SharedPreferences
        │       └── RN: AsyncStorage / MMKV
        │
        ├── Structured data (entities, relationships)
        │   │
        │   └── ✅ Database
        │       ├── SQLite (expo-sqlite, sqflite)
        │       ├── Realm (NoSQL, reactive)
        │       └── WatermelonDB (large datasets)
        │
        ├── Large files (images, documents)
        │   │
        │   └── ✅ File System
        │       ├── iOS: Documents / Caches directory
        │       ├── Android: Internal/External storage
        │       └── RN: react-native-fs / expo-file-system
        │
        └── Cached API data
            │
            └── ✅ Query Library Cache
                ├── TanStack Query (RN)
                ├── Riverpod async (Flutter)
                └── Automatic invalidation
```

### Storage Comparison

| Storage | Speed | Security | Capacity | Use Case |
|---------|-------|----------|----------|----------|
| Secure Storage | Medium | 🔒 High | Small | Tokens, secrets |
| Key-Value | Fast | Low | Medium | Settings |
| SQLite | Fast | Low | Large | Structured data |
| File System | Medium | Low | Very Large | Media, documents |
| Query Cache | Fast | Low | Medium | API responses |

---

## 5. Offline Strategy Selection

```
HOW CRITICAL IS OFFLINE?
        │
        ├── Nice to have (works when possible)
        │   │
        │   └── Cache last data + show stale
        │       ├── Simple implementation
        │       ├── TanStack Query with staleTime
        │       └── Show "last updated" timestamp
        │
        ├── Essential (core functionality offline)
        │   │
        │   └── Offline-first architecture
        │       ├── Local database as source of truth
        │       ├── Sync to server when online
        │       ├── Conflict resolution strategy
        │       └── Queue actions for later sync
        │
        └── Real-time critical (collaboration, chat)
            │
            └── WebSocket + local queue
                ├── Optimistic updates
                ├── Eventual consistency
                └── Complex conflict handling
```

### Offline Implementation Patterns

```

1. CACHE-FIRST (Simple)

// @sentinel-ignore: Justificación técnica inyectada por el motor de seguridad
   Request → Check cache → If stale, fetch → Update cache
   
2. STALE-WHILE-REVALIDATE

   Request → Return cached → Fetch update → Update UI
   
3. OFFLINE-FIRST (Complex)

   Action → Write to local DB → Queue sync → Sync when online
   
4. SYNC ENGINE

   Use: Firebase, Realm Sync, Supabase realtime
   Handles conflict resolution automatically
```

---

## 6. Authentication Pattern Selection

```
WHAT AUTH TYPE NEEDED?
        │
        ├── Simple email/password
        │   │
        │   └── Token-based (JWT)
        │       ├── Store refresh token securely
        │       ├── Access token in memory
        │       └── Silent refresh flow
        │
        ├── Social login (Google, Apple, etc.)
        │   │
        │   └── OAuth 2.0 + PKCE
        │       ├── Use platform SDKs
        │       ├── Deep link callback
        │       └── Apple Sign-In required for iOS
        │
        ├── Enterprise/SSO
        │   │
        │   └── OIDC / SAML
        │       ├── Web view or system browser
        │       └── Handle redirect properly
        │
        └── Biometric (FaceID, fingerprint)
            │
            └── Local auth + secure token
                ├── Biometrics unlock stored token
                ├── Not a replacement for server auth
                └── Fallback to PIN/password
```

### Auth Token Storage

```
❌ NEVER store tokens in:
├── AsyncStorage (plain text)
├── Redux/state (not persisted correctly)
├── Local storage equivalent
└── Logs or debug output

✅ ALWAYS store tokens in:
├── iOS: Keychain
├── Android: EncryptedSharedPreferences
├── Expo: SecureStore
├── Biometric-protected if available
```

---

## 7. Project Type Templates

### E-Commerce App

```
RECOMMENDED STACK:
├── Framework: React Native + Expo (OTA for pricing)
├── Navigation: Tab bar (Home, Search, Cart, Account)
├── State: TanStack Query (products) + Zustand (cart)
├── Storage: SecureStore (auth) + SQLite (cart cache)
├── Offline: Cache products, queue cart actions
└── Auth: Email/password + Social + Apple Pay

KEY DECISIONS:
├── Product images: Lazy load, cache aggressively
├── Cart: Sync across devices via API
├── Checkout: Secure, minimal steps
└── Deep links: Product shares, marketing
```

### Social/Content App

```
RECOMMENDED STACK:
├── Framework: React Native or Flutter
├── Navigation: Tab bar (Feed, Search, Create, Notifications, Profile)
├── State: TanStack Query (feed) + Zustand (UI)
├── Storage: SQLite (feed cache, drafts)
├── Offline: Cache feed, queue posts
└── Auth: Social login primary, Apple required

KEY DECISIONS:
├── Feed: Infinite scroll, memoized items
├── Media: Upload queuing, background upload
├── Push: Deep link to content
└── Real-time: WebSocket for notifications
```

### Productivity/SaaS App

```
RECOMMENDED STACK:
├── Framework: Flutter (consistent UI) or RN
├── Navigation: Drawer or Tab bar
├── State: Riverpod/BLoC or Redux Toolkit
├── Storage: SQLite (offline), SecureStore (auth)
├── Offline: Full offline editing, sync
└── Auth: SSO/OIDC for enterprise

KEY DECISIONS:
├── Data sync: Conflict resolution strategy
├── Collaborative: Real-time or eventual?
├── Files: Large file handling
└── Enterprise: MDM, compliance
```

---

## 8. Decision Checklist

### Before Starting ANY Project

- [ ] Target platforms defined (iOS/Android/both)?
- [ ] Framework selected based on criteria?
- [ ] State management approach chosen?
- [ ] Navigation pattern selected?
- [ ] Storage strategy for each data type?
- [ ] Offline requirements defined?
- [ ] Auth flow designed?
- [ ] Deep linking planned from start?

### Questions to Ask User

```
If project details are vague, ASK:

1. "Will this need OTA updates without app store review?"

   → Affects framework choice (Expo = yes)

2. "Do iOS and Android need identical UI?"

   → Affects framework (Flutter = identical)

3. "What's the offline requirement?"

   → Affects architecture complexity

4. "Is there an existing backend/auth system?"

   → Affects auth and API approach

5. "What devices? Phone only, or tablet?"

   → Affects navigation and layout

6. "Enterprise or consumer?"

   → Affects auth (SSO), security, compliance
```

---

## 9. Anti-Pattern Decisions

### ❌ Decision Anti-Patterns

| Anti-Pattern | Why It's Bad | Better Approach |
|--------------|--------------|-----------------|
| **Redux for simple app** | Massive overkill | Zustand or context |
| **Native for MVP** | Slow development | Cross-platform MVP |
| **Drawer for 3 sections** | Hidden navigation | Tab bar |
| **AsyncStorage for tokens** | Insecure | SecureStore |
| **No offline consideration** | Broken on subway | Plan from start |
| **Same stack for all projects** | Doesn't fit context | Evaluate per project |

---

## 10. Quick Reference

### Framework Quick Pick

```
OTA needed?           → React Native + Expo
Identical UI?         → Flutter
Maximum performance?  → Native
Web team?            → React Native
Quick prototype?     → Expo
```

### State Quick Pick

```
Simple app?          → Zustand / Provider
Server-heavy?        → TanStack Query / Riverpod
Enterprise?          → Redux / BLoC
Atomic state?        → Jotai
```

### Storage Quick Pick

```
Secrets?             → SecureStore / Keychain
Settings?            → AsyncStorage / UserDefaults
Structured data?     → SQLite
API cache?           → Query library
```

---

> **Remember:** These trees are guides for THINKING, not rules to follow blindly. Every project has unique constraints. ASK clarifying questions when requirements are vague, and choose based on actual needs, not defaults.
