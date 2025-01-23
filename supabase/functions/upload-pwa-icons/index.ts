import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { join } from "https://deno.land/std@0.168.0/path/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Received request to upload PWA icons');
    const formData = await req.formData()
    const file = formData.get('file')
    const size = formData.get('size')
    const type = formData.get('type') // 'any' or 'maskable'
    const format = formData.get('format') // 'png' or 'webp'

    if (!file || !size || !type || !format) {
      console.error('Missing required fields', { file, size, type, format });
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Construct the filename
    const filename = `icon-${size}${type === 'maskable' ? '-maskable' : ''}.${format}`
    const filePath = `pwa/${filename}`

    console.log('Uploading file:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: format === 'webp' ? 'image/webp' : 'image/png'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    console.log('File uploaded successfully:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        path: publicUrl,
        fullPath: filePath
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})