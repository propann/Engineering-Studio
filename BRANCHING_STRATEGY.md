# 🌳 Git Branching Strategy

**Studio Hub Monorepo - Team Collaboration Workflow**

---

## Overview

The Studio Hub monorepo uses a **module-based branching strategy** to enable independent team development while maintaining code quality and stability.

### Key Principles

✅ **Team Separation** - Each team works independently on their module  
✅ **Stable Master** - Master branch is always production-ready  
✅ **Clear Responsibility** - Each module has clear ownership  
✅ **Minimal Conflicts** - Teams don't interfere with each other  
✅ **Coordinated Changes** - Shared packages coordinate both studios  
✅ **Easy Scaling** - New modules can be added using same pattern  

---

## Branch Structure

```
master (stable production branch)
  │
  ├─── consolidation/phase-3-complete
  │    (Phase 3 snapshot and historical record)
  │
  ├─── op1-studio-module
  │    (OP-1 Studio development)
  │
  ├─── ep133-studio-module
  │    (EP-133 Studio development)
  │
  ├─── shared-packages-module
  │    (Shared utilities development)
  │
  └─── docs-and-config-module
       (Documentation and global config)
```

### Branch Purposes

#### `master` (Main Stable Branch)
- ✓ Always production-ready
- ✓ All tests passing
- ✓ Complete documentation
- ✓ Protected (2 reviewers required)
- ✓ No direct commits
- ✓ Deployment source

#### `consolidation/phase-3-complete`
- ✓ Phase 3 completion snapshot
- ✓ Historical reference
- ✓ Read-only (for reference)
- ✓ Do not delete
- ✓ Tags what was accomplished

#### `op1-studio-module`
- ✓ All OP-1 Studio work
- ✓ Features, bugfixes, optimizations
- ✓ Isolated from EP-133
- ✓ OP-1 team works here
- ✓ PR to master when complete
- ✓ Can merge shared-packages changes

#### `ep133-studio-module`
- ✓ All EP-133 Studio work
- ✓ Game engine, audio, features
- ✓ Isolated from OP-1
- ✓ EP-133 team works here
- ✓ PR to master when complete
- ✓ Can merge shared-packages changes

#### `shared-packages-module`
- ✓ Shared packages development
- ✓ Types, stores, UI, audio, compression
- ✓ Affects both studios
- ✓ Requires coordination
- ✓ Both teams must review
- ✓ Merge to both studio modules

#### `docs-and-config-module`
- ✓ Documentation updates
- ✓ Global configuration changes
- ✓ Version bumps, releases
- ✓ README and guide improvements
- ✓ No code changes
- ✓ Cross-team coordination

---

## Workflow

### For OP-1 Studio Development

```bash
# 1. Switch to OP-1 module branch
git checkout op1-studio-module

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat(op1-studio): description of feature"

# 4. Push to remote
git push origin feature/your-feature-name

# 5. Create Pull Request to op1-studio-module
# - Go to GitHub/GitLab/Gitea
# - Create PR: feature/your-feature-name → op1-studio-module
# - Add description and reviewers
# - Link related issues

# 6. After approval, merge to op1-studio-module
# - Squash commits if many
# - Delete feature branch

# 7. When ready for release, create PR to master
git checkout op1-studio-module
git pull origin master
# Resolve any conflicts
git push origin op1-studio-module

# - Create PR: op1-studio-module → master
# - Add version bump (if needed)
# - Add release notes
# - Require 2 reviewer approvals
# - Merge and deploy
```

### For EP-133 Studio Development

```bash
# Same workflow, but use ep133-studio-module instead

# 1. Switch to EP-133 module branch
git checkout ep133-studio-module

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3-7. Same as OP-1 but targeting ep133-studio-module
```

### For Shared Packages Development

```bash
# 1. Switch to shared-packages module
git checkout shared-packages-module

# 2. Create feature branch
git checkout -b feature/add-new-utility

# 3. Make changes
git add .
git commit -m "feat(shared-packages): new utility description"

# 4. Push and create PR
git push origin feature/add-new-utility

# 5. Important: Notify both studios' teams
# - OP-1 team needs to review
# - EP-133 team needs to review
# - Ensure compatibility with both

# 6. After approval, merge to shared-packages-module

# 7. Update both studio modules
git checkout op1-studio-module
git merge shared-packages-module
git push origin op1-studio-module

git checkout ep133-studio-module
git merge shared-packages-module
git push origin ep133-studio-module

# 8. Create PR to master
# - Includes shared-packages changes
# - Documented for both teams
```

