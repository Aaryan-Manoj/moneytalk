import { useNavigate } from 'react-router-dom'
import { useGroup } from '../../context/GroupContext'

export default function GroupDashboard() {
  const navigate = useNavigate()
  const { groups } = useGroup()

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Groups</h1>
      <button onClick={() => navigate('/group/create')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginBottom:'24px'}}>+ Create Group</button>
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {groups.length === 0 && (
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <p style={{color:'#6B7280',fontSize:'15px'}}>No groups yet.</p>
          </div>
        )}
        {groups.map(group => (
          <div key={group.id} onClick={() => navigate(`/group/${group.id}/expenses`)} style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#111827'}}>{group.name}</p>
              <p style={{fontSize:'13px',color:'#6B7280',marginTop:'4px'}}>{group.members.join(', ')}</p>
            </div>
            <span style={{color:'#6B7280',fontSize:'20px'}}>›</span>
          </div>
        ))}
      </div>
    </div>
  )
}