# Git + Vercel Branch Workflow

## 1. View branches
git branch
---

## 2. Switch branches

# Go to latest (error version)
git checkout main

# Go to stable version
git checkout working-version
---

## 3. Create branch from old commit

git checkout -b working-version 977650b
---

## 4. Delete branch
First switch to main branch thenonly can you delelte the sub branch

# Switch away first
git checkout main

# Delete branch
git branch -d working-version
---

## 5. Push branch to GitHub
git push origin working-version
---

## 6. Vercel Deployment

# Change production branch:
Project -> Click on Moneytalk -> Deplyments -> create deployment (top righht dots) -> choose branch -> deploy -> 3 dots on the deployment record -> promoe to production (if not already done) -> redeploy

Options:
- main → latest version
- working-version → stable version
