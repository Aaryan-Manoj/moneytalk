import { useState } from 'react'
import { exportMonthEndPDF } from '../../pdfExport'
import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'

const COLORS = ['#2563EB', '#7C3AED', '#0EA5E9', '#8B5CF6', '#3B82F6', '#6D28D9']

export default function MonthEndSummary() {
  const navigate = useNavigate()
  const { allMonths } = usePersonal()
  const [selectedMonth, setSelectedMonth] = useState('')
  const [compareMonths, setCompareMonths] = useState(['', ''])
  const [showReport, setShowReport] = useState(false)
  const [showTrend, setShowTrend] = useState(false)

  const monthKeys = Object.keys(allMonths).sort()

  const getMonthLabel = (key) => key
    ? new Date(key + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : ''

  const getTotal = (key) => {
    if (!allMonths[key]) return 0
    return (allMonths[key].expenses || []).reduce((s, e) => s + Number(e.amount), 0)
  }

  const getCategoryData = (key) => {
    if (!allMonths[key]) return []
    const exps = allMonths[key].expenses || []
    const totals = exps.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
      return acc
    }, {})
    return Object.entries(totals).map(([category, amount]) => ({ category, amount }))
  }

  const activeCompare = compareMonths.filter(m => m !== '')

  const getCompareData = () => {
    if (activeCompare.length < 2) return []
    const cats = new Set(activeCompare.flatMap(m => getCategoryData(m).map(d => d.category)))
    return Array.from(cats).map(cat => {
      const row = { category: cat }
      activeCompare.forEach(m => { row[getMonthLabel(m)] = getCategoryData(m).find(d => d.category === cat)?.amount || 0 })
      return row
    })
  }

  const getTrendData = () => {
    return monthKeys.map(k => ({ month: getMonthLabel(k), total: getTotal(k) }))
  }

  const generateReport = () => {
    if (activeCompare.length < 2) return ''
    const lines = []

    const totals = activeCompare.map(m => ({ label: getMonthLabel(m), total: getTotal(m), key: m })).sort((a, b) => b.total - a.total)
    const highest = totals[0]
    const lowest = totals[totals.length - 1]
    const diffAmount = highest.total - lowest.total
    const diffPercent = lowest.total > 0 ? ((diffAmount / lowest.total) * 100).toFixed(0) : 'N/A'

    // Overall summary
    lines.push(`📊 Overall Summary`)
    lines.push(`Your total spending was highest in ${highest.label} at ₹${highest.total.toLocaleString()} and lowest in ${lowest.label} at ₹${lowest.total.toLocaleString()}. That's a difference of ₹${diffAmount.toLocaleString()}${diffPercent !== 'N/A' ? ` — about ${diffPercent}% more` : ''}.`)
    lines.push(``)

    // Category breakdown
    lines.push(`📂 Category Breakdown`)
    const cats = new Set(activeCompare.flatMap(m => getCategoryData(m).map(d => d.category)))
    const categoryInsights = []

    cats.forEach(cat => {
      const values = activeCompare.map(m => ({
        label: getMonthLabel(m),
        amount: getCategoryData(m).find(d => d.category === cat)?.amount || 0
      }))
      const sorted = [...values].sort((a, b) => b.amount - a.amount)
      const max = sorted[0]
      const min = sorted[sorted.length - 1]
      const catDiff = max.amount - min.amount
      const catPercent = min.amount > 0 ? ((catDiff / min.amount) * 100).toFixed(0) : null
      const totalAcrossMonths = values.reduce((s, v) => s + v.amount, 0)

      if (max.amount === 0) return

      if (max.amount === min.amount) {
        categoryInsights.push({ cat, line: `• ${cat}: You spent exactly ₹${max.amount.toLocaleString()} every month here — very consistent!`, total: totalAcrossMonths })
      } else if (catPercent !== null) {
        const trend = catDiff > 0 ? `went up by ${catPercent}%` : `stayed close`
        categoryInsights.push({ cat, line: `• ${cat}: Spending ${trend} — ₹${min.amount.toLocaleString()} in ${min.label} vs ₹${max.amount.toLocaleString()} in ${max.label} (₹${catDiff.toLocaleString()} difference).`, total: totalAcrossMonths })
      } else {
        categoryInsights.push({ cat, line: `• ${cat}: Only spent in ${max.label} — ₹${max.amount.toLocaleString()}.`, total: totalAcrossMonths })
      }
    })

    // Sort categories by total spend descending so biggest spends come first
    categoryInsights.sort((a, b) => b.total - a.total)
    categoryInsights.forEach(c => lines.push(c.line))
    lines.push(``)

    // Biggest spender category
    if (categoryInsights.length > 0) {
      lines.push(`💸 Biggest Spend Area`)
      lines.push(`Your highest spending category overall was "${categoryInsights[0].cat}" — worth keeping an eye on if you're trying to cut costs.`)
      lines.push(``)
    }

    // Month-over-month change
    if (activeCompare.length === 2) {
      const [m1, m2] = activeCompare
      const t1 = getTotal(m1)
      const t2 = getTotal(m2)
      const change = t2 - t1
      const changePct = t1 > 0 ? ((Math.abs(change) / t1) * 100).toFixed(0) : null
      lines.push(`📈 Month-over-Month`)
      if (change > 0) {
        lines.push(`You spent ₹${Math.abs(change).toLocaleString()}${changePct ? ` (${changePct}%)` : ''} more in ${getMonthLabel(m2)} compared to ${getMonthLabel(m1)}. Your expenses went up.`)
      } else if (change < 0) {
        lines.push(`Great news — you spent ₹${Math.abs(change).toLocaleString()}${changePct ? ` (${changePct}%)` : ''} less in ${getMonthLabel(m2)} compared to ${getMonthLabel(m1)}. You're trending in the right direction!`)
      } else {
        lines.push(`Your total spending was identical across both months at ₹${t1.toLocaleString()}.`)
      }
      lines.push(``)
    }

    // New categories that appeared
    if (activeCompare.length === 2) {
      const [m1, m2] = activeCompare
      const cats1 = new Set(getCategoryData(m1).map(d => d.category))
      const cats2 = new Set(getCategoryData(m2).map(d => d.category))
      const newCats = [...cats2].filter(c => !cats1.has(c))
      const droppedCats = [...cats1].filter(c => !cats2.has(c))
      if (newCats.length > 0) {
        lines.push(`🆕 New Spending Areas`)
        lines.push(`You started spending on ${newCats.join(', ')} in ${getMonthLabel(m2)} — categories that didn't appear in ${getMonthLabel(m1)}.`)
        lines.push(``)
      }
      if (droppedCats.length > 0) {
        lines.push(`✅ Dropped Categories`)
        lines.push(`You stopped spending on ${droppedCats.join(', ')} compared to ${getMonthLabel(m1)} — whether intentional or not, that saved you some money.`)
        lines.push(``)
      }
    }

    return lines.join('\n')
  }

  const addCompareMonth = () => setCompareMonths(prev => [...prev, ''])
  const updateCompareMonth = (i, val) => { const u = [...compareMonths]; u[i] = val; setCompareMonths(u) }
  const removeCompareMonth = (i) => setCompareMonths(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'800px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Month End Summary</h1>

      {monthKeys.length === 0 ? (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <p style={{color:'#6B7280',fontSize:'15px'}}>No monthly data available yet.</p>
        </div>
      ) : (
        <>
          {monthKeys.length >= 2 && (
            <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'24px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280'}}>SPENDING TREND — ALL MONTHS</p>
                <button onClick={() => setShowTrend(!showTrend)} style={{background:'#EFF6FF',border:'none',borderRadius:'8px',padding:'6px 14px',fontSize:'13px',fontWeight:'600',color:'#2563EB',cursor:'pointer'}}>{showTrend?'Hide':'Show'} Trend</button>
              </div>
              {showTrend && (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={getTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{fontSize:11,fill:'#6B7280'}} />
                    <YAxis tick={{fontSize:11,fill:'#6B7280'}} />
                    <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Total Spent']} />
                    <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={3} dot={{fill:'#2563EB',r:5}} activeDot={{r:7}} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'24px'}}>
            <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>SECTION 1 — SINGLE MONTH</p>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%',background:'#FFFFFF',marginBottom:'16px'}}>
              <option value="">Select a month</option>
              {monthKeys.map(k => <option key={k} value={k}>{getMonthLabel(k)}</option>)}
            </select>
            {selectedMonth && (
              <>
                <div style={{background:'#2563EB',borderRadius:'12px',padding:'16px',marginBottom:'16px'}}>
                  <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL SPENT</p>
                  <p style={{fontSize:'28px',fontWeight:'700',color:'#FFFFFF'}}>₹{getTotal(selectedMonth).toLocaleString()}</p>
                  <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>{getMonthLabel(selectedMonth)}</p>
                </div>
                {getCategoryData(selectedMonth).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={getCategoryData(selectedMonth)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="category" tick={{fontSize:11,fill:'#6B7280'}} />
                      <YAxis tick={{fontSize:11,fill:'#6B7280'}} />
                      <Tooltip formatter={v => [`₹${v}`, 'Amount']} />
                      <Bar dataKey="amount" fill="#2563EB" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{color:'#6B7280',fontSize:'14px',textAlign:'center',padding:'24px'}}>No expenses for this month.</p>
                )}
              </>
            )}
          </div>

          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280'}}>SECTION 2 — COMPARE MONTHS</p>
              <button onClick={addCompareMonth} style={{background:'#EFF6FF',border:'none',borderRadius:'8px',padding:'6px 14px',fontSize:'13px',fontWeight:'600',color:'#2563EB',cursor:'pointer'}}>+ Add Month</button>
            </div>

            <div style={{display:'grid',gridTemplateColumns:`repeat(${compareMonths.length},1fr)`,gap:'12px',marginBottom:'16px'}}>
              {compareMonths.map((m, i) => (
                <div key={i} style={{display:'flex',gap:'6px',alignItems:'center'}}>
                  <select value={m} onChange={e => updateCompareMonth(i, e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'10px',fontSize:'13px',outline:'none',background:'#FFFFFF',flex:1}}>
                    <option value="">Month {i+1}</option>
                    {monthKeys.map(k => <option key={k} value={k}>{getMonthLabel(k)}</option>)}
                  </select>
                  {compareMonths.length > 2 && (
                    <button onClick={() => removeCompareMonth(i)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 8px',cursor:'pointer',color:'#EF4444',fontSize:'13px'}}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {activeCompare.length >= 2 && (
              <>
                <div style={{display:'grid',gridTemplateColumns:`repeat(${activeCompare.length},1fr)`,gap:'12px',marginBottom:'16px'}}>
                  {activeCompare.map((m, i) => (
                    <div key={m} style={{background:COLORS[i],borderRadius:'12px',padding:'16px'}}>
                      <p style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>{getMonthLabel(m)}</p>
                      <p style={{fontSize:'20px',fontWeight:'700',color:'#FFFFFF'}}>₹{getTotal(m).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {getCompareData().length > 0 ? (
                  // ✅ Added id so exportMonthEndPDF can capture this chart
                  <div id="compare-chart">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getCompareData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="category" tick={{fontSize:11,fill:'#6B7280'}} />
                        <YAxis tick={{fontSize:11,fill:'#6B7280'}} />
                        <Tooltip formatter={v => [`₹${v}`]} />
                        <Legend />
                        {activeCompare.map((m, i) => (
                          <Bar key={m} dataKey={getMonthLabel(m)} fill={COLORS[i]} radius={[6,6,0,0]} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p style={{color:'#6B7280',fontSize:'14px',textAlign:'center',padding:'24px'}}>No expense data to compare.</p>
                )}

                <button onClick={() => setShowReport(!showReport)} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%',marginTop:'16px'}}>
                  {showReport?'Hide Report ▲':'Show Spending Report ▼'}
                </button>

                {showReport && (
                  <div style={{background:'#F9FAFB',borderRadius:'12px',padding:'20px',marginTop:'12px'}}>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'12px'}}>SPENDING ANALYSIS</p>
                    {generateReport().split('\n').map((line, i) => (
                      <p key={i} style={{
                        fontSize: line.startsWith('📊') || line.startsWith('📂') || line.startsWith('💸') || line.startsWith('📈') || line.startsWith('🆕') || line.startsWith('✅') ? '13px' : '14px',
                        fontWeight: line.startsWith('📊') || line.startsWith('📂') || line.startsWith('💸') || line.startsWith('📈') || line.startsWith('🆕') || line.startsWith('✅') ? '700' : '400',
                        color: line.startsWith('📊') || line.startsWith('📂') || line.startsWith('💸') || line.startsWith('📈') || line.startsWith('🆕') || line.startsWith('✅') ? '#111827' : '#374151',
                        marginBottom:'6px',
                        lineHeight:'1.6',
                        marginTop: line.startsWith('📊') || line.startsWith('📂') || line.startsWith('💸') || line.startsWith('📈') || line.startsWith('🆕') || line.startsWith('✅') ? '12px' : '0'
                      }}>{line}</p>
                    ))}
                  </div>
                )}

                {/* ✅ Export PDF button */}
                {activeCompare.length >= 1 && (
                  <button onClick={() => exportMonthEndPDF(allMonths, activeCompare, generateReport())} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',width:'100%',marginTop:'12px'}}>⬇ Export Report as PDF</button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}