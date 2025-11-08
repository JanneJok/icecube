# IceCube - Coming Soon Page Setup

## Supabase Configuration

### 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New project"**
3. Fill in details:
   - **Name:** `icecube`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest (e.g., `eu-central-1` for Europe)
   - **Pricing Plan:** Free
4. Click **"Create new project"** (takes ~2 minutes)

### 2. Create Database Table

Once the project is ready:

1. Left sidebar → **SQL Editor**
2. Click **"New query"**
3. Copy and run this SQL:

```sql
-- Create table for email subscribers
CREATE TABLE email_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'coming_soon_page'
);

-- Create indexes for faster queries
CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_created_at ON email_subscribers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public insert (only email submission)
CREATE POLICY "Allow public insert" ON email_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow public select (to check for duplicates)
CREATE POLICY "Allow public select own email" ON email_subscribers
  FOR SELECT
  TO anon
  USING (true);
```

4. Click **"Run"** (or press F5)

### 3. Get API Keys

1. Left sidebar → **Project Settings** (gear icon at bottom)
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (long text starting with `eyJ...`)

### 4. Update index.html

Open [index.html](./index.html) and find these lines (around line 358-359):

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...your-actual-key';
```

### 5. Test It!

1. Open `index.html` in your browser
2. Enter an email address
3. Click "Subscribe"
4. You should see a success message!

### 6. View Collected Emails

To see collected emails:

1. Go to Supabase Dashboard
2. Left sidebar → **Table Editor**
3. Click **email_subscribers**
4. You'll see all submitted emails!

## Optional: Export Emails

To export emails to CSV:

1. Go to Table Editor → email_subscribers
2. Click the **"..."** menu (top right)
3. Select **"Download as CSV"**

## Next Steps

- Add email confirmation (double opt-in)
- Integrate with Mailchimp/SendGrid
- Create an admin dashboard
- Add analytics

## Troubleshooting

**Email not submitting?**
- Check browser console for errors
- Verify Supabase URL and key are correct
- Make sure the SQL table was created successfully

**"This email is already subscribed" error?**
- This is expected if you try to submit the same email twice
- The database enforces unique emails

**"Service not configured" error?**
- You haven't updated the Supabase credentials in index.html yet
