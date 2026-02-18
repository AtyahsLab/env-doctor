# env-doctor — Distribution Strategy

> Last updated: 2026-02-18

## TL;DR — Launch Sequence

1. **Week 1**: GitHub Action + README polish + Show HN
2. **Week 2**: Product Hunt launch + dev Twitter push
3. **Week 3-4**: Newsletter pitches + community posts
4. **Ongoing**: SEO content + community engagement

---

## Channel Breakdown

### 1. 🔶 Hacker News (Show HN)

**Why**: Single highest-ROI channel for dev tools. One front-page post = thousands of GitHub stars + npm installs overnight.

**Best Practices**:
- Post as **"Show HN: env-doctor — validate, diff, and manage .env files (zero deps)"**
- Post between **9-11 AM ET on Tuesday-Thursday** (peak HN traffic)
- Keep the description **short, technical, honest** — HN hates marketing speak
- Mention specific pain points ("ever deployed to prod with missing DATABASE_URL?")
- Respond to EVERY comment in the first 2 hours
- Don't ask for upvotes — HN detects and penalizes this
- Have the README be impeccable before posting (it's your landing page)

**Expected outcome**: 50-500 stars if it gets traction, 5-20 if it doesn't land

### 2. 🟠 Product Hunt

**Why**: Good for awareness, badge for README, backlinks for SEO. Less technical audience than HN but broader reach.

**Launch Strategy**:
- Launch on a **Tuesday** (less competition than Monday, good engagement)
- Prepare: tagline, description, 3-4 screenshots/GIFs of terminal output, maker comment
- **Tagline**: "The doctor is in — diagnose your .env files before they break production"
- Get 5-10 people to leave genuine comments in the first hour
- Respond to every comment/question
- Add the PH badge to README afterward

**Expected outcome**: 100-300 upvotes if executed well, Dev Tools category feature

### 3. 🐦 Twitter/X Dev Community

**Key accounts/hashtags to target**:
- Use hashtags: `#devtools`, `#nodejs`, `#typescript`, `#dotenv`, `#CLI`
- Tag/mention: devtools aggregator accounts, Node.js community accounts
- Create a **thread** showing the problem → solution → how to use it
- Post a **GIF/video** of env-doctor in action (terminal recordings are engagement bait)
- Tools: `vhs` by Charmbracelet or `asciinema` for terminal recordings

**Content ideas**:
1. "Your .env file is a ticking time bomb 💣 Here's why..." (problem thread)
2. Terminal GIF showing `env-doctor check` catching real errors
3. "I built a CLI tool in a weekend that..." (maker story)
4. Comparison post: "dotenv-linter checks formatting. env-doctor checks everything."

### 4. 💬 Discord Servers

**Relevant servers**:
- **Theo's T3 Community** (~50K members) — heavy TypeScript/Next.js users
- **Reactiflux** (~200K members) — React/Node devs, has #tools channel
- **TypeScript Community** (~50K) — our target audience
- **Node.js Official** — #tools and #packages channels
- **DevOps & Docker** communities
- **Fireship Discord** — dev content consumers

**Approach**: Don't spam. Answer questions about .env issues naturally, mention env-doctor when relevant. Post in #showcase channels.

### 5. 📧 Dev Tool Newsletters

**High-value newsletters to pitch**:
| Newsletter | Subscribers | How to Submit |
|-----------|------------|---------------|
| **JavaScript Weekly** | ~200K | [javascriptweekly.com/submit](https://javascriptweekly.com/submit) |
| **Node Weekly** | ~60K | [nodeweekly.com/submit](https://nodeweekly.com/submit) |
| **Console.dev** | ~30K | [console.dev/submit](https://console.dev/submit) — curated dev tools |
| **Bytes.dev** | ~200K | DM Tyler/Sam on Twitter |
| **TLDR Newsletter** | ~1M+ | [tldr.tech/submit](https://tldr.tech/submit) |
| **DevOps Weekly** | ~40K | Submit via site |
| **Changelog** | ~50K | [changelog.com/submit](https://changelog.com/submit) |

**Pitch template**:
> "env-doctor is a zero-dependency CLI that validates .env files against schemas, diffs environments, masks secrets, and syncs missing vars. Think ESLint for your .env files. MIT licensed, works with any framework."

### 6. 📝 Reddit

**Relevant subreddits**:
- r/node (~200K) — high-value, strict self-promo rules
- r/javascript (~2M) — post as "project showcase"
- r/webdev (~2M) — broader audience
- r/devops (~300K) — CI/CD angle
- r/commandline (~500K) — CLI tool appreciation

**Rules**: Follow each sub's self-promotion guidelines. Don't post to all at once. Space 1-2 weeks apart.

### 7. 📦 GitHub Ecosystem

**Actions that compound over time**:
- **Awesome lists**: Submit to `awesome-nodejs`, `awesome-cli-apps`, `awesome-devtools`
- **GitHub Topics**: Add relevant topics to the repo (dotenv, env, validation, cli, devtools)
- **GitHub Action marketplace**: Publishing the GitHub Action gets free discovery
- **Comparison in README**: "Why env-doctor?" section comparing to alternatives
- **Contributors welcome**: Good first issues attract PRs and stars

### 8. 📹 Content Marketing (Medium-term)

- **Blog post**: "Stop deploying with broken .env files" — publish on dev.to, Medium, Hashnode
- **YouTube**: Short demo video (2-3 min) — "env-doctor in 2 minutes"
- **Terminal recording**: Shareable asciinema/GIF for social media

---

## SEO Strategy

**Target keywords** (monthly search volume estimates):
- "env file validator" — low competition, direct intent
- "dotenv validation" — medium
- "env file linter" — low competition
- "missing environment variables" — problem-aware searchers
- "env file management tool" — buying intent

**Action**: Create a docs site (GitHub Pages) with these terms naturally included.

---

## Launch Timeline

| Day | Action |
|-----|--------|
| D-3 | Polish README, record terminal GIF, prepare Show HN draft |
| D-2 | Publish GitHub Action to marketplace |
| D-1 | Submit to JavaScript Weekly, Node Weekly, Console.dev |
| **D-Day** | Post Show HN (10 AM ET, Tue-Thu) + Twitter thread |
| D+1 | Monitor HN, respond to all comments |
| D+3 | Post to r/node and r/javascript |
| D+7 | Product Hunt launch |
| D+14 | Submit to awesome lists, post to Discord servers |
| D+30 | Blog post on dev.to, YouTube demo |

---

## Metrics to Track

- GitHub stars (vanity but drives trust)
- npm weekly downloads (real usage)
- GitHub Action installs (stickiness)
- Referral sources (where are people finding us?)
- Issues/PRs opened (community engagement)
