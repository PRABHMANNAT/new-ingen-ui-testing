
import React from "react"
import { TEAM_SKILLS_GAP, MARKET_PULSE, HIRING_FORECAST } from "@/lib/talent-data"
import {
    Users, TrendingUp, DollarSign, Brain,
    Briefcase, AlertTriangle, ArrowRight,
    Target, BarChart
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TalentIntelligenceView() {
    return (
        <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#241f18] dark:text-white tracking-tight">Talent Intelligence</h1>
                    <p className="text-sm text-[#241f18]/55 dark:text-white/50 mt-1">Strategic workforce planning & market analysis.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                    <Brain className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-medium text-violet-400">AI Forecasting Active</span>
                </div>
            </div>

            {/* Top Grid: Forecast & Cost */}
            <div className="grid grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-[#241f18]/[0.02] dark:bg-white/[0.02] border border-[#ded2c2] dark:border-white/10 relative overflow-hidden group hover:border-[#ded2c2] dark:hover:border-white/20 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-12 h-12 text-[#241f18] dark:text-white" />
                    </div>
                    <p className="text-xs font-semibold text-[#241f18]/45 dark:text-white/40 uppercase tracking-wider mb-2">Time to Fill</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-[#241f18] dark:text-white">{HIRING_FORECAST.timeToFill}</h2>
                        <span className="text-sm text-[#241f18]/55 dark:text-white/50">days</span>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            {HIRING_FORECAST.pipelineVelocity}
                        </span>
                        <span className="text-[10px] text-[#241f18]/45 dark:text-white/30">faster than avg</span>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-[#241f18]/[0.02] dark:bg-white/[0.02] border border-[#ded2c2] dark:border-white/10 relative overflow-hidden group hover:border-[#ded2c2] dark:hover:border-white/20 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="w-12 h-12 text-emerald-400" />
                    </div>
                    <p className="text-xs font-semibold text-[#241f18]/45 dark:text-white/40 uppercase tracking-wider mb-2">Cost Per Hire</p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-4xl font-bold text-[#241f18] dark:text-white">{HIRING_FORECAST.costPerHire}</h2>
                    </div>
                    <p className="text-xs text-[#241f18]/45 dark:text-white/30 mt-4">
                        Saved <span className="text-emerald-400">{HIRING_FORECAST.savingsVsAgency}</span> vs Agency
                    </p>
                </div>

                <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-violet-500/20 relative overflow-hidden">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-200 uppercase tracking-wider mb-4">Projected Hires (Q2)</p>
                    <div className="flex items-end justify-between h-20 px-2 gap-2">
                        {HIRING_FORECAST.projectedHires.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-violet-500/30 rounded-t-lg relative group-hover:bg-violet-400/50 transition-colors" style={{ height: `${h.count * 20}%` }}>
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-[#241f18] dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h.count}
                                    </div>
                                </div>
                                <span className="text-[10px] text-[#241f18]/55 dark:text-white/50 font-medium uppercase">{h.month}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gap Analysis Heatmap */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 p-6 rounded-3xl bg-[#241f18]/[0.02] dark:bg-white/[0.02] border border-[#ded2c2] dark:border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-[#241f18] dark:text-white">Skills Gap Analysis</h3>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-[#241f18]/5 dark:bg-white/5 border-[#ded2c2] dark:border-white/10 hover:bg-[#241f18]/10 dark:hover:bg-white/10">
                            Re-calibtrate
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {TEAM_SKILLS_GAP.map((skill, i) => {
                            const isGap = skill.status.includes("Gap")
                            const isCritical = skill.status.includes("Critical")
                            return (
                                <div key={i} className="group">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {isCritical && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                            <span className="text-sm font-medium text-[#241f18]/90 dark:text-white/90">{skill.skill}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase ${isCritical ? 'text-red-400' : isGap ? 'text-amber-400' : 'text-emerald-400'}`}>
                                            {skill.status}
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full bg-[#241f18]/5 dark:bg-white/5 overflow-hidden relative">
                                        {/* Target Marker */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-[#241f18]/30 dark:bg-white/30 z-10" style={{ left: `${skill.target}%` }} />

                                        {/* Current Bar */}
                                        <div
                                            className={`h-full rounded-full ${isCritical ? 'bg-red-500' : isGap ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${skill.current}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-[#241f18]/45 dark:text-white/20">
                                        <span>Current: {skill.current}%</span>
                                        <span>Target: {skill.target}%</span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Market Pulse Ticker */}
                <div className="col-span-4 p-6 rounded-3xl bg-[#241f18]/[0.02] dark:bg-white/[0.02] border border-[#ded2c2] dark:border-white/10 flex flex-col">
                    <div className="flex items-center gap-2 mb-6">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-semibold text-[#241f18] dark:text-white">Market Pulse</h3>
                    </div>

                    <div className="flex-1 space-y-4">
                        {MARKET_PULSE.map((role, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-[#241f18]/5 dark:bg-black/40 border border-[#ded2c2]/60 dark:border-white/5 hover:border-[#ded2c2] dark:hover:border-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-medium text-[#241f18] dark:text-white">{role.role}</h4>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        {role.trend}
                                    </span>
                                </div>
                                <p className="text-xs text-[#241f18]/55 dark:text-white/50 mb-3">{role.salary}</p>
                                <div className="flex items-center gap-2">
                                    <div className="px-2 py-0.5 rounded bg-[#241f18]/5 dark:bg-white/5 text-[10px] text-[#241f18]/45 dark:text-white/40 border border-[#ded2c2]/60 dark:border-white/5">
                                        Supply: {role.supply}
                                    </div>
                                    <div className="px-2 py-0.5 rounded bg-[#241f18]/5 dark:bg-white/5 text-[10px] text-[#241f18]/45 dark:text-white/40 border border-[#ded2c2]/60 dark:border-white/5">
                                        Demand: {role.demand}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button className="w-full mt-4 bg-[#241f18]/10 dark:bg-white/10 hover:bg-[#241f18]/20 dark:hover:bg-white/20 text-[#241f18] dark:text-white border border-[#ded2c2] dark:border-white/10">
                        View Full Report <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

        </div>
    )
}