### For Documentation Updates

```bash
# 1. Switch to docs-and-config module
git checkout docs-and-config-module

# 2. Create documentation branch
git checkout -b docs/update-readme

# 3. Update documentation
git add .
git commit -m "docs: update README with new info"

# 4. Push and create PR
git push origin docs/update-readme

# 5. After approval, merge to docs-and-config-module

# 6. PR to master when complete
```

---

## Commit Message Format

### Standard Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (formatting, etc)
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test addition/fix
- `build:` Build system changes
- `ci:` CI/CD changes
- `chore:` Other changes

### Scope (Module Name)

- `op1-studio` - OP-1 Studio changes
- `ep133-studio` - EP-133 Studio changes
- `shared-packages` - Shared packages changes
- `docs-and-config` - Documentation/config
- `monorepo` - General monorepo changes

### Examples

**Feature:**
```
feat(op1-studio): add MIDI device reconnection

Implement automatic reconnection logic for MIDI devices
that disconnect unexpectedly. Adds exponential backoff
and user notification.

Fixes #123
Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

**Bug Fix:**
```
fix(ep133-studio): correct WAV conversion dithering

The TPDF dithering algorithm was applying incorrect scaling.
Fixed to match specification for audio quality.

Fixes #456
```

**Documentation:**
```
docs: update installation guide

Add troubleshooting section for common setup issues.
Update version numbers to current release.
```

---

## Pull Request Workflow

### Creating a PR

1. **Feature Branch Complete**
   - All code committed
   - Tests passing locally
   - No console errors

2. **Push to Remote**
   ```bash
   git push origin feature/name
   ```

3. **Create Pull Request**
   - Title: Follow commit message format
   - Description: Explain what changed and why
   - Reviewers: Add appropriate team members
   - Labels: tag (feature, bugfix, docs)
   - Link issues: Reference related issues
   - Milestone: Assign to Phase

4. **PR Template** (if using)
   ```
   ## Description
   Brief explanation of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   
   ## Testing
   How to test these changes
   
   ## Checklist
   - [ ] Code reviewed
   - [ ] Tests passing
   - [ ] Documentation updated
   - [ ] No console errors
   ```

### PR Review Process

1. **Reviewer Checks**
   - Code quality
   - Tests coverage
   - Documentation
   - Performance impact
   - Compatibility

2. **Feedback**
   - Request changes if needed
   - Suggest improvements
   - Approve when satisfied

3. **Approval**
   - 1 reviewer minimum (module branches)
   - 2 reviewers (master branch)
   - All status checks passing
   - Conflicts resolved

4. **Merge**
   - Squash commits (if requested)
   - Delete feature branch
   - Auto-delete (if configured)

---

## Coordination Between Modules

### Scenario: Shared Package Update

**Timeline:**

```
Day 1: Shared Package Update
  1. shared-packages-module
     - Implement new utility
     - PR and approval
     - Merge

Day 2: Studio Updates
  2. op1-studio-module
     - Pull latest shared-packages
     - Update code to use new utility
     - Test and validate
     - PR and merge
  
  3. ep133-studio-module
     - Pull latest shared-packages
     - Update code to use new utility
     - Test and validate
     - PR and merge

Day 3: Master Release
  4. Create release PR to master
     - Includes all three module PRs
     - Version bump
     - Release notes
     - 2 reviewers approve
     - Merge and deploy
