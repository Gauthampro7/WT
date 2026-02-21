# SkillSwap 🎓✨

An ultra-aesthetic, professional skill-exchange platform for college students built with React, Vite, Tailwind CSS, and Framer Motion.

## Features

- 🎨 **5 Beautiful Themes**: Light, Dark, Midnight, Cyberpunk, and Emerald
- 🔐 **Google OAuth Authentication**: Secure login with Google
- 🔍 **Real-time Search & Filtering**: Filter by category (Tech, Arts, Academic, Life Skills) and type (Offering/Seeking)
- ➕ **Create Skills**: Authenticated users can post their skills
- 🎭 **Glassmorphic UI**: Modern glassmorphism effects with backdrop blur
- 🎪 **3D Card Animations**: Interactive skill cards with tilt effects
- 🎉 **Confetti Celebrations**: Animated confetti when requesting trades
- 📱 **Responsive Design**: Works beautifully on all screen sizes
- ⚡ **Lightning Fast**: Built with Vite for optimal performance
- 🗄️ **Supabase Backend**: PostgreSQL database with Row Level Security

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Canvas Confetti** - Confetti animations
- **Supabase** - Backend (PostgreSQL database + Authentication)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works perfectly)

### Quick Setup

1. **Set up Supabase** (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions):
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase-schema.sql` in Supabase SQL Editor
   - Enable Google OAuth in Supabase Authentication settings
   - Get your Supabase URL and anon key from project settings

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
├── src/
│   ├── components/       # React components
│   ├── contexts/         # Theme & Auth providers
│   ├── services/         # Supabase API layer
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── supabase-schema.sql
├── supabase-migration-*.sql
└── README.md
```

## Theme System

The app includes 5 distinct themes defined using CSS variables:

1. **Light** - Clean, high-contrast design
2. **Dark** - Deep charcoal with neon blue accents
3. **Midnight** - Navy blue with slate glass effects
4. **Cyberpunk** - Black background with hot pink/cyan borders
5. **Emerald** - Forest green tones with organic shapes

Themes are managed through React Context and persist in localStorage.

## Usage

1. **Browse Skills** – View and filter skills; use **Campus / Location** to filter by university.
2. **Dashboard** – My Skills, Saved, Requests I sent, Requests I received (login required).
3. **Request Trade** – Click "Request Trade" on a card; add an optional message.
4. **Save** – Bookmark skills with the bookmark icon; find them under Dashboard → Saved.
5. **Profile** – Click a user name on a card to see their skills.
6. **Theme** – Use the palette icon in the header to switch themes.

## License

MIT

## Credits

Built with ❤️ for college students everywhere.
