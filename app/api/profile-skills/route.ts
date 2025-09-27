import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const logPrefix = "[profile-skills]"
const MODEL_NAME = "gemini-1.5-flash"
const MAX_FILE_BYTES = 15 * 1024 * 1024 // 15 MB
const ACCEPTED_MIME_TYPES = new Set(["application/pdf"])
const MIN_SKILL_COUNT = 5
const MAX_SKILL_COUNT = 20

const PROMPT = [
  "You are an expert career coach specializing in event networking.",
  "The user uploads a PDF resume or LinkedIn export. Analyse the document and return a JSON object with a single property `skills` containing 5 to 20 unique strings.",
  "Prioritize core competencies, technical proficiencies, methodologies, and soft skills that are relevant to event networking and professional collaboration.",
  "Exclude job titles, company names, education details, certifications, dates, or responsibilities.",
  "Format each skill in Title Case (e.g. \"Strategic Partnerships\").",
  "Return strictly valid JSON that matches this TypeScript type: { skills: string[] }.",
].join("\n")

type SkillExtractionResponse = {
  skills?: unknown
}

type PdfValidationResult =
  | { success: true; buffer: Buffer; mimeType: string }
  | { success: false; response: NextResponse }

const jsonError = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status })

const sanitizeResponse = (raw: string) => raw.replace(/```json|```/gi, "").trim()

const dedupeSkills = (skills: string[]) => {
  const seen = new Set<string>()
  return skills
    .map((skill) => skill.trim())
    .filter((skill) => {
      if (!skill) {
        return false
      }
      const normalized = skill.toLowerCase()
      if (seen.has(normalized)) {
        return false
      }
      seen.add(normalized)
      return true
    })
}

const parseSkills = (raw: string) => {
  if (!raw) {
    return []
  }

  try {
    const cleaned = sanitizeResponse(raw)
    const parsed = JSON.parse(cleaned) as SkillExtractionResponse

    if (!Array.isArray(parsed.skills)) {
      return []
    }

    const filtered = parsed.skills.filter((entry): entry is string => typeof entry === "string")
    return dedupeSkills(filtered).slice(0, MAX_SKILL_COUNT)
  } catch (error) {
    console.warn(`${logPrefix} failed to parse model response`, {
      error,
      rawPreview: raw.slice(0, 200),
    })
    return []
  }
}

const ensurePdfFile = async (req: Request): Promise<PdfValidationResult> => {
  const formData = await req.formData()
  const file = formData.get("file")

  if (!file || !(file instanceof Blob)) {
    return { success: false, response: jsonError(400, "A PDF file is required.") }
  }

  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return { success: false, response: jsonError(400, "Only PDF files are supported.") }
  }

  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    return { success: false, response: jsonError(413, "PDF file exceeds the 15 MB limit.") }
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  if (buffer.byteLength > MAX_FILE_BYTES) {
    return { success: false, response: jsonError(413, "PDF file exceeds the 15 MB limit.") }
  }

  return { success: true, buffer, mimeType: file.type }
}

export async function POST(req: Request) {
  console.log(logPrefix, "received POST request", {
    contentType: req.headers.get("content-type"),
  })

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    return jsonError(500, "Missing GOOGLE_GEMINI_API_KEY environment variable.")
  }

  try {
    const validation = await ensurePdfFile(req)

    if (!validation.success) {
      return validation.response
    }

    const { buffer, mimeType } = validation

    console.log(logPrefix, "processing PDF", { byteLength: buffer.byteLength })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const result = await model.generateContent({
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            {
              inlineData: {
                data: buffer.toString("base64"),
                mimeType,
              },
            },
          ],
        },
      ],
    })

    const raw = result.response?.text() ?? ""
    const skills = parseSkills(raw)

    if (skills.length < MIN_SKILL_COUNT) {
      console.warn(logPrefix, "insufficient skills returned", {
        count: skills.length,
        rawPreview: raw.slice(0, 200),
      })
      return NextResponse.json(
        {
          error: "Unable to extract enough skills from the provided PDF. Please review the document and try again.",
          skills,
        },
        { status: 502 },
      )
    }

    console.log(logPrefix, "returning skills", { count: skills.length })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error(logPrefix, "failed to process request", error)
    return jsonError(500, "Failed to process the uploaded profile. Please try again later.")
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" })
}

