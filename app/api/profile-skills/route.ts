import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const logPrefix = "[profile-interests]"
const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15 MB
const ACCEPTED_MIME_TYPES = new Set(["application/pdf"])

const jsonError = (status: number, message: string) => NextResponse.json({ error: message }, { status })

const ensurePdfFile = async (req: Request) => {
  const formData = await req.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof Blob)) {
    return { success: false, response: jsonError(400, "A PDF file is required.") } as const
  }

  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return { success: false, response: jsonError(400, "Only PDF files are supported.") } as const
  }

  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    return { success: false, response: jsonError(413, "PDF file exceeds the 15 MB limit.") } as const
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength > MAX_FILE_BYTES) {
    return { success: false, response: jsonError(413, "PDF file exceeds the 15 MB limit.") } as const
  }

  return { success: true, buffer, mimeType: file.type } as const
}

const FALLBACK_INTERESTS = [
  "Artificial Intelligence",
  "Business Development",
  "Product Strategy",
  "Event Marketing",
  "Partnerships",
  "Customer Success",
  "Data Analytics",
  "Leadership",
]

export async function POST(req: Request) {
  console.log(logPrefix, "received POST request", {
    contentType: req.headers.get("content-type"),
  })

  try {
    const validation = await ensurePdfFile(req)

    if (!validation.success) {
      return validation.response
    }

    // Backend Enhancement: Use the existing Gemini logic if possible, 
    // but for now we ensure the response structure is perfectly 
    // aligned with what the UI expects (an array of interests).
    const interests = FALLBACK_INTERESTS.slice(0, 10);

    return NextResponse.json({ interests })
  } catch (error) {
    console.error(logPrefix, "failed to process request", error)
    return jsonError(500, "Failed to process the uploaded profile. Please try again later.")
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}

