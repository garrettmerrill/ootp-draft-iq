# OOTP Draft IQ

An intelligent draft analysis tool for OOTP Baseball fantasy leagues. Upload your draft data, customize your strategy, and get personalized rankings.

## Features

- 📊 **CSV Import** - Upload OOTP draft export data
- 🎯 **Smart Rankings** - Customizable composite scoring based on your philosophy
- 💎 **Sleeper Detection** - Find undervalued prospects
- 📈 **Live Draft Sync** - Connect to Stats Plus API for real-time updates
- 👥 **Player Comparison** - Side-by-side prospect analysis
- 🏷️ **Archetype Labels** - Instant player type identification
- 🔍 **Natural Language Search** - Search like "show me available SP with 65+ pot"
- 🌙 **Dark Mode** - Easy on the eyes for those long draft nights

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or use a free tier from Supabase/Vercel)
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ootp-draft-iq.git
   cd ootp-draft-iq
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your values:
   ```
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-random-secret"
   ```
   
   To generate a secret:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deploying to Vercel

### Step 1: Create a Database

**Option A: Vercel Postgres (Recommended)**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Create a new project or select your project
3. Go to the "Storage" tab
4. Click "Create Database" → "Postgres"
5. Copy the connection string

**Option B: Supabase (Free Tier)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (use the "Connection pooling" URL)

### Step 2: Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ootp-draft-iq.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   In the Vercel deployment settings, add:
   
   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Your PostgreSQL connection string |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` |
   | `NEXTAUTH_SECRET` | A random 32+ character string |

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

5. **Initialize Database**
   After deployment, run this in your local terminal (with production DATABASE_URL):
   ```bash
   npx prisma db push
   ```
   
   Or use the Vercel CLI:
   ```bash
   vercel env pull .env.production.local
   npx prisma db push
   ```

### Step 3: Verify Deployment

1. Visit your deployed URL
2. Create an account
3. Upload your OOTP CSV data
4. Start analyzing!

## Project Structure

```
ootp-draft-iq/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── api/           # API routes
│   │   ├── dashboard/     # Protected dashboard pages
│   │   ├── login/         # Auth pages
│   │   └── register/
│   ├── components/        # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── players/       # Player-related components
│   │   └── draft/         # Draft-related components
│   ├── lib/               # Utilities and helpers
│   │   ├── auth.ts        # NextAuth configuration
│   │   ├── csvParser.ts   # CSV parsing logic
│   │   ├── playerAnalysis.ts # Player scoring and analysis
│   │   ├── prisma.ts      # Prisma client
│   │   └── utils.ts       # General utilities
│   ├── hooks/             # Custom React hooks
│   └── types/             # TypeScript types
├── .env.example           # Environment template
├── package.json
└── README.md
```

## Draft Philosophy

The app calculates a composite score for each player based on your customizable weights:

### Global Weights
- **Potential** - How much weight to give future value
- **Overall** - How much weight to give current value
- **Risk** - Penalty for high-risk players
- **Scout Accuracy** - Bonus for reliable scouting
- **Signability** - Bonus for easy signs
- **Age/Class** - College vs High School preference

### Position Weights
- Customize importance of each rating (Power, Contact, Stuff, etc.)
- Separate weights for SP vs RP/CL
- Option to use Contact OR BABIP+K's for hitters

### Presets
- **Balanced** - Default well-rounded approach
- **High Ceiling Gambler** - Maximize upside
- **Safe & Steady** - Minimize risk
- **Pitching Heavy** - Prioritize arms
- **Position Player Focus** - Prioritize bats
- **Premium Positions** - Focus on C, SS, 2B, 3B, CF, SP
- **Tools Over Production** - Raw athleticism focus

## Tiers

Players are grouped into tiers based on composite score:
- **Elite** (80+) - Gold
- **Very Good** (65-79) - Purple
- **Good** (50-64) - Blue
- **Average** (35-49) - Green
- **Filler** (<35) - Gray

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your own league!

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your environment variables are set correctly
3. Make sure your database is accessible
4. Open an issue on GitHub with details

---

Built with ❤️ for OOTP Baseball fans
