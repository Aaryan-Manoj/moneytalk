import { useNavigate, useParams } from 'react-router-dom'
import { useGroup } from '../../context/GroupContext'
import { exportGroupPDF } from '../../pdfExport'

export default function SettlementView() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { groups, getSettlement, expenses, recordPayment, undoPayment } = useGroup()

  const group = groups.find(g => g.id === id)
  const { balances, transactions, payments: recordedPayments } = getSettlement(id)
  const groupExpenses = expenses[id] || []
  const total = groupExpenses.reduce((s, e) => s + e.amount, 0)

  const memberTotals = {}
  if (group) {
    group.members.forEach(m => memberTotals[m] = 0)
    groupExpenses.forEach(e => { memberTotals[e.paidBy] = (memberTotals[e.paidBy] || 0) + e.amount })
  }

  const isPaid = (from, to) => {
    return (recordedPayments || []).some(p => p.from === from && p.to === to)
  }

  const getPaymentId = (from, to) => {
    const p = (recordedPayments || []).find(p => p.from === from && p.to === to)
    return p?.id
  }

  const handleMarkPaid = async (t) => {
    const alreadyPaid = isPaid(t.from, t.to)
    if (alreadyPaid) {
      const payId = getPaymentId(t.from, t.to)
      if (payId) await undoPayment(id, payId)
    } else {
      await recordPayment(id, t.from, t.to, t.amount)
    }
  }

  if (!group) return <div style={{padding:'32px'}}>Group not found.</div>

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate(`/group/${id}/expenses`)} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>Settlement</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{group.name}</p>

      <div style={{background:'#2563EB',borderRadius:'16px',padding:'20px',marginBottom:'24px'}}>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL GROUP EXPENSES</p>
        <p style={{fontSize:'28px',fontWeight:'700',color:'#FFFFFF'}}>₹{total.toLocaleString()}</p>
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>TOTAL PAID PER MEMBER</p>
        {Object.entries(memberTotals).map(([member, amount]) => (
          <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
            <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{member}</p>
            <p style={{fontSize:'14px',fontWeight:'700',color:'#2563EB'}}>₹{amount.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>NET BALANCES</p>
        {balances.map(({ member, balance }) => (
          <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid #F3F4F6'}}>
            <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{member}</p>
            <p style={{fontSize:'15px',fontWeight:'700',color:balance>0?'#10B981':balance<0?'#EF4444':'#6B7280'}}>
              {balance>0?`gets back ₹${balance}`:balance<0?`owes ₹${Math.abs(balance)}`:'Settled ✓'}
            </p>
          </div>
        ))}
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>WHO PAYS WHOM</p>
        {transactions.length === 0 && (
          <p style={{color:'#10B981',fontSize:'15px',fontWeight:'600',textAlign:'center'}}>All settled! 🎉</p>
        )}
        {transactions.map((t, i) => {
          const paid = isPaid(t.from, t.to)
          return (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px',borderRadius:'12px',background: paid ? '#F0FDF4' : '#F9FAFB',marginBottom:'8px',border: paid ? '1px solid #86EFAC' : 'none'}}>
              <div>
                <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>
                  <span style={{color: paid ? '#10B981' : '#EF4444'}}>{t.from}</span>
                  <span style={{color:'#6B7280'}}> owes </span>
                  <span style={{color:'#10B981'}}>{t.to}</span>
                </p>
                <p style={{fontSize:'14px',fontWeight:'700',color: paid ? '#10B981' : '#111827',marginTop:'2px'}}>
                  ₹{t.amount.toLocaleString()} {paid ? '— Paid ✓' : ''}
                </p>
              </div>
              <button
                onClick={() => handleMarkPaid(t)}
                style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'13px',fontWeight:'600',cursor:'pointer',background: paid ? '#FEE2E2' : '#10B981',color: paid ? '#EF4444' : '#FFFFFF'}}
              >
                {paid ? 'Undo' : 'Mark Paid'}
              </button>
            </div>
          )
        })}
      </div>

      {recordedPayments && recordedPayments.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>PAYMENT HISTORY</p>
          {recordedPayments.map(p => (
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
              <p style={{fontSize:'14px',color:'#111827'}}><strong>{p.from}</strong> paid <strong>{p.to}</strong></p>
              <p style={{fontSize:'14px',fontWeight:'700',color:'#10B981'}}>₹{p.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => exportGroupPDF(group, groupExpenses, { balances, transactions })}
        style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%'}}
      >
        ⬇ Export PDF
      </button>
    </div>
  )
}