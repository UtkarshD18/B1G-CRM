# Reference Page Audit — Login

- **URL:** `https://crm.oneoftheprojects.com/user/login` (Note: `/signin` directly results in a 404 error)
- **Page Purpose:** Central authentication portal to access the CRM user portal.
- **Page Layout:** Two-pane split layout. Left: branding and value proposition. Right: interactive login card.
- **Form Fields:**
  - Email Address (Input Type: text/email)
  - Password (Input Type: password, with show/hide visibility toggle)
- **Action Buttons:**
  - "Autofill" (populates standard test credentials `user@user.com` / `password`)
  - "Continue with Google" (OAuth login)
  - "Continue with Facebook" (OAuth login)
  - "Sign in with email" (Submit button)
  - "Forgot password?" (Link to recovery)
  - "Create Account" (Link to toggle the signup form state)
- **Workflows:**
  - Autofill: Clicking "Autofill" populates login credentials.
  - Manual Login: User inputs email and password, then submits the form.
  - OAuth: Social integrations.
  - Navigate to Signup: Clicking "Create Account" transitions the card to the registration state.
