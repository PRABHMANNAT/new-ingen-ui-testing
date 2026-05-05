import { NextResponse, type NextRequest } from "next/server"
import type { DemoCandidate } from "@/data/demoCandidates"
import { callOpenAIJson, hasOpenAIKey } from "@/lib/openai"

type NotesResponse = {
  recruiterSummary: string
  fitReasoning: string
  interviewQuestions: string[]
  riskNotes: string
  nextStep: string
  source: "openai" | "mock"
}

type RequestBody = {
  candidate?: DemoCandidate
  roleQuery?: string
  uploadedText?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RequestBody
  const candidate = body.candidate

  if (!candidate) {
    return NextResponse.json({ error: "candidate is required" }, { status: 400 })
  }

  if (!hasOpenAIKey()) {
    return NextResponse.json(mockNotes(candidate, body.roleQuery, body.uploadedText))
  }

  const systemPrompt = "You are an expert startup recruiter. Summarise this candidate based only on the provided evidence. Be concise, practical, and proof-based. If data is missing, say evidence is missing. Return valid JSON."
  const userPrompt = JSON.stringify({
    candidate,
    roleQuery: body.roleQuery,
    uploadedText: body.uploadedText?.slice(0, 5000),
    requiredJsonShape: {
      recruiterSummary: "string",
      fitReasoning: "string",
      interviewQuestions: ["string", "string", "string"],
      riskNotes: "string",
      nextStep: "string",
    },
  })

  const result = await callOpenAIJson<Omit<NotesResponse, "source">>(systemPrompt, userPrompt)
  if (!result.ok) {
    return NextResponse.json(mockNotes(candidate, body.roleQuery, body.uploadedText))
  }

  return NextResponse.json({ ...result.data, source: "openai" satisfies NotesResponse["source"] })
}

function mockNotes(candidate: DemoCandidate, roleQuery?: string, uploadedText?: string): NotesResponse {
  const uploadSignal = uploadedText ? " Uploaded evidence was included, but GPT is not configured so this is a deterministic demo note." : ""
  return {
    recruiterSummary: candidate.notes.whyThisCandidate,
    fitReasoning: `${candidate.name} fits ${roleQuery || candidate.targetRole} through ${candidate.skills.slice(0, 4).join(", ")} evidence. Proof score is ${candidate.proofScore} and simulation score is ${candidate.simulationScore}.${uploadSignal}`,
    interviewQuestions: [
      candidate.notes.bestInterviewAngle,
      `Which ${candidate.skills[0]} project best proves production ownership?`,
      "What evidence would you show to confirm the weakest claim?",
    ],
    riskNotes: candidate.notes.potentialConcerns,
    nextStep: candidate.notes.suggestedNextStep,
    source: "mock",
  }
}
