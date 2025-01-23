import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const formData = await req.formData()
    const productId = formData.get('productId')?.toString()
    const file = formData.get('file') as File
    const webpFile = formData.get('webp') as File

    if (!productId || !file) {
      throw new Error('Product ID and file are required')
    }

    console.log('Processing upload for product:', productId);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate filenames
    const originalName = file.name.replace(/[^\x00-\x7F]/g, '')
    const baseName = originalName.split('.')[0]
    const fileExt = originalName.split('.').pop()
    const webpFileName = `${baseName}.webp`
    
    // Upload paths
    const originalPath = `products/${productId}/${originalName}`
    const webpPath = `products/${productId}/${webpFileName}`

    console.log(`Uploading files:
      Original: ${originalPath}
      WebP: ${webpPath}
    `);

    // Upload original file
    const { error: originalError } = await supabase.storage
      .from('media')
      .upload(originalPath, file, {
        contentType: file.type,
        upsert: true
      })

    if (originalError) {
      console.error('Error uploading original file:', originalError);
      throw originalError;
    }

    // Upload WebP version if provided
    if (webpFile) {
      const { error: webpError } = await supabase.storage
        .from('media')
        .upload(webpPath, webpFile, {
          contentType: 'image/webp',
          upsert: true
        })

      if (webpError) {
        console.error('Error uploading WebP file:', webpError);
        throw webpError;
      }
    }

    // Get public URLs
    const { data: originalUrl } = supabase.storage
      .from('media')
      .getPublicUrl(originalPath)

    const { data: webpUrl } = webpFile ? supabase.storage
      .from('media')
      .getPublicUrl(webpPath) : { data: null }

    console.log('Successfully uploaded files');

    // Update product with URLs
    const { error: updateError } = await supabase
      .from('products')
      .update({
        image_url: originalUrl.publicUrl,
        media: {
          original: originalUrl.publicUrl,
          webp: webpUrl?.publicUrl || null
        }
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Error updating product:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: 'Files uploaded successfully',
        originalUrl: originalUrl.publicUrl,
        webpUrl: webpUrl?.publicUrl || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process files', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})