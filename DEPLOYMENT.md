# Quick Deployment Guide

## Option 1: Deploy to Netlify (Recommended)

1. **Prepare your repository:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository
   - Build settings are auto-detected from `netlify.toml`
   - Add environment variables:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

3. **Deploy!** 
   - Click "Deploy site"
   - Your site will be live in minutes

## Option 2: Deploy to Vercel

1. **Prepare your repository** (same as above)

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables in project settings
   - Deploy automatically

## Getting Your Supabase Credentials

1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL (VITE_SUPABASE_URL)
   - Anon public key (VITE_SUPABASE_ANON_KEY)

## Testing Your Deployment

After deployment, test these features:
- [ ] Homepage loads correctly
- [ ] Organization count displays (should show 16)
- [ ] User registration works
- [ ] Organization login works
- [ ] Creating opportunities works
- [ ] Viewing opportunities works

## Troubleshooting

**Build fails?**
- Check that all dependencies are in package.json
- Ensure environment variables are set
- Check build logs for specific errors

**App loads but features don't work?**
- Verify environment variables are set correctly
- Check browser console for errors
- Ensure Supabase RLS policies allow public access where needed

**Database connection issues?**
- Verify Supabase URL and key are correct
- Check that your Supabase project is not paused
- Ensure RLS policies are configured correctly