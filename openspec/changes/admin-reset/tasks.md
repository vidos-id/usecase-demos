## 1. Shared Schemas

- [ ] 1.1 Create sign-out endpoint schema in `shared/src/api/session.ts`
- [ ] 1.2 Create reset endpoint schema in `shared/src/api/admin.ts`
- [ ] 1.3 Add Zod schemas for DELETE /api/session response (success boolean)
- [ ] 1.4 Add Zod schemas for DELETE /api/admin/reset response (success boolean, message string)

## 2. Server Store Extensions

- [ ] 2.1 Add clearAllUsers() export to `server/src/stores/users.ts`
- [ ] 2.2 Add clearAllSessions() export to `server/src/stores/sessions.ts`

## 3. Server Endpoints

- [ ] 3.1 Create DELETE /api/session endpoint in `server/src/index.ts`
- [ ] 3.2 Implement Authorization header parsing (extract Bearer token)
- [ ] 3.3 Call deleteSession() with extracted session ID
- [ ] 3.4 Return 401 if Authorization header missing
- [ ] 3.5 Return 200 with success:true for valid session deletion
- [ ] 3.6 Create DELETE /api/admin/reset endpoint in `server/src/index.ts`
- [ ] 3.7 Call clearAllUsers() and clearAllSessions() in reset endpoint
- [ ] 3.8 Return 200 with success:true and message for reset completion
- [ ] 3.9 Update server AppType export to include new routes

## 4. Reset Confirmation Dialog Component

- [ ] 4.1 Create `client/src/components/dialogs/reset-confirmation.tsx`
- [ ] 4.2 Implement AlertDialog with title "Reset Demo Data?"
- [ ] 4.3 Add description warning text about data removal
- [ ] 4.4 Add Cancel and "Reset All Data" buttons
- [ ] 4.5 Apply destructive styling to confirm button (bg-destructive)
- [ ] 4.6 Accept open, onOpenChange, onConfirm props for state management

## 5. Account Menu Integration

- [ ] 5.1 Locate existing account menu component in client
- [ ] 5.2 Add "Sign Out" menu item for authenticated users
- [ ] 5.3 Add "Reset Demo Data" menu item for authenticated users
- [ ] 5.4 Implement sign-out click handler (calls DELETE /api/session)
- [ ] 5.5 Implement reset click handler (opens confirmation dialog)

## 6. Sign-Out Flow

- [ ] 6.1 Create API call to DELETE /api/session with Authorization header
- [ ] 6.2 Clear sessionStorage ("sessionId" and "authMode") on success
- [ ] 6.3 Navigate to "/" using TanStack Router after session cleanup
- [ ] 6.4 Verify landing page shows unauthenticated state

## 7. Reset Flow

- [ ] 7.1 Implement confirmation dialog state management in account menu
- [ ] 7.2 Create API call to DELETE /api/admin/reset on confirmation
- [ ] 7.3 Display toast notification "Demo data has been reset" on success
- [ ] 7.4 Clear sessionStorage ("sessionId" and "authMode") after reset
- [ ] 7.5 Navigate to "/" using TanStack Router after reset completion

## 8. Manual Verification

- [ ] 8.1 Verify "Sign Out" and "Reset Demo Data" appear in account menu for authenticated users
- [ ] 8.2 Verify sign-out clears session and redirects to landing page
- [ ] 8.3 Verify reset shows confirmation dialog with warning text
- [ ] 8.4 Verify cancel button closes dialog without executing reset
- [ ] 8.5 Verify confirm button executes reset and shows toast
- [ ] 8.6 Verify reset clears all users and sessions from stores
- [ ] 8.7 Verify landing page shows clean unauthenticated state after reset
