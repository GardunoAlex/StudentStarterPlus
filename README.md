# Student Starter+ 

A comprehensive platform connecting students with educational and professional opportunities including programs, mentorships, and events.

## Features

- **Student Portal**: Browse and apply to opportunities
- **Organization Dashboard**: Create and manage opportunities
- **Admin Panel**: Manage organization codes and platform oversight
- **Real-time Updates**: Live opportunity feeds and notifications
- **Advanced Filtering**: Search by major, GPA, location, and more
- **Profile Management**: Customizable user profiles with image upload
- **Responsive Design**: Optimized for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify/Vercel ready

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd student-starter-plus
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and create a project
2. Go to Settings → API
3. Copy your Project URL and anon public key

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your application.

## Database Setup

The application uses Supabase with the following tables:
- `profiles` - User profiles and roles
- `organization_codes` - Organization access codes
- `opportunities` - Job/program listings

All migrations are included in the `supabase/migrations` folder.

## User Roles

### Students
- Browse and filter opportunities
- Save bookmarks
- Apply to programs
- Manage profile

### Organizations
- Create and manage opportunities
- View application analytics
- Update organization details

### Admins
- Manage organization codes
- Oversee platform activity
- Access all features

## Deployment

### Option 1: Netlify (Recommended)
1. Push code to GitHub
2. Connect repository to Netlify
3. Add environment variables
4. Deploy automatically

### Option 2: Vercel
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy with one click

See `DEPLOYMENT.md` for detailed deployment instructions.

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── lib/                # Third-party library configs

supabase/
├── migrations/         # Database migrations
└── functions/          # Edge functions
```

## Environment Variables

Required environment variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@studentstarter.com or create an issue in this repository.