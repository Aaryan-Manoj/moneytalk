import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function Dashboard() {
  const navigate = useNavigate()
  const [invites, setInvites] = useState([])
  const [user, setUser] = useState(null)

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

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px'}}>
      <div style={{position:'absolute',top:'24px',right:'24px'}}>
        <button onClick={handleSignOut} style={{background:'#F3F4F6',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>Sign Out</button>
      </div>

      <h1 style={{fontSize:'28px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>MoneyTalk</h1>
      <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'40px'}}>What would you like to do?</p>

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