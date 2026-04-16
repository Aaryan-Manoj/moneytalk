import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'

export default function AccountDashboard() {
  const navigate = useNavigate()
  const { accounts, deleteAccount } = useMultiAccess()
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleDelete = async (accountId) => {
    await deleteAccount(accountId)
    setConfirmDelete(null)
  }

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

      {confirmDelete && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'32px',maxWidth:'360px',width:'90%',textAlign:'center'}}>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Delete Account?</p>
            <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>All members will be notified. This cannot be undone.</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={() => setConfirmDelete(null)} style={{flex:1,background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{flex:1,background:'#EF4444',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#FFFFFF',cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
              <div onClick={() => acc.status === 'active' && navigate(`/multiaccess/${acc.id}`)} style={{flex:1,cursor:acc.status==='active'?'pointer':'default'}}>
                <p style={{fontSize:'16px',fontWeight:'600',color:'#111827'}}>{acc.name}</p>
                <p style={{fontSize:'13px',color:'#6B7280',marginTop:'4px'}}>{acc.members.join(', ')}</p>
                <p style={{fontSize:'13px',color:'#2563EB',marginTop:'2px',fontWeight:'600'}}>Budget: ₹{acc.budget.toLocaleString()}</p>
              </div>
              <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                {acc.status === 'active' && <span onClick={() => navigate(`/multiaccess/${acc.id}`)} style={{color:'#6B7280',fontSize:'20px',cursor:'pointer'}}>›</span>}
                <button onClick={() => setConfirmDelete(acc.id)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#EF4444'}}>Delete</button>
              </div>
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