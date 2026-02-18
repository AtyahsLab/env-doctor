# Reddit Post Draft

**Subreddit:** r/node (or r/webdev)

**Title:** I built a CLI tool to stop .env file chaos across environments

**Body:**

Every team I've worked with has had the same problem — someone adds a new env var, forgets to tell the team, and suddenly staging is broken because `DATABASE_URL` is missing.

So I built **env-doctor** — a zero-dependency CLI that:

- **`check`** — validates your `.env` against a `.env.example` or a schema file (missing vars, type mismatches, bad formats)
- **`diff`** — compares two `.env` files side by side (spot what's missing, extra, or changed)
- **`mask`** — outputs your `.env` with values hidden (safe for sharing in Slack/PRs)
- **`init`** — generates a `.env.example` from your existing `.env` automatically

It also supports a `.env.schema` format where you can define types, patterns, required fields, enums, min/max — so validation actually catches real issues before deploy.

```
npx @atyahassis/env-doctor check
```

Zero dependencies. Node 18+. MIT licensed.

GitHub: https://github.com/AtyahsLab/env-doctor

Would love feedback — what's missing? What would make this actually useful for your workflow?
