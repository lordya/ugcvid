# AFP UGC Platform

AI-driven UGC video generation platform built with Next.js, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Shadcn/UI components
- **Database & Auth:** Supabase
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lordya/ugcvid.git
   cd ugcvid
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Project Structure

```
ugc/
├── Docs/                    # Architecture & Story documentation
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Shared utilities
│   │   └── supabase/        # Supabase client/server setup
│   └── types/               # TypeScript definitions
├── public/                  # Static assets
└── package.json
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Add them to your `.env.local` file

### Deployment

This project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

## Development

### Styling

This project uses:
- **Tailwind CSS** for utility-first styling
- **Shadcn/UI** for component primitives
- **Dark mode** as the default theme (background: `#0A0E14`)

### Supabase Client Pattern

The project uses the recommended Server/Client pattern for Supabase:

- `src/lib/supabase/server.ts` - Server-side client (for API routes, Server Components)
- `src/lib/supabase/client.ts` - Client-side client (for Client Components)

## License

ISC

