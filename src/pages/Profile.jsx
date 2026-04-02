import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (snap.exists()) setUserData(snap.data())
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const changePassword = async () => {
    setError('')
    setMessage('')
    if (!currentPassword || !newPassword || !confirmPassword) return setError('All fields are required.')
    if (newPassword !== confirmPassword) return setError('New passwords do not match.')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setMessage('Password changed successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Current password is incorrect.')
    }
  }

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:'40px',height:'40px',border:'4px solid #E5E7EB',borderTop:'4px solid #2563EB',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/dashboard')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>

      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Profile</h1>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',marginBottom:'20px'}}>
          <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#2563EB',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>{userData?.name?.[0]?.toUpperCase() || '?'}</span>
          </div>
          <div>
            <p style={{fontSize:'18px',fontWeight:'700',color:'#111827'}}>{userData?.name}</p>
            <p style={{fontSize:'14px',color:'#6B7280'}}>@{userData?.username}</p>
          </div>
        </div>
        <div style={{padding:'12px',background:'#F9FAFB',borderRadius:'12px'}}>
          <p style={{fontSize:'13px',color:'#6B7280',marginBottom:'2px'}}>EMAIL</p>
          <p style={{fontSize:'15px',color:'#111827',fontWeight:'600'}}>{user?.email}</p>
        </div>
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>CHANGE PASSWORD</p>
        {error && <p style={{color:'#EF4444',fontSize:'14px',marginBottom:'12px'}}>{error}</p>}
        {message && <p style={{color:'#10B981',fontSize:'14px',marginBottom:'12px'}}>{message}</p>}
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <button onClick={changePassword} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Update Password</button>
        </div>
      </div>
    </div>
  )
}