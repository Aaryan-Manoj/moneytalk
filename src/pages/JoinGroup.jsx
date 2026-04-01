import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'

export default function JoinGroup() {
  const { inviteId } = useParams()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, 'invites', inviteId)
      const snap = await getDoc(ref)
      if (!snap.exists()) { setStatus('invalid'); return }
      setInvite({ id: snap.id, ...snap.data() })
      setStatus('loaded')
    }
    load()
  }, [inviteId])

  const accept = async () => {
    if (!user) {
      localStorage.setItem('pendingInvite', inviteId)
      navigate('/login')
      return
    }
    setStatus('joining')
    const invite_data = invite
    const collection = invite_data.type === 'group' ? 'groups' : 'multiAccess'
    await updateDoc(doc(db, 'users', invite_data.createdBy, collection, invite_data.entityId), {
      members: arrayUnion(invite_data.memberName)
    })
    await updateDoc(doc(db, 'invites', inviteId), { status: 'accepted' })
    await updateDoc(doc(db, 'users', user.uid, 'invites', inviteId), { status: 'accepted' })
    setStatus('done')
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  if (status === 'loading') return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <p style={{color:'#6B7280'}}>Loading invite...</p>
    </div>
  )

  if (status === 'invalid') return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',textAlign:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',maxWidth:'400px',width:'100%'}}>
        <p style={{fontSize:'24px',marginBottom:'8px'}}>❌</p>
        <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Invalid Invite</p>
        <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>This invite link is invalid or has expired.</p>
        <button onClick={() => navigate('/')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Go Home</button>
      </div>
    </div>
  )

  if (status === 'done') return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',textAlign:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',maxWidth:'400px',width:'100%'}}>
        <p style={{fontSize:'24px',marginBottom:'8px'}}>🎉</p>
        <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Joined!</p>
        <p style={{fontSize:'14px',color:'#6B7280'}}>Redirecting to dashboard...</p>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',textAlign:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',maxWidth:'400px',width:'100%'}}>
        <p style={{fontSize:'24px',marginBottom:'8px'}}>👋</p>
        <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>You're invited!</p>
        <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'4px'}}>{invite?.createdByName} invited you to join</p>
        <p style={{fontSize:'20px',fontWeight:'700',color:'#2563EB',marginBottom:'4px'}}>{invite?.entityName}</p>
        <p style={{fontSize:'13px',color:'#9CA3AF',marginBottom:'24px'}}>as <strong>{invite?.memberName}</strong></p>
        {!user && <p style={{fontSize:'13px',color:'#F59E0B',marginBottom:'16px'}}>You need to sign in first.</p>}
        <button onClick={accept} disabled={status==='joining'} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginBottom:'12px'}}>
          {status==='joining' ? 'Joining...' : user ? 'Accept & Join' : 'Sign In to Join'}
        </button>
        <button onClick={() => navigate('/')} style={{background:'#F3F4F6',color:'#6B7280',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}}>Decline</button>
      </div>
    </div>
  )
}