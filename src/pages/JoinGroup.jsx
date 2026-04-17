import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, addDoc, collection, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'

export default function JoinGroup() {
  const { inviteId } = useParams()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [status, setStatus] = useState('loading')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      // If user just logged in and there's a pending invite, reload invite
      if (u && status === 'loading') loadInvite()
    })
    return () => unsub()
  }, [])

  const loadInvite = async () => {
    try {
      const ref = doc(db, 'invites', inviteId)
      const snap = await getDoc(ref)
      if (!snap.exists()) { setStatus('invalid'); return }
      setInvite({ id: snap.id, ...snap.data() })
      setStatus('loaded')
    } catch (e) {
      setStatus('invalid')
    }
  }

  useEffect(() => {
    loadInvite()
  }, [inviteId])

  const accept = async () => {
    if (!user) {
      localStorage.setItem('pendingInvite', inviteId)
      navigate('/login')
      return
    }
    setStatus('joining')
    try {
      const collectionName = invite.type === 'group' ? 'groups' : 'multiAccess'

      // Fetch the group from owner's path
      const groupRef = doc(db, 'users', invite.createdBy, collectionName, invite.entityId)
      const groupSnap = await getDoc(groupRef)
      if (!groupSnap.exists()) { setStatus('invalid'); return }
      const groupData = groupSnap.data()

      // Remove from pendingMembers
      const newPending = (groupData.pendingMembers || []).filter(m => m !== invite.memberName)
      const isNowActive = newPending.length === 0

      // Update owner's copy
      const { updateDoc } = await import('firebase/firestore')
      await updateDoc(groupRef, {
        pendingMembers: newPending,
        status: isNowActive ? 'active' : 'awaiting'
      })

      // ✅ Write group copy to this user's Firestore path
      const myGroupData = {
        ...groupData,
        pendingMembers: newPending,
        status: isNowActive ? 'active' : 'awaiting',
        ownerUid: invite.createdBy,
        isShared: true
      }
      await setDoc(doc(db, 'users', user.uid, collectionName, invite.entityId), myGroupData)

      // ✅ Send notification to owner that invite was accepted
      await addDoc(collection(db, 'notifications'), {
        toUid: invite.createdBy,
        toName: groupData.createdByName,
        fromName: user.displayName || invite.memberName,
        groupId: invite.entityId,
        groupName: invite.entityName,
        ownerUid: invite.createdBy,
        type: 'invite_accepted',
        feature: collectionName === 'groups' ? 'group' : 'multiAccess',
        status: 'info',
        createdAt: new Date().toISOString()
      })

      // Mark invite as accepted
      await updateDoc(doc(db, 'invites', inviteId), { status: 'accepted' })

      setStatus('done')
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (e) {
      console.error('Join failed:', e)
      setStatus('error')
    }
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

  if (status === 'error') return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',textAlign:'center',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',maxWidth:'400px',width:'100%'}}>
        <p style={{fontSize:'24px',marginBottom:'8px'}}>⚠️</p>
        <p style={{fontSize:'18px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Something went wrong</p>
        <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>Could not join the group. Please try again.</p>
        <button onClick={() => setStatus('loaded')} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'12px 24px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Try Again</button>
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