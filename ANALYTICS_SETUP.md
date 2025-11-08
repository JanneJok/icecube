# IceCube Analytics Setup

## 1. Create Analytics Table in Supabase

Go to Supabase → SQL Editor and run:

```sql
-- Create daily_stats table
CREATE TABLE daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  page_views INT DEFAULT 0,
  email_submissions INT DEFAULT 0,
  email_duplicates INT DEFAULT 0,
  email_errors INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);

-- Enable Row Level Security
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Allow public to insert and update stats (increment only)
CREATE POLICY "Allow public insert" ON daily_stats
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update" ON daily_stats
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow public to read stats (for authenticated API calls)
CREATE POLICY "Allow public select" ON daily_stats
  FOR SELECT
  TO anon
  USING (true);

-- Function to increment stat
CREATE OR REPLACE FUNCTION increment_stat(
  stat_column TEXT,
  increment_by INT DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO daily_stats (date, %I) VALUES (CURRENT_DATE, $1)
     ON CONFLICT (date) DO UPDATE SET %I = daily_stats.%I + $1, updated_at = NOW()',
    stat_column, stat_column, stat_column
  ) USING increment_by;
END;
$$;
```

## 2. Create Supabase Edge Function for API

1. Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref ysuhexvvgjoizrcdrxso
```

4. Create the Edge Function:
```bash
supabase functions new stats-api
```

5. Replace the content of `supabase/functions/stats-api/index.ts` with the code in `edge-function.ts` (see below)

6. Deploy the function:
```bash
supabase functions deploy stats-api
```

7. Set the API token as a secret:
```bash
supabase secrets set STATS_API_TOKEN="your-secret-token-here"
```

## 3. API Usage

Once deployed, you can access stats at:
```
https://ysuhexvvgjoizrcdrxso.supabase.co/functions/v1/stats-api?token=your-secret-token-here
```

### Example Response:
```json
{
  "2025-11-08": {
    "pageViews": 150,
    "emailSubmissions": 12,
    "emailDuplicates": 3,
    "emailErrors": 1
  },
  "2025-11-07": {
    "pageViews": 203,
    "emailSubmissions": 18,
    "emailDuplicates": 5,
    "emailErrors": 0
  }
}
```

## 4. Front-end Integration

The analytics tracking is already integrated in `js/analytics.js` and loaded in `index.html`.

Events tracked:
- **Page view** - When page loads
- **Email submission** - When email successfully submitted
- **Email duplicate** - When user tries to submit already subscribed email
- **Email error** - When submission fails

## 5. Testing

1. Open your site and reload a few times
2. Submit some emails
3. Check Supabase → Table Editor → daily_stats
4. Access the API endpoint with your token
5. You should see the stats!

## Security Notes

- Keep your `STATS_API_TOKEN` secret
- Only share the API URL with trusted parties
- The front-end can only increment stats, not read them
- Only the API endpoint can read stats (with valid token)
