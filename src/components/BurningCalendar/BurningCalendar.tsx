import { useState } from "react"
import type { FireEvent } from "./types"
import "./BurningCalendar.css"

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

const pad = (n: number) => String(n).padStart(2, "0")
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })
const panelFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})
const longFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})
const shortFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })
const pretty = (key: string) => shortFmt.format(parseKey(key))

// Every day shown for a month: full weeks, Sunday to Saturday.
function buildGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  const end = new Date(last)
  end.setDate(last.getDate() + (6 - last.getDay()))
  const days: Date[] = []
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d))
  return days
}

const phaseName = (i: number, n: number) =>
  n === 1 ? "Event" : i === 0 ? "Start" : i === n - 1 ? "End" : "Escalation"

const durationDays = (e: FireEvent) =>
  Math.round((parseKey(e.endDate).getTime() - parseKey(e.startDate).getTime()) / 86400000) + 1

interface Props {
  events?: FireEvent[]
}

export default function BurningCalendar({ events = [] }: Props) {
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState(() => new Date())

  const eventsOn = (d: Date) => {
    const k = dayKey(d)
    return events.filter((e) => k >= e.startDate && k <= e.endDate)
  }

  const monthStart = dayKey(new Date(month.getFullYear(), month.getMonth(), 1))
  const monthEnd = dayKey(new Date(month.getFullYear(), month.getMonth() + 1, 0))
  const monthCount = events.filter((e) => e.startDate <= monthEnd && e.endDate >= monthStart).length

  const todayKey = dayKey(new Date())
  const selectedKey = dayKey(selected)
  const selectedEvents = eventsOn(selected)
  const goMonth = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <section className="cal-section section-pad" id="calendar">
      <div className="wrap">
        <div className="cal-head">
          <div>
            <span className="eyebrow coral">Event calendar</span>
            <h2>Fires: When and Where</h2>
          </div>
          <div className="cal-controls">
            <button type="button" className="round-control" aria-label="Previous month" onClick={() => goMonth(-1)}>
              ‹
            </button>
            <span className="cal-month" aria-live="polite">
              {monthFmt.format(month)}
            </span>
            <button type="button" className="round-control" aria-label="Next month" onClick={() => goMonth(1)}>
              ›
            </button>
            <button
              type="button"
              className="cal-today"
              onClick={() => {
                setMonth(new Date())
                setSelected(new Date())
              }}
            >
              Today
            </button>
          </div>
        </div>

        <div className="cal-layout">
          <div className="cal-grid-card">
            <div className="cal-weekdays">
              {WEEKDAYS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="cal-days">
              {buildGrid(month).map((day) => {
                const list = eventsOn(day)
                const key = dayKey(day)
                const classes = [
                  "cal-day",
                  day.getMonth() !== month.getMonth() ? "is-outside" : "",
                  key === selectedKey ? "is-selected" : "",
                  key === todayKey ? "is-today" : "",
                ].join(" ")
                return (
                  <button
                    key={key}
                    type="button"
                    className={classes}
                    onClick={() => setSelected(day)}
                    aria-pressed={key === selectedKey}
                    aria-label={`${longFmt.format(day)}, ${list.length} fire events`}
                  >
                    <span className="cal-num">{day.getDate()}</span>
                    {list.slice(0, 2).map((e) => (
                      <span key={e.id} className="cal-pill">
                        {e.name}
                      </span>
                    ))}
                    {list.length > 2 && <span className="cal-more">+{list.length - 2} more</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="cal-panel" aria-live="polite">
            <h3 className="cal-date">{panelFmt.format(selected)}</h3>
            <p className="cal-count">
              {monthCount} {monthCount === 1 ? "fire" : "fires"} this month
            </p>

            {selectedEvents.length === 0 ? (
              <p className="cal-empty">No fire events recorded for this day.</p>
            ) : (
              <ul className="cal-events">
                {selectedEvents.map((e) => {
                  const steps = [...e.timeline].sort((a, b) => a.date.localeCompare(b.date))
                  return (
                    <li key={e.id}>
                      <h4 className="cal-name">{e.name}</h4>

                      <div className="cal-field">
                        <p className="cal-label">Where</p>
                        <p>
                          {e.location.place}, {e.location.country}
                        </p>
                      </div>

                      <div className="cal-field">
                        <p className="cal-label">When</p>
                        <p>
                          {pretty(e.startDate)} to {pretty(e.endDate)} ({durationDays(e)} days)
                          {e.datesApproximate ? ", dates approximate" : ""}
                        </p>
                      </div>

                      <div className="cal-field">
                        <p className="cal-label">Pattern and drivers</p>
                        <p>{e.description}</p>
                      </div>

                      <div className="cal-field">
                        <p className="cal-label">How it unfolded</p>
                        <ol className="cal-steps">
                          {steps.map((t, i) => (
                            <li key={t.date + t.label}>
                              <strong>
                                {phaseName(i, steps.length)} · {pretty(t.date)}
                              </strong>
                              <br />
                              {t.label}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {e.sources && e.sources.length > 0 && (
                        <div className="cal-field">
                          <p className="cal-label">Sources</p>
                          <p className="cal-sources">{e.sources.join(" · ")}</p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}