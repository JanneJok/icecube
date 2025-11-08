# Deploy Edge Function - Step by Step

Koska CLI vaatii interaktiivisen kirjautumisen, tee deployment manuaalisesti Supabase Dashboardissa:

## Vaihtoehto A: Deploy Supabase Dashboardin kautta (Helpoin)

### 1. Mene Supabase Dashboardiin
https://supabase.com/dashboard/project/ysuhexvvgjoizrcdrxso

### 2. Navigoi Edge Functions
- Vasemmassa sivupalkissa: **Edge Functions**
- Klikkaa: **Create a new function**

### 3. Luo Function
- **Function name**: `stats-api`
- **Template**: Valitse "HTTP Request" tai tyhjä template

### 4. Kopioi koodi
Kopioi tämä koodi editoriin:

```typescript
// Edge Function for IceCube Analytics API
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    const validToken = Deno.env.get('STATS_API_TOKEN')
    if (!token || token !== validToken) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const limit = parseInt(url.searchParams.get('limit') || '30')

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (error) throw error

    const stats: Record<string, any> = {}
    data?.forEach((row) => {
      stats[row.date] = {
        pageViews: row.page_views || 0,
        emailSubmissions: row.email_submissions || 0,
        emailDuplicates: row.email_duplicates || 0,
        emailErrors: row.email_errors || 0,
      }
    })

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

### 5. Tallenna ja deploy
- Klikkaa **Deploy** tai **Save**

### 6. Aseta Secrets
- Mene: **Edge Functions** → **stats-api** → **Settings** tai **Secrets**
- Lisää secret:
  - **Key**: `STATS_API_TOKEN`
  - **Value**: `oma-salainen-token-tähän` (keksi vahva token, esim: `6ms6Ow$UR2^KRE1d`)

### 7. Testaa
Edge Functionit vaativat Authorization headerin. Testaa curl:lla:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdWhleHZ2Z2pvaXpyY2RyeHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDQzODksImV4cCI6MjA3ODE4MDM4OX0.0UFYz-xd_QmUEdVcKWqRo6D4QcwvAmlKDKSdu7M4ENA" \
  "https://ysuhexvvgjoizrcdrxso.supabase.co/functions/v1/stats-api?token=icecube-stats-secret-2025"
```

Pitäisi palauttaa:
```json
{
  "2025-11-08": {
    "pageViews": 0,
    "emailSubmissions": 0,
    "emailDuplicates": 0,
    "emailErrors": 0
  }
}
```

**API URL omaan koodiin:**
```javascript
const response = await fetch(
  'https://ysuhexvvgjoizrcdrxso.supabase.co/functions/v1/stats-api?token=icecube-stats-secret-2025',
  {
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdWhleHZ2Z2pvaXpyY2RyeHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDQzODksImV4cCI6MjA3ODE4MDM4OX0.0UFYz-xd_QmUEdVcKWqRo6D4QcwvAmlKDKSdu7M4ENA'
    }
  }
);
const stats = await response.json();
```

---

## Vaihtoehto B: CLI (Vaatii access token)

### 1. Hanki Access Token
- Mene: https://supabase.com/dashboard/account/tokens
- Klikkaa **Generate new token**
- Kopioi token

### 2. Kirjaudu CLI:ssä
```bash
cd c:\Users\janne\Documents\GitHub\icecube
npx supabase login --token YOUR_ACCESS_TOKEN
```

### 3. Linkitä projekti
```bash
npx supabase link --project-ref ysuhexvvgjoizrcdrxso
```

### 4. Deploy function
```bash
npx supabase functions deploy stats-api
```

### 5. Aseta secret
```bash
npx supabase secrets set STATS_API_TOKEN="your-secret-token-here"
```

---

## Valmis!

API URL:
```
https://ysuhexvvgjoizrcdrxso.supabase.co/functions/v1/stats-api?token=YOUR_TOKEN
```

Muista:
- Vaihda `YOUR_TOKEN` omaan salaiseeen tokeniin
- Älä jaa tokenia julkisesti
- Stats päivittyvät automaattisesti kun käyttäjät vierailevat sivulla