```

### Preventing Conflicts

1. **Regular Syncs**
   - Weekly check: Do all modules have latest master?
   - Rebase if needed

2. **Communication**
   - Announce planned changes
   - Notify affected teams
   - Discuss dependencies

3. **Testing**
   - Test locally before PR
   - Run full test suite
   - Verify both apps work

4. **Review Quality**
   - Thorough code review
   - Cross-team review for shared
   - Check for breaking changes

---

## Branch Protection Rules

### Master Branch (Required)

```
✓ Require pull request reviews (2 reviewers)
✓ Require status checks to pass
✓ Require branches to be up to date
✓ Restrict who can force push
✓ No direct pushes allowed
✓ Delete head branches after merge
✓ Require commit signatures
```

### Module Branches (Recommended)

```
✓ Require pull request reviews (1 reviewer)
✓ Require status checks to pass
✓ Require branches to be up to date
✓ No direct pushes (use feature branches)
✓ Delete head branches after merge
```

### Feature Branches

- No protection needed
- Delete after merge
- Use descriptive names
- Keep short-lived (< 1 week)

---

## Common Commands

### Navigation

```bash
# See all branches
git branch -v

# See remote branches
git branch -r

# See all branches (local + remote)
git branch -a

# Switch to module
git checkout op1-studio-module
git checkout ep133-studio-module
git checkout shared-packages-module
git checkout docs-and-config-module
```

### Feature Development

```bash
# Create feature branch
git checkout -b feature/name

# Push to remote
git push origin feature/name

# Update from master
git fetch origin
git rebase origin/master

# Rebase before PR
git rebase -i HEAD~5  # Last 5 commits

# Force push (after rebase)
git push origin feature/name --force-with-lease
```

### Module Updates

```bash
# Update module from master
git checkout op1-studio-module
git pull origin master

# Merge feature to module
git merge feature/name

# Push module
git push origin op1-studio-module

# Create PR: module → master
git push origin op1-studio-module
# Then create PR on GitHub/GitLab/Gitea
```

### Cleanup

```bash
# Delete local feature branch
git branch -d feature/name

# Delete remote feature branch
git push origin --delete feature/name

# Delete all merged local branches
git branch --merged | grep -v master | xargs -r git branch -d

# List all branches for cleanup
git branch --no-merged
```

---

## Best Practices

### DO ✅

- ✓ Create feature branches from module branches
- ✓ Keep feature branches short-lived
- ✓ Write descriptive commit messages
- ✓ Test locally before pushing
- ✓ Communicate with team about changes
- ✓ Review code thoroughly
- ✓ Update documentation with code
- ✓ Use meaningful branch names
- ✓ Keep modules up-to-date with master
- ✓ Delete feature branches after merge

### DON'T ❌

- ✗ Commit directly to master
- ✗ Commit directly to module branches
- ✗ Force push to master or module branches
- ✗ Create super long-lived feature branches
- ✗ Mix multiple features in one PR
- ✗ Ignore code review comments
- ✗ Skip testing before pushing
- ✗ Use generic branch names (fix/stuff)
- ✗ Leave feature branches after merge
- ✗ Merge without PR/review

---

## Troubleshooting

### Merge Conflicts

```bash
# Resolve conflicts locally
git fetch origin
git rebase origin/master
# Fix conflicts in editor
git add .
git rebase --continue
git push origin feature/name --force-with-lease
```

### Accidental Commit to Master

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Create feature branch
git checkout -b feature/fix

# Commit properly
git add .
git commit -m "feat: proper message"
```

### Need to Update Feature Branch

```bash
# Fetch latest
git fetch origin

# Rebase on latest master
git rebase origin/master

# Force push (safe)
git push origin feature/name --force-with-lease
```

### Both Studios Need Changes

```bash
# If shared-packages changes
git checkout shared-packages-module
# Make and merge changes

# Then update both modules
git checkout op1-studio-module
git merge shared-packages-module

git checkout ep133-studio-module
git merge shared-packages-module

# Both push and create PRs
```

---

## References

- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Commit Message Best Practices](https://conventionalcommits.org/)

---

## FAQ

**Q: What if I accidentally work on master?**
A: Create a feature branch, move commits there, reset master.

**Q: How often should I update my feature branch?**
A: Before submitting PR, at least. During long work, rebase weekly.

**Q: Can I work on multiple features at once?**
A: Use separate branches. Keep them isolated.

**Q: What if there's a production bug?**
A: Create hotfix branch from master, fix, PR to master, then cherry-pick to modules.

**Q: When should I create a new module branch?**
A: When adding major new functionality or studio to monorepo.

---

**Status**: ✅ Strategy Ready for Team Use

**Last Updated**: 2026-08-15

