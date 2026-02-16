## Context

DemoBank is a demo application with in-memory user and session stores (established in `core-infrastructure` change). Users authenticate via PID credentials through Vidos Authorizer, creating sessions and user records stored in singleton ES6 Maps.

Currently, there's no way for users to end their session or for operators to reset demo state between demonstrations. This change adds:
- User sign-out (destroys current session)
- Full demo data reset (clears all users and sessions)

**Constraints:**
- JIT TypeScript (no build step for `server` and `shared`)
- Zod validation at all boundaries (established pattern)
- Method-chained Hono routes for type inference
- In-memory stores from `server/src/stores/users.ts` and `server/src/stores/sessions.ts`

**Stakeholders:**
- End users need self-service sign-out
- Demo operators need quick state reset between demos

## Goals / Non-Goals

**Goals:**
- DELETE /api/session endpoint that destroys only the current user's session
- DELETE /api/admin/reset endpoint that clears all in-memory stores
- Client confirmation dialog before executing destructive reset
- Account menu integration for authenticated users
- Post-reset user feedback (toast notification)
- Client-side session cleanup and redirect after sign-out

**Non-Goals:**
- Admin authentication for reset endpoint (demo context makes this acceptable)
- Soft delete or archival of sessions (hard delete only)
- Granular reset options (all-or-nothing is sufficient for demo)
- Session revocation by admin for individual users (out of scope)
- Audit logging of reset actions (add if needed later)

## Decisions

### Decision 1: Session Identification via Header

**Choice:** Sign-out endpoint identifies session from `Authorization` header, not cookie.

**Why:**
- Consistent with authenticated endpoint pattern (session ID in bearer token)
- Client already sends `Authorization: Bearer <sessionId>` for authenticated requests
- Simpler than dual cookie/header support
- No CSRF concerns (stateless API, no cookie-based auth)

**Alternatives considered:**
- Cookie-based session: Requires cookie parsing, adds complexity for API-first design
- Session ID in request body: Non-standard for DELETE, requires body parsing

**Implementation:**
```typescript
// server/src/routes/session.ts
app.delete("/api/session", async (c) => {
  const authHeader = c.req.header("Authorization");
  const sessionId = authHeader?.replace("Bearer ", "");
  if (!sessionId) return c.json({ error: "Unauthorized" }, 401);
  
  deleteSession(sessionId); // from stores/sessions.ts
  return c.json({ success: true });
});
```

---

### Decision 2: No Authentication for Reset Endpoint

**Choice:** DELETE /api/admin/reset is publicly accessible, no admin auth check.

**Why:**
- Demo application context: not production-facing
- In-memory data is ephemeral anyway (lost on restart)
- Simplifies implementation (no admin role system needed)
- Client-side confirmation dialog prevents accidental clicks
- Risk is acceptable: worst case is someone resets demo state (non-destructive in demo context)

**Alternatives considered:**
- Admin API key in header: Adds secret management, overkill for demo
- Session-based admin check: Requires admin user concept, out of scope
- Rate limiting: Doesn't prevent intentional reset, adds complexity

**Implementation:**
```typescript
// server/src/routes/admin.ts
app.delete("/api/admin/reset", async (c) => {
  clearAllUsers();    // from stores/users.ts
  clearAllSessions(); // from stores/sessions.ts
  return c.json({ success: true, message: "Demo data has been reset" });
});
```

---

### Decision 3: Confirmation Dialog with Shadcn AlertDialog

**Choice:** Use shadcn/ui `AlertDialog` component for reset confirmation.

**Why:**
- Already in project dependencies (used for other dialogs)
- Accessible by default (keyboard navigation, focus management)
- Matches existing DemoBank UI patterns
- Prevents accidental reset with clear warning text

**Alternatives considered:**
- Browser confirm(): Poor UX, not customizable, doesn't match app design
- Custom modal: Reinvents wheel, accessibility concerns
- Toast-only warning: No blocking confirmation, too easy to miss

**Component structure:**
```typescript
// client/src/components/dialogs/reset-confirmation.tsx
export const ResetConfirmationDialog = ({ open, onOpenChange, onConfirm }) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogTitle>Reset Demo Data?</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove all registered users and sessions. This action cannot be undone.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive">
          Reset All Data
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
```

---

### Decision 4: Store Clear Methods Instead of Direct Map Access

**Choice:** Add `clearAllUsers()` and `clearAllSessions()` exports to store modules.

**Why:**
- Encapsulates clearing logic (future-proof if cleanup steps added)
- Consistent with store pattern (functions instead of exposed Map)
- Easier to test and mock
- Allows for future extensions (e.g., event hooks, logging)

