// Edge Function for IceCube Analytics API
// Returns daily stats with token authentication

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get token from query params
    const url = new URL(req.url)
    const token = url.searchParams.get('token')

    // Validate token
    const validToken = Deno.env.get('STATS_API_TOKEN')

    // Debug log (remove in production)
    console.log('Received token:', token)
    console.log('Expected token:', validToken)
    console.log('Token match:', token === validToken)

    if (!token || token !== validToken) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid or missing token',
          debug: {
            receivedToken: token ? 'present' : 'missing',
            expectedToken: validToken ? 'present' : 'missing'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get limit parameter (default 30 days)
    const limit = parseInt(url.searchParams.get('limit') || '30')

    // Fetch stats from database
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    // Transform data to match the format from your example
    const stats: Record<string, any> = {}

    data?.forEach((row) => {
      const date = row.date
      stats[date] = {
        pageViews: row.page_views || 0,
        emailSubmissions: row.email_submissions || 0,
        emailDuplicates: row.email_duplicates || 0,
        emailErrors: row.email_errors || 0,
      }
    })

    return new Response(
      JSON.stringify(stats),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
