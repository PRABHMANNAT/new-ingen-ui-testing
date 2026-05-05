export type InterviewStatus = "confirmed" | "pending" | "rescheduled"

export type InterviewStage = "Technical" | "Culture Fit" | "Final Round" | "Intro Call"

export type Interview = {
  id: string
  candidate: string
  role: string
  date: string
  time: string
  stage: InterviewStage
  status: InterviewStatus
}

export const INTERVIEWS_MOCK: Interview[] = [
  { id: "1", candidate: "Priya Mehta", role: "Senior Backend Engineer", date: "2026-05-07", time: "10:00 AM", stage: "Technical", status: "confirmed" },
  { id: "2", candidate: "Liam Torres", role: "Product Designer", date: "2026-05-07", time: "2:30 PM", stage: "Culture Fit", status: "pending" },
  { id: "3", candidate: "Anika Sharma", role: "Data Analyst", date: "2026-05-09", time: "11:00 AM", stage: "Final Round", status: "confirmed" },
  { id: "4", candidate: "James Wu", role: "Frontend Engineer", date: "2026-05-12", time: "3:00 PM", stage: "Intro Call", status: "confirmed" },
  { id: "5", candidate: "Sara Okafor", role: "ML Engineer", date: "2026-05-14", time: "9:30 AM", stage: "Technical", status: "rescheduled" },
]
