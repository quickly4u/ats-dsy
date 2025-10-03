# User Invitation Fix - Configuration Guide

## Issues Fixed

### 1. **AcceptInvitation Component** ✅
Updated to properly handle Supabase invitation links:
- Removed requirement for `type=invite` parameter
- Now properly detects and processes Supabase `inviteUserByEmail` links
- Automatically sets session from invitation token
- Better error handling for already-accepted invitations

### 2. **Required Supabase Configuration** 🔧

You need to configure the Supabase redirect URL to ensure invitation emails work correctly.

## Configuration Steps

### Step 1: Configure Redirect URLs in Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project: **ATS** (Project ID: `jivccjpzcecljzuzxxhx`)
3. Navigate to **Authentication** → **URL Configuration**
4. Add the following URLs to **Redirect URLs**:

   **For Local Development:**
   ```
   http://localhost:5173/accept-invitation
   ```

   **For Production:**
   ```
   https://your-production-domain.com/accept-invitation
   ```

5. Set the **Site URL** to your main application URL:
   - Development: `http://localhost:5173`
   - Production: `https://your-production-domain.com`

6. Click **Save**

### Step 2: Customize Email Template (Optional but Recommended)

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Select **Invite User** template
3. Customize the email to match your branding
4. Make sure the confirmation URL button/link is present (it uses `{{ .ConfirmationURL }}`)

**Example Email Template:**
```html
<h2>You've been invited to join {{ .CompanyName }}!</h2>
<p>Hi there,</p>
<p>You have been invited to join {{ .CompanyName }} on ATS Pro.</p>
<p>Click the button below to accept the invitation and set up your account:</p>
<p><a href="{{ .ConfirmationURL }}">Accept Invitation</a></p>
<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This invitation will expire in 24 hours.</p>
```

## How the Fixed Flow Works

### Before (Broken):
1. ❌ User clicks invitation link
2. ❌ AcceptInvitation looks for `type=invite` parameter (doesn't exist)
3. ❌ Shows "Invalid invitation link" error
4. ❌ User never sets password
5. ❌ User remains inactive

### After (Fixed):
1. ✅ User clicks invitation link from email
2. ✅ AcceptInvitation detects `access_token` in URL hash
3. ✅ Establishes session with the token
4. ✅ Looks up pending invitation in database
5. ✅ Shows password creation form
6. ✅ User creates password
7. ✅ Updates user status to `active`
8. ✅ Updates invitation status to `accepted`
9. ✅ Redirects to dashboard

## Testing the Fix

### For Existing Pending Invitations:

If you have users who already received invitations but couldn't complete setup:

1. **Resend the invitation**:
   - Go to Team Management
   - Delete the existing inactive user (or mark for resend)
   - Send a new invitation

2. **Or manually activate them**:
   - Have the user reset their password via Supabase Auth
   - Manually set `is_active = true` in the database

### For New Invitations:

1. Go to **Team Management**
2. Click **Invite User**
3. Fill in user details
4. Click **Send Invitation**
5. **Check the invited user's email**
6. Click **Accept Invitation** link in email
7. User should see the password creation form
8. Create password (min 8 chars, uppercase, lowercase, numbers)
9. Click **Complete Setup**
10. User should be redirected to dashboard
11. Status should now show **Active** in Team Management

## Troubleshooting

### Issue: User still sees "Invalid invitation link"

**Solution**: 
- Verify the redirect URL is configured in Supabase
- Check that the invitation link hasn't expired (24 hour default)
- Ensure the user hasn't already accepted the invitation

### Issue: User can't set password

**Solution**:
- Check browser console for errors
- Verify Supabase session is established
- Ensure the invitation record exists in `team_invitations` table

### Issue: Status still shows "Inactive" after acceptance

**Solution**:
- Check if `is_active` was properly updated in the `users` table
- Verify the invitation status changed from `pending` to `accepted`
- Try refreshing the Team Management page

### Issue: Invitation email not received

**Solution**:
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email logs (Dashboard → Authentication → Logs)
- Ensure SMTP is configured (for production)

## Database Queries for Debugging

### Check invitation status:
```sql
SELECT 
  email, 
  status, 
  auth_user_id, 
  created_at 
FROM team_invitations 
WHERE email = 'user@example.com';
```

### Check user activation status:
```sql
SELECT 
  id, 
  email, 
  is_active, 
  created_at 
FROM users 
WHERE email = 'user@example.com';
```

### Manually activate a user (if needed):
```sql
UPDATE users 
SET is_active = true 
WHERE email = 'user@example.com';
```

### Check invitation and user status together:
```sql
SELECT 
  ti.email,
  ti.status as invitation_status,
  u.is_active as user_active,
  ti.created_at as invited_at,
  u.created_at as user_created_at
FROM team_invitations ti
LEFT JOIN users u ON u.id = ti.auth_user_id
WHERE ti.email = 'user@example.com';
```

## Summary of Changes

### Files Modified:
1. `/src/components/auth/AcceptInvitation.tsx`
   - Removed `type=invite` requirement
   - Added automatic session establishment
   - Improved error handling
   - Better invitation status checking

### What Stays the Same:
- Edge Function (`invite-user`) - no changes needed
- Team Management UI - works as before
- Database schema - no changes needed
- Email sending mechanism - same

## Next Steps

1. ✅ **Configure Supabase redirect URLs** (see Step 1 above)
2. ✅ **Test with a new invitation**
3. ✅ **Optionally customize email template**
4. ✅ **For existing pending invitations, resend them**

---

**Note**: The fix is backward compatible. Existing users can still log in normally. Only the invitation acceptance flow was updated.