**Alternatives considered:**
- Export Map directly: Breaks encapsulation, ties consumers to Map implementation
- Reset to empty Map: Requires replacing references, error-prone

**Implementation:**
```typescript
// server/src/stores/users.ts
const users = new Map<string, User>();

export const clearAllUsers = () => {
  users.clear();
};

// server/src/stores/sessions.ts
const sessions = new Map<string, Session>();

export const clearAllSessions = () => {
  sessions.clear();
};
```

---

### Decision 5: Client-Side Session Cleanup After Sign-Out

**Choice:** Client clears `sessionId` (and stored mode) from local storage and redirects to `/` after sign-out.

**Why:**
- Server destroys session, but client must forget session ID
- Redirect prevents showing authenticated UI with invalid session
- Landing page (`/`) is natural post-logout destination
- localStorage is current storage mechanism (established pattern)

**Alternatives considered:**
- Redirect to `/login`: Assumes user wants to immediately re-authenticate (likely not)
- No redirect: Leaves user on protected route, causes error state
- Cookie clearing: Not applicable (session in localStorage, not cookies)

**Implementation flow:**
1. User clicks "Sign Out" in account menu
2. Client calls `DELETE /api/session` with current session ID in Authorization header
3. On success, `localStorage.removeItem("sessionId")` and `localStorage.removeItem("authMode")`
4. Navigate to `/` using TanStack Router
5. Landing page shows unauthenticated state

---

### Decision 6: Toast Notification for Reset Success

**Choice:** Show toast message "Demo data has been reset" after successful reset.

**Why:**
- Provides immediate feedback that destructive action completed
- Reassures user that operation succeeded (vs. silent failure)
- Matches DemoBank toast patterns for other actions

**Alternatives considered:**
- Alert dialog: Too intrusive for post-action confirmation
- No feedback: User uncertain if reset worked
- Page reload indicator: Reset already forces logout, toast is clearer

**Implementation:**
```typescript
// In account menu reset handler
const handleReset = async () => {
  await client.admin.reset.$delete(); // Hono RPC call
  toast.success("Demo data has been reset");
  localStorage.removeItem("sessionId");
  navigate({ to: "/" });
};
```

## Risks / Trade-offs

**[Risk]** Reset endpoint has no authentication → Anyone can wipe demo data  
**→ Mitigation:** Acceptable for demo context. Client confirmation prevents accidents. Add auth if deploying publicly.

**[Risk]** Sign-out doesn't invalidate session on client → Replaying session ID could restore access  
**→ Mitigation:** Client clears localStorage. Replay only possible if user manually saved session ID. Server-side session is destroyed regardless.

**[Risk]** No confirmation for sign-out → User might accidentally click  
**→ Mitigation:** Acceptable UX trade-off. Sign-out is low-risk (user can re-authenticate). Confirmation dialog would slow down common action.

**[Risk]** Reset during active sessions → Other users suddenly logged out  
**→ Mitigation:** Expected behavior for demo reset. Document clearly in UI ("removes all sessions").

**[Trade-off]** No soft delete or audit trail → Can't recover from accidental reset  
**→ Mitigation:** Demo data is ephemeral anyway. Real apps would add audit logging.

**[Trade-off]** Clearing localStorage on sign-out doesn't clear session from other tabs  
**→ Mitigation:** Browser storage events could sync across tabs. Defer unless user feedback indicates issue.

## Migration Plan

**Deployment:**
1. Deploy server changes (new routes: `/api/session`, `/api/admin/reset`)
2. Deploy client changes (account menu, confirmation dialog)
3. No environment variables or database migrations needed
4. No breaking changes to existing endpoints

**Rollback:**
- Simple code revert (no persistent state affected)
- New endpoints can coexist with old code (additive change)

**Verification:**
1. Authenticated user sees "Sign Out" and "Reset Demo Data" in account menu
2. Sign-out clears session, redirects to landing page
3. Reset shows confirmation dialog with warning text
4. After confirming reset, all users and sessions cleared (verify empty stores)
5. Toast appears after reset: "Demo data has been reset"

## Open Questions

1. **Should reset endpoint return count of cleared items?**  
   **→ Decide during implementation. Could help verification but not critical for UX.**

2. **Should sign-out endpoint return 404 if session doesn't exist?**  
   **→ Return 200 regardless (idempotent DELETE). Client doesn't care if session was already gone.**

3. **Should reset dialog show what will be deleted?**  
   **→ Start with generic message. Add details ("X users, Y sessions") if user feedback requests it.**

4. **Should account menu disable reset button if already no data?**  
   **→ No. Determining "no data" requires extra API call. Always allow reset (no-op if empty).**
