import { useNavigate } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'

export default function AccountDashboard() {
  const navigate = useNavigate()
  const { accounts } = useMultiAccess()

  const getStatusBadge = (acc) => {
    if (acc.status === 'awaiting') {
      return (
        <span style={{background:'#FEF3C7',color:'#92400E',fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'6px'}}>
          Awaiting Confirmation ({(acc.pendingMembers || []).length})
        </span>
      )
    }
    return (
      <span style={{background:'#D1FAE5',color:'#065F46',fontSize:'11px',fontWeight:'700',padding:'3px 8px',borderRadius:'6px'}}>
        Active
      </span>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Multi Access</h1>
      <button onClick={() => navigate('/multiaccess/create')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginBottom:'24px'}}>+ Create Account</button>
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {accounts.length === 0 && (
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <p style={{color:'#6B7280',fontSize:'15px'}}>No shared accounts yet.</p>
          </div>
        )}
        {accounts.map(acc => (
          <div key={acc.id} style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div onClick={() => acc.status === 'active' && navigate(`/multiaccess/${acc.id}`)} style={{cursor: acc.status === 'active' ? 'pointer' : 'default',display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <div>
                <p style={{fontSize:'16px',fontWeight:'600',color:'#111827'}}>{acc.name}</p>
                <p style={{fontSize:'13px',color:'#6B7280',marginTop:'4px'}}>{acc.members.join(', ')}</p>
                <p style={{fontSize:'13px',color:'#2563EB',marginTop:'2px',fontWeight:'600'}}>Budget: ₹{acc.budget.toLocaleString()}</p>
              </div>
              {acc.status === 'active' && <span style={{color:'#6B7280',fontSize:'20px'}}>›</span>}
            </div>
            <div>{getStatusBadge(acc)}</div>
            {acc.status === 'awaiting' && (
              <p style={{fontSize:'12px',color:'#92400E',marginTop:'6px'}}>Waiting for: {(acc.pendingMembers || []).join(', ')}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}