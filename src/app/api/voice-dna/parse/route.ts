import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const fileName = file.name.toLowerCase()
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf')
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')

    if (!isPdf && !isDocx) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported for parsing' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File must be less than 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let extractedText = ''

    if (isPdf) {
      // Import pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse')

      // Parse PDF
      const data = await pdfParse(buffer)

      if (!data.text || data.text.trim().length === 0) {
        return NextResponse.json(
          { error: 'Could not extract text from PDF. The file may be image-based or corrupted.' },
          { status: 400 }
        )
      }

      extractedText = data.text
    } else if (isDocx) {
      // Parse DOCX using mammoth
      const result = await mammoth.extractRawText({ buffer })

      if (!result.value || result.value.trim().length === 0) {
        return NextResponse.json(
          { error: 'Could not extract text from DOCX. The file may be corrupted or empty.' },
          { status: 400 }
        )
      }

      extractedText = result.value
    }

    // Clean up the extracted text
    const cleanedText = extractedText
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Restore paragraph breaks (double newlines)
      .replace(/\.\s+/g, '.\n\n')
      // Clean up bullet points
      .replace(/•\s*/g, '- ')
      .trim()

    return NextResponse.json({
      content: cleanedText,
    })
  } catch (error) {
    console.error('File parse error:', error)

    return NextResponse.json(
      { error: 'Failed to parse file. Please try a different file.' },
      { status: 500 }
    )
  }
}
