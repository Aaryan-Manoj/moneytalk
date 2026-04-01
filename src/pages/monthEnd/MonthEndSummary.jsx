import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#2563EB', '#7C3AED', '#0EA5E9', '#8B5CF6', '#3B82F6', '#6D28D9']

export default function MonthEndSummary() {
  const navigate = useNavigate()
  const { allMonths } = usePersonal()
  const [selectedMonth, setSelectedMonth] = useState('')
  const [compareMonths, setCompareMonths] = useState(['', ''])
  const [showReport, setShowReport] = useState(false)

  const monthKeys = Object.keys(allMonths)

  const getMonthLabel = (key) => key
    ? new Date(key + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
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
      activeCompare.forEach(m => {
        row[getMonthLabel(m)] = getCategoryData(m).find(d => d.category === cat)?.amount || 0
      })
      return row
    })
  }

  const generateReport = () => {
    if (activeCompare.length < 2) return ''
    const lines = []
    const cats = new Set(activeCompare.flatMap(m => getCategoryData(m).map(d => d.category)))
    cats.forEach(cat => {
      const values = activeCompare.map(m => ({
        label: getMonthLabel(m),
        amount: getCategoryData(m).find(d => d.category === cat)?.amount || 0
      }))
      const sorted = [...values].sort((a, b) => b.amount - a.amount)
      if (sorted[0].amount > 0 && sorted[0].amount !== sorted[sorted.length - 1].amount) {
        lines.push(`• ${cat}: ${sorted[0].label} had the highest spend at ₹${sorted[0].amount.toLocaleString()}, compared to ₹${sorted[sorted.length-1].amount.toLocaleString()} in ${sorted[sorted.length-1].label}.`)
      } else if (sorted[0].amount > 0) {
        lines.push(`• ${cat}: Spend was equal across all selected months at ₹${sorted[0].amount.toLocaleString()}.`)
      }
    })
    const totals = activeCompare.map(m => ({ label: getMonthLabel(m), total: getTotal(m) })).sort((a, b) => b.total - a.total)
    lines.unshift(`Overall: ${totals[0].label} had the highest total spend at ₹${totals[0].total.toLocaleString()}.`)
    return lines.join('\n')
  }

  const addCompareMonth = () => setCompareMonths(prev => [...prev, ''])
  const updateCompareMonth = (i, val) => {
    const updated = [...compareMonths]
    updated[i] = val
    setCompareMonths(updated)
  }
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

            <div style={{display:'grid',gridTemplateColumns:`repeat(${compareMonths.length}, 1fr)`,gap:'12px',marginBottom:'16px'}}>
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
                <div style={{display:'grid',gridTemplateColumns:`repeat(${activeCompare.length}, 1fr)`,gap:'12px',marginBottom:'16px'}}>
                  {activeCompare.map((m, i) => (
                    <div key={m} style={{background:COLORS[i],borderRadius:'12px',padding:'16px'}}>
                      <p style={{fontSize:'12px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>{getMonthLabel(m)}</p>
                      <p style={{fontSize:'20px',fontWeight:'700',color:'#FFFFFF'}}>₹{getTotal(m).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {getCompareData().length > 0 ? (
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
                ) : (
                  <p style={{color:'#6B7280',fontSize:'14px',textAlign:'center',padding:'24px'}}>No expense data to compare.</p>
                )}

                <button onClick={() => setShowReport(!showReport)} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%',marginTop:'16px'}}>
                  {showReport ? 'Hide Report ▲' : 'Show Spending Report ▼'}
                </button>

                {showReport && (
                  <div style={{background:'#F9FAFB',borderRadius:'12px',padding:'20px',marginTop:'12px'}}>
                    <p style={{fontSize:'13px',fontWeight:'700',color:'#111827',marginBottom:'12px'}}>SPENDING ANALYSIS</p>
                    {generateReport().split('\n').map((line, i) => (
                      <p key={i} style={{fontSize:'14px',color:'#374151',marginBottom:'8px',lineHeight:'1.6'}}>{line}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}