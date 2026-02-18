# Show HN Draft

## Title

**Show HN: Env-doctor – validate, diff, and manage .env files (zero dependencies)**

## Body

Hey HN,

I kept running into the same problem: deploying to staging and realizing DATABASE_URL was missing, or spending 20 minutes figuring out which env vars differ between local and production.

So I built env-doctor — a CLI tool that treats .env files as first-class citizens in your project.

**What it does:**

- `env-doctor check` — validates .env against a schema (types, patterns, enums, required fields)
- `env-doctor diff .env .env.staging` — shows exactly what's different between two env files
- `env-doctor mask` — prints your .env with secrets masked (safe for logs/Slack)
- `env-doctor sync` — adds missing vars from schema to your .env (interactive or non-interactive)
- `env-doctor init` — generates .env.example from your existing .env

The schema format is intentionally simple:

    DATABASE_URL=required,url
    PORT=number,default:3000
    NODE_ENV=required,enum:development|staging|production
    API_KEY=required,secret,min:16

Zero dependencies, pure Node.js, works with any framework. We use it in CI to catch env issues before they hit production.

npm: https://www.npmjs.com/package/@atyahassis/env-doctor
GitHub: https://github.com/AtyahsLab/env-doctor

Would love feedback on the schema DSL and what features you'd want next. Thinking about a GitHub Action and auto-fix next.

---

*Notes for posting:*
- Post Tuesday-Thursday, 9-11 AM ET
- Have GitHub README polished with terminal GIFs before posting
- Respond to every comment within first 2 hours
- Don't edit the post after submission (HN penalizes edits)
