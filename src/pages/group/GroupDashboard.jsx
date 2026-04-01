import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useGroup } from '../../context/GroupContext'
import { auth, db } from '../../firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function GroupDashboard() {
  const navigate = useNavigate()
  const { groups, deleteGroup } = useGroup()
  const [notifications, setNotifications] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(
          collection(db, 'notifications'),
          where('toName', '==', user.displayName),
          where('read', '==', false),
          where('type', '==', 'group_deleted')
        )
        const snap = await getDocs(q)
        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      }
    })
    return () => unsub()
  }, [])

  const dismissNotification = async (id) => {
    await updateDoc(doc(db, 'notifications', id), { read: true })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleDelete = async (groupId) => {
    await deleteGroup(groupId)
    setConfirmDelete(null)
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>

      {notifications.length > 0 && (
        <div style={{marginBottom:'24px'}}>
          {notifications.map(n => (
            <div key={n.id} style={{background:'#FEF3C7',borderRadius:'12px',padding:'16px',marginBottom:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <p style={{fontSize:'14px',color:'#92400E'}}>{n.message}</p>
              <button onClick={() => dismissNotification(n.id)} style={{background:'none',border:'none',color:'#92400E',cursor:'pointer',fontSize:'16px',marginLeft:'12px'}}>✕</button>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'32px',maxWidth:'360px',width:'90%',textAlign:'center'}}>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Delete Group?</p>
            <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>All members will be notified. This cannot be undone.</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={() => setConfirmDelete(null)} style={{flex:1,background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{flex:1,background:'#EF4444',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#FFFFFF',cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Groups</h1>
      <button onClick={() => navigate('/group/create')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginBottom:'24px'}}>+ Create Group</button>

      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {groups.length === 0 && (
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <p style={{color:'#6B7280',fontSize:'15px'}}>No groups yet.</p>
          </div>
        )}
        {groups.map(group => (
          <div key={group.id} style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div onClick={() => navigate(`/group/${group.id}/expenses`)} style={{flex:1,cursor:'pointer'}}>
              <p style={{fontSize:'16px',fontWeight:'600',color:'#111827'}}>{group.name}</p>
              <p style={{fontSize:'13px',color:'#6B7280',marginTop:'4px'}}>{group.members.join(', ')}</p>
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              <span onClick={() => navigate(`/group/${group.id}/expenses`)} style={{color:'#6B7280',fontSize:'20px',cursor:'pointer'}}>›</span>
              <button onClick={() => setConfirmDelete(group.id)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#EF4444'}}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}