import { defineEventHandler, readMultipartFormData } from 'h3'

// Proxy endpoint to avoid browser CORS by forwarding the multipart upload
// to the local OCR server from the server-side environment.
export default defineEventHandler(async (event) => {
  try {
    const formParts = await readMultipartFormData(event)
    if (!formParts || formParts.length === 0) {
      return new Response(JSON.stringify({ error: 'No form data provided' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Build FormData to forward upstream
    const upstreamForm = new FormData()

    for (const part of formParts) {
      if (part.name === 'file' && part.type && part.filename && part.data) {
        // Validate PDF file type
        if (part.type !== 'application/pdf') {
          return new Response(JSON.stringify({ error: 'Seuls les fichiers PDF sont acceptés' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
          })
        }
        const blob = new Blob([part.data], { type: part.type })
        upstreamForm.append('file', blob, part.filename)
      } else if (part.name && part.data) {
        upstreamForm.append(part.name, part.data.toString())
      }
    }

    // Ensure force_ocr is true; allow client to send it too
    if (!upstreamForm.has('force_ocr')) {
      upstreamForm.append('force_ocr', 'true')
    }

    // Forward to local OCR server
    const upstreamResponse = await fetch('http://127.0.0.1:5001/extract', {
      method: 'POST',
      headers: {
        'ocr_lang': 'fra',
        'include_images': 'true',
        'include_links': 'true',
        'force_ocr': 'true'
      },
      body: upstreamForm
    })

    // Stream back upstream response
    const contentType = upstreamResponse.headers.get('content-type') || 'application/json'
    const body = await upstreamResponse.text()
    return new Response(body, { status: upstreamResponse.status, headers: { 'content-type': contentType } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Proxy error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
})
