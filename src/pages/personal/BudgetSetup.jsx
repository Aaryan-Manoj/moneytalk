import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'

export default function BudgetSetup() {
  const navigate = useNavigate()
  const { setBudget, allMonths, setActiveMonth } = usePersonal()
  const [month, setMonth] = useState('')
  const [total, setTotal] = useState('')
  const [allocations, setAllocations] = useState([{ label: '', amount: '' }])

  useEffect(() => {
    if (month && allMonths[month]) {
      const existing = allMonths[month]
      setTotal(existing.total || '')
      setAllocations(existing.allocations?.length > 0 ? existing.allocations : [{ label: '', amount: '' }])
    } else if (month) {
      setTotal('')
      setAllocations([{ label: '', amount: '' }])
    }
  }, [month])

  const addRow = () => setAllocations([...allocations, { label: '', amount: '' }])
  const updateRow = (i, field, value) => {
    const updated = [...allocations]
    updated[i][field] = value
    setAllocations(updated)
  }

  const save = () => {
    if (!month || !total) return
    setBudget({ month, total: Number(total), allocations })
    navigate('/personal')
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/personal')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Monthly Budget Setup</h1>

      {Object.keys(allMonths).length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>EXISTING MONTHS</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {Object.keys(allMonths).map(m => (
              <button key={m} onClick={() => setMonth(m)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',background:month===m?'#2563EB':'#F3F4F6',color:month===m?'#FFFFFF':'#6B7280'}}>
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>MONTH</p>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}} />
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>TOTAL BUDGET (₹)</p>
        <input type="number" placeholder="0" value={total} onChange={e => setTotal(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}} />
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>FIXED ALLOCATIONS</p>
        {allocations.map((row, i) => (
          <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <input placeholder="Label (e.g. Rent)" value={row.label} onChange={e => updateRow(i, 'label', e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
            <input type="number" placeholder="Amount (₹)" value={row.amount} onChange={e => updateRow(i, 'amount', e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          </div>
        ))}
        <button onClick={addRow} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'10px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>+ Add Row</button>
      </div>

      <button onClick={save} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}}>Save & Continue</button>
    </div>
  )
}