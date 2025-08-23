# Security Guidelines

## Environment Variables

**NEVER commit sensitive credentials to your repository.**

### Required Environment Variables

Create a `.env` file in your project root with:

```env
# Required - Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - EmailJS Configuration (for contact form)
VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### Getting Your Credentials

**Supabase:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **Anon public key** → Use as `VITE_SUPABASE_ANON_KEY`

**EmailJS (Optional):**
1. Go to [EmailJS Dashboard](https://emailjs.com)
2. Create a service and template
3. Get your Service ID, Template ID, and Public Key

### Deployment Environment Variables

When deploying, add these environment variables to your hosting platform:

**Netlify:**
- Go to Site settings → Environment variables
- Add all required variables

**Vercel:**
- Go to Project settings → Environment Variables
- Add all required variables

**Other platforms:**
- Check your platform's documentation for adding environment variables

## Security Best Practices

### Database Security
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Admins have elevated permissions through JWT metadata
- Organization codes are validated server-side

### Authentication
- Uses Supabase Auth for secure user management
- Passwords are hashed and salted automatically
- JWT tokens are used for session management
- Role-based access control is implemented

### API Security
- All database operations go through Supabase's secure API
- Environment variables keep credentials safe
- CORS is properly configured
- Input validation on all forms

### Email Security
- EmailJS is used for contact forms (optional)
- No server-side email credentials exposed
- Rate limiting handled by EmailJS

## What's Safe to Commit

✅ **Safe to commit:**
- `.env.example` (template file)
- Source code
- Configuration files
- Documentation

❌ **NEVER commit:**
- `.env` files
- Actual API keys or passwords
- Database credentials
- EmailJS credentials
- Any sensitive configuration

## Credential Checklist

Before committing code, ensure you've removed:
- [ ] Supabase URL and keys
- [ ] EmailJS service credentials
- [ ] Any hardcoded API keys
- [ ] Database connection strings
- [ ] Third-party service tokens
- [ ] Personal email addresses (use generic ones)
- [ ] Phone numbers
- [ ] Any test credentials

## Reporting Security Issues

If you discover a security vulnerability, please email security@studentstarter.com instead of creating a public issue.