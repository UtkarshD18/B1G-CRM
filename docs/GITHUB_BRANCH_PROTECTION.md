# GitHub Branch Protection Requirements

To ensure the stability of `main`, `develop-enterprise`, and `release/*` branches, the repository administrator must configure the following Branch Protection Rules in GitHub Settings:

## Required Rules

1. **Require a pull request before merging**
   - **Require approvals**: Minimum 1 (recommend 2 for production).
   - **Dismiss stale pull request approvals when new commits are pushed**: Enabled.
   - **Require review from Code Owners**: Enabled.

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging.
   - Required checks:
     - `Backend CI`
     - `Frontend CI`
     - `Docker CI`
     - `Security Scans & Regression Tests`
     - `CodeQL`

3. **Require conversation resolution before merging**
   - All PR comments must be resolved before the merge button becomes active.

4. **Do not allow bypassing the above settings**
   - Applies even to administrators.

5. **Restrict who can push to matching branches**
   - Only authorized release managers/teams.

6. **Rules applied to everyone including administrators**
   - **Allow force pushes**: Disabled (prevent history rewrites).
   - **Allow deletions**: Disabled (prevent accidental branch drops).
