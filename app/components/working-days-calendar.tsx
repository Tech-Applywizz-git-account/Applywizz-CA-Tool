"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle } from "lucide-react"

interface WorkingDaysCalendarProps {
    monthOffset: number;
    periodName: string;
    onRecalculateNeeded: () => Promise<void>;
}

export function WorkingDaysCalendar({ monthOffset, periodName, onRecalculateNeeded }: WorkingDaysCalendarProps) {
    const [excludedDates, setExcludedDates] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Calculate dates of the selected month
    const targetDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfWeek = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday, etc.

    const getFormattedDateStr = (dayNum: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    }

    const fetchExcludedDates = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("resume_settings")
                .select("value")
                .eq("key", `resume_excluded_dates_${periodName}`)
                .maybeSingle()

            if (data && data.value) {
                setExcludedDates(JSON.parse(data.value))
            } else {
                setExcludedDates([])
            }
        } catch (e) {
            console.error("Error fetching calendar settings:", e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchExcludedDates()
    }, [periodName])

    const handleToggleDate = (dayNum: number) => {
        const dateStr = getFormattedDateStr(dayNum)
        setExcludedDates((prev) => {
            if (prev.includes(dateStr)) {
                return prev.filter((d) => d !== dateStr)
            } else {
                return [...prev, dateStr]
            }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from("resume_settings")
                .upsert(
                    { key: `resume_excluded_dates_${periodName}`, value: JSON.stringify(excludedDates) },
                    { onConflict: "key" }
                )

            if (!error) {
                await onRecalculateNeeded()
                alert("Calendar settings saved and incentives recalculated!")
            } else {
                alert("Failed to save calendar: " + error.message)
            }
        } catch (e: any) {
            alert("Error saving: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    // Build grid cells
    const calendarCells = []
    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarCells.push(<div key={`empty-${i}`} className="h-12 bg-slate-50/30 border border-slate-100 rounded-lg"></div>)
    }
    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = getFormattedDateStr(day)
        const isExcluded = excludedDates.includes(dateStr)
        const dateObj = new Date(year, month, day)
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

        calendarCells.push(
            <button
                key={`day-${day}`}
                onClick={() => handleToggleDate(day)}
                type="button"
                className={`h-12 flex flex-col items-center justify-between p-1.5 border rounded-lg transition-all font-bold ${isExcluded
                        ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100"
                        : isWeekend
                            ? "bg-slate-100/50 border-slate-200 text-slate-400 hover:bg-slate-100"
                            : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/20"
                    }`}
            >
                <span className="text-xs leading-none">{day}</span>
                <span className="text-[9px] uppercase tracking-tighter scale-90 leading-none">
                    {isExcluded ? "HOLIDAY" : isWeekend ? "WEEKEND" : "WORK"}
                </span>
            </button>
        )
    }

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    return (
        <Card className="border border-slate-200 shadow-xl overflow-hidden rounded-2xl bg-white">
            <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white py-6 px-8 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-black flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-indigo-400" />
                        Exclude Holidays & Non-Working Days
                    </CardTitle>
                    <p className="text-xs text-indigo-200 mt-1">
                        Select dates in {periodName} to subtract them from the working days quota calculation
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="bg-indigo-500 hover:bg-indigo-600 font-bold"
                >
                    {saving ? "Recalculating..." : "Save Calendar Config"}
                </Button>
            </CardHeader>
            <CardContent className="p-8">
                {loading ? (
                    <div className="flex justify-center items-center py-12 text-slate-400">
                        <span className="font-semibold animate-pulse">Syncing calendar...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-4 flex-wrap text-xs font-semibold bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-white border border-slate-200 rounded"></div>
                                <span className="text-slate-600">Standard Workday (Mon-Fri)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded"></div>
                                <span className="text-slate-600">Standard Weekend (Sat-Sun)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-rose-50 border border-rose-200 rounded"></div>
                                <span className="text-rose-700 font-bold">Holiday / Custom Off (Subtracted from count)</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {weekdays.map((wd) => (
                                <div key={wd} className="text-center text-xs font-extrabold text-slate-400 uppercase py-1">
                                    {wd}
                                </div>
                            ))}
                            {calendarCells}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                            <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                            <p>
                                Note: Selecting standard workdays (Mon-Fri) as holidays will dynamically reduce the baseline target and required quota for all representatives.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
