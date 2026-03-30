import { useNavigate, useParams } from 'react-router-dom'
import { useGroup } from '../../context/GroupContext'
import { useState } from 'react'

export default function SettlementView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { groups, getSettlement, expenses } = useGroup()
  const [paid, setPaid] = useState({})

  const group = groups.find(g => g.id === id)
  const settlement = getSettlement(id)
  const groupExpenses = expenses[id] || []
  const total = groupExpenses.reduce((s, e) => s + e.amount, 0)

  const togglePaid = (member) => {
    setPaid(prev => ({ ...prev, [member]: !prev[member] }))
  }

  if (!group) return <div style={{padding:'32px'}}>Group not found.</div>

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={() => navigate(`/group/${id}/expenses`)} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',marginBottom:'24px'}}>← Back</button>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>Settlement</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{group.name}</p>

      <div style={{background:'#2563EB',borderRadius:'16px',padding:'20px',marginBottom:'24px'}}>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL GROUP EXPENSES</p>
        <p style={{fontSize:'28px',fontWeight:'700',color:'#FFFFFF'}}>₹{total.toLocaleString()}</p>
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>NET BALANCES</p>
        {settlement.map(({ member, balance }) => (
          <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #F3F4F6'}}>
            <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{member}</p>
            <p style={{fontSize:'15px',fontWeight:'700',color: balance > 0 ? '#10B981' : balance < 0 ? '#EF4444' : '#6B7280'}}>
              {balance > 0 ? `+₹${balance}` : balance < 0 ? `-₹${Math.abs(balance)}` : 'Settled'}
            </p>
          </div>
        ))}
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>SETTLEMENT STATUS</p>
        {settlement.filter(s => s.balance < 0).map(({ member, balance }) => (
          <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px',borderRadius:'12px',background:'#F9FAFB',marginBottom:'8px'}}>
            <div>
              <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{member}</p>
              <p style={{fontSize:'13px',color:'#6B7280'}}>Owes ₹{Math.abs(balance)}</p>
            </div>
            <button onClick={() => togglePaid(member)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'13px',fontWeight:'600',cursor:'pointer',background: paid[member] ? '#10B981' : '#F3F4F6',color: paid[member] ? '#FFFFFF' : '#6B7280'}}>
              {paid[member] ? 'Paid ✓' : 'Mark Paid'}
            </button>
          </div>
        ))}
        {settlement.filter(s => s.balance < 0).length === 0 && (
          <p style={{color:'#10B981',fontSize:'15px',fontWeight:'600',textAlign:'center'}}>All settled! 🎉</p>
        )}
      </div>
    </div>
  )
}