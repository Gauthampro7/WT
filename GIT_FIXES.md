# Git setup – what to fix

Here’s what’s wrong and how to fix it.

---

## 1. Remote URL is a placeholder (must fix)

Your `origin` is set to:

```text
https://github.com/YOUR_USERNAME/skillswap.git
```

`YOUR_USERNAME` is a placeholder. Push/pull will fail until you use your real GitHub username.

**Fix (use your real GitHub username):**

```bash
cd c:\Users\gauth\WT
git remote set-url origin https://github.com/YOUR_ACTUAL_USERNAME/skillswap.git
```

Example if your username is `gauth`:

```bash
git remote set-url origin https://github.com/gauth/skillswap.git
```

Check it:

```bash
git remote -v
```

---

## 2. Repo root vs `skillswap/` folder

- Your **current project** (SkillSwap) lives at the **repo root**: `WT/package.json`, `WT/src/`, etc.
- If the repo was first pushed from the parent folder, GitHub may have the same files under a **`skillswap/`** directory.

So you can have:

- **On GitHub:** `skillswap/package.json`, `skillswap/src/`, …
- **On your machine:** `package.json`, `src/`, … (no `skillswap/`)

If that’s the case, then:

- Either **keep the current layout** (project at repo root) and fix the remote as above. New commits will be at root; you may need to force-push once after fixing history or accept that the folder structure on GitHub will change.
- Or **make the repo match “project inside `skillswap/`”** by moving everything into a `skillswap` folder and committing (then push). That keeps “one folder” on GitHub but changes your local layout.

**If you want the repo root to be the SkillSwap project (no `skillswap/` folder on GitHub):**

1. Fix the remote URL (step 1).
2. If the GitHub repo already has a `skillswap/` folder from earlier pushes, either:
   - Create a **new** empty repo on GitHub and push your current root there (so the new repo has no `skillswap/` folder), or  
   - Use history rewrite so that the current root becomes the only root (e.g. `git filter-branch --subdirectory-filter .` is not right; you’d do the opposite: have only the content that’s now at root). Easiest is often: new repo + add remote + push.

---

## 3. `.gitignore` and extra folders

- Your **`.gitignore`** at the repo root is fine (e.g. `node_modules`, `.env`, `dist`).
- **`skillswap/`** has been added to `.gitignore` so a duplicate or legacy `skillswap/` folder at the repo root is not tracked. Your real project lives at the repo root (`package.json`, `src/`, etc.).  
- **If your GitHub repo is supposed to have everything inside a `skillswap/` folder** (e.g. you see `skillswap/package.json` on GitHub), then remove the `skillswap/` line from `.gitignore` and either move your root-level files into `skillswap/` or fix the structure as in section 2.

---

## 4. Checklist

- [ ] Set `origin` to your real GitHub URL (step 1).
- [ ] Decide: project at repo root vs inside `skillswap/` (step 2).
- [ ] If you have a duplicate `skillswap/` folder, add `skillswap/` to `.gitignore` (step 3).
- [ ] Run `git status` and fix any unintended tracked files.
- [ ] Push: `git push -u origin main` (or your branch). If GitHub already has a different structure, you may need `git push --force-with-lease origin main` **after** you’re sure you want to overwrite the remote (e.g. after creating a new repo or rewriting history).

---

## 5. Verify

```bash
cd c:\Users\gauth\WT
git remote -v
git status
git branch -a
```

Then try:

```bash
git fetch origin
git push -u origin main
```

If you get “repository not found” or 403, the URL is still wrong or you don’t have access. If you get “failed to push some refs”, the remote may have a different structure or history; then use the “repo root vs skillswap/” section above to decide how to align things.
