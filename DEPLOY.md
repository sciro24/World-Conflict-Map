# Deploying RISIKO IRL to Vercel

This project is built with Next.js and is optimized for Vercel deployment.

## Prerequisites
- A GitHub account.
- A Vercel account.

## Steps

1.  **Push to GitHub**:
    - Initialize git if not already: `git init`
    - Commit all files: `git add . && git commit -m "Initial commit"`
    - Create a new repository on GitHub and push.

2.  **Import to Vercel**:
    - Go to dashboard.vercel.com
    - Click "Add New..." -> "Project".
    - Import your GitHub repository.
    - Framework Preset should auto-detect "Next.js".
    - **Build Command**: `next build` (default)
    - **Install Command**: `npm install` (default)

3.  **Environment Variables**:
    - No secret keys are currently required for the public GDELT API.

4.  **Deploy**:
    - Click "Deploy".
    - Wait for the build to finish.

## Troubleshooting
- If the build fails due to type errors, check the logs. `tsc --noEmit` locally can help debug.
- If dependencies fail, ensure `package.json` includes the legacy peer deps resolution (or just successful install locally usually generates a working package-lock).
