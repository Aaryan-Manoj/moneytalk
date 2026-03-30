import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'

export default function PersonalDashboard() {
  const navigate = useNavigate()
  const { budget, remaining, activeMonth, allMonths, setActiveMonth } = usePersonal()
  const hasBudget = budget.total > 0

  const monthLabel = activeMonth
    ? new Date(activeMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',marginBottom:'24px'}}>← Back</button>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Personal Finance</h1>

      {Object.keys(allMonths).length > 1 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'16px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>SELECT MONTH</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
            {Object.keys(allMonths).map(m => (
              <button key={m} onClick={() => setActiveMonth(m)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',background: activeMonth === m ? '#2563EB' : '#F3F4F6',color: activeMonth === m ? '#FFFFFF' : '#6B7280'}}>
                {new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasBudget ? (
        <>
          <div style={{background:'#2563EB',borderRadius:'16px',padding:'24px',marginBottom:'16px'}}>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>AVAILABLE BALANCE</p>
            <p style={{fontSize:'32px',fontWeight:'700',color:'#FFFFFF'}}>₹{remaining.toLocaleString()}</p>
            <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>{monthLabel}</p>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <button onClick={() => navigate('/personal/expenses')} style={{background:'#FFFFFF',border:'2px solid #2563EB',borderRadius:'16px',padding:'20px',fontSize:'15px',fontWeight:'600',color:'#2563EB',cursor:'pointer',textAlign:'left'}}>+ Add Expense</button>
            <button onClick={() => navigate('/personal/summary')} style={{background:'#FFFFFF',border:'2px solid #7C3AED',borderRadius:'16px',padding:'20px',fontSize:'15px',fontWeight:'600',color:'#7C3AED',cursor:'pointer',textAlign:'left'}}>View Monthly Summary</button>
            <button onClick={() => navigate('/personal/budget')} style={{background:'#F3F4F6',border:'none',borderRadius:'16px',padding:'20px',fontSize:'15px',fontWeight:'600',color:'#6B7280',cursor:'pointer',textAlign:'left'}}>Edit Budget Setup</button>
          </div>
        </>
      ) : (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <p style={{color:'#6B7280',fontSize:'15px',marginBottom:'24px'}}>No budget set for this month.</p>
          <button onClick={() => navigate('/personal/budget')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px 32px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Set Up Budget</button>
        </div>
      )}
    </div>
  )
}