import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'

export default function SettlementCalc() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { accounts, getSettlement, expenses } = useMultiAccess()
  const [paid, setPaid] = useState({})

  const account = accounts.find(a => a.id === id)
  const settlement = getSettlement(id)
  const accExpenses = expenses[id] || []
  const totalSpent = accExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const togglePaid = (member) => setPaid(prev => ({ ...prev, [member]: !prev[member] }))

  if (!account) return <div style={{padding:'32px'}}>Account not found.</div>

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate(`/multiaccess/${id}`)} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>Settlement</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{account.name}</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
        <div style={{background:'#2563EB',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL BUDGET</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{account.budget.toLocaleString()}</p>
        </div>
        <div style={{background:'#7C3AED',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL SPENT</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{totalSpent.toLocaleString()}</p>
        </div>
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>CONTRIBUTION BREAKDOWN</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
          <p style={{fontSize:'12px',fontWeight:'700',color:'#6B7280'}}>MEMBER</p>
          <p style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textAlign:'center'}}>PAID</p>
          <p style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textAlign:'right'}}>OWES</p>
        </div>
        {settlement.map(({ member, paid: paidAmt, owes }) => (
          <div key={member} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',padding:'10px 0',borderBottom:'1px solid #F3F4F6',alignItems:'center'}}>
            <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{member}</p>
            <p style={{fontSize:'14px',color:'#10B981',fontWeight:'600',textAlign:'center'}}>₹{paidAmt.toLocaleString()}</p>
            <p style={{fontSize:'14px',fontWeight:'700',textAlign:'right',color:owes>0?'#EF4444':'#10B981'}}>{owes>0?`₹${owes}`:'Settled'}</p>
          </div>
        ))}
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>PAYMENT STATUS</p>
        {settlement.filter(s => s.owes > 0).map(({ member, owes }) => (
          <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px',borderRadius:'12px',background:'#F9FAFB',marginBottom:'8px'}}>
            <div>
              <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{member}</p>
              <p style={{fontSize:'13px',color:'#6B7280'}}>Owes ₹{owes.toLocaleString()}</p>
            </div>
            <button onClick={() => togglePaid(member)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'13px',fontWeight:'600',cursor:'pointer',background:paid[member]?'#10B981':'#F3F4F6',color:paid[member]?'#FFFFFF':'#6B7280'}}>
              {paid[member]?'Paid ✓':'Mark Paid'}
            </button>
          </div>
        ))}
        {settlement.filter(s => s.owes > 0).length === 0 && (
          <p style={{color:'#10B981',fontSize:'15px',fontWeight:'600',textAlign:'center'}}>All settled! 🎉</p>
        )}
      </div>
    </div>
  )
}