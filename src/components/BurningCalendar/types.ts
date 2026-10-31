export type FireType = "major" | "minor"

export interface TimelineStep {
  date: string // "YYYY-MM-DD" (first day when the step covers a range)
  label: string
}

export interface FireEvent {
  id: string
  name: string // shown on the calendar block
  description: string // fire pattern and drivers
  startDate: string // "YYYY-MM-DD"
  endDate: string // "YYYY-MM-DD"
  datesApproximate?: boolean
  location: { place: string; country: string; lat: number; lon: number }
  type?: FireType // not shown right now
  timeline: TimelineStep[]
  sources?: string[]
}