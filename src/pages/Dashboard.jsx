import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const [invites, setInvites] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        const q = query(collection(db, 'invites'), where('memberName', '==', u.displayName), where('status', '==', 'pending'))
        const snap = await getDocs(q)
        setInvites(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        const pending = localStorage.getItem('pendingInvite')
        if (pending) {
          localStorage.removeItem('pendingInvite')
          navigate(`/join/${pending}`)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const acceptInvite = async (invite) => {
    const col = invite.type === 'group' ? 'groups' : 'multiAccess'
    await updateDoc(doc(db, 'users', invite.createdBy, col, invite.entityId), {
      members: arrayUnion(user.displayName)
    })
    await updateDoc(doc(db, 'invites', invite.id), { status: 'accepted' })
    setInvites(prev => prev.filter(i => i.id !== invite.id))
  }

  const declineInvite = async (invite) => {
    await updateDoc(doc(db, 'invites', invite.id), { status: 'declined' })
    setInvites(prev => prev.filter(i => i.id !== invite.id))
  }

  const handleSignOut = async () => {
    await signOut(auth)
    navigate('/')
  }

  const cards = [
    { label: 'Personal', path: '/personal', color: '#2563EB' },
    { label: 'Group', path: '/group', color: '#7C3AED' },
    { label: 'Multi Access', path: '/multiaccess', color: '#2563EB' },
    { label: 'Month End Summary', path: '/monthend', color: '#7C3AED' },
  ]

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        <div style={{width:'40px',height:'40px',border:'4px solid #E5E7EB',borderTop:'4px solid #2563EB',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
        <p style={{color:'#6B7280',fontSize:'15px'}}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px'}}>

      <div style={{position:'absolute',top:'24px',right:'24px',display:'flex',gap:'8px'}}>
        <button onClick={() => navigate('/profile')} style={{background:'#F3F4F6',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Profile</button>
        <button onClick={() => setShowSignOutConfirm(true)} style={{background:'#F3F4F6',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Sign Out</button>
      </div>

      {showSignOutConfirm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'32px',maxWidth:'360px',width:'90%',textAlign:'center'}}>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Sign Out?</p>
            <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>You will be returned to the landing page.</p>
            <div style={{display:'flex',gap:'12px'}}>
              <button onClick={() => setShowSignOutConfirm(false)} style={{flex:1,background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Cancel</button>
              <button onClick={handleSignOut} style={{flex:1,background:'#EF4444',border:'none',borderRadius:'12px',padding:'12px',fontSize:'15px',fontWeight:'600',color:'#FFFFFF',cursor:'pointer'}}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      <h1 style={{fontSize:'28px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>MoneyTalk</h1>
      <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'40px'}}>Welcome back, {user?.displayName || 'there'} 👋</p>

      {invites.length > 0 && (
        <div style={{width:'100%',maxWidth:'560px',marginBottom:'24px'}}>
          {invites.map(invite => (
            <div key={invite.id} style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <p style={{fontSize:'14px',fontWeight:'700',color:'#111827'}}>📨 Invite</p>
                <p style={{fontSize:'13px',color:'#6B7280',marginTop:'2px'}}>{invite.createdByName} invited you to <strong>{invite.entityName}</strong></p>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={() => acceptInvite(invite)} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'10px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Accept</button>
                <button onClick={() => declineInvite(invite)} style={{background:'#F3F4F6',color:'#6B7280',border:'none',borderRadius:'10px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',width:'100%',maxWidth:'560px'}}>
        {cards.map((card) => (
          <button key={card.label} onClick={() => navigate(card.path)} style={{background:'#FFFFFF',border:`2px solid ${card.color}`,borderRadius:'20px',padding:'40px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',minHeight:'160px'}}>
            <div style={{width:'48px',height:'48px',borderRadius:'14px',background:card.color,marginBottom:'16px'}} />
            <span style={{fontSize:'16px',fontWeight:'600',color:'#111827',textAlign:'center'}}>{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}