import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../../firebase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!email || !password) return setError('All fields are required.')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password.')
    }
    setLoading(false)
  }

  const forgot = async () => {
    if (!email) return setError('Enter your email first.')
    try {
      await sendPasswordResetEmail(auth, email)
      setError('Reset email sent.')
    } catch {
      setError('Could not send reset email.')
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',display:'flex',flexDirection:'column',gap:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',width:'100%',maxWidth:'420px'}}>
        <button onClick={() => navigate('/')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',textAlign:'left'}}>← Back</button>
        <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827'}}>Sign In</h1>
        {error && <p style={{color:'#EF4444',fontSize:'14px'}}>{error}</p>}
        <input type="text" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'14px',fontSize:'15px',outline:'none'}} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'14px',fontSize:'15px',outline:'none'}} />
        <span onClick={forgot} style={{color:'#2563EB',fontSize:'14px',cursor:'pointer',textAlign:'right'}}>Forgot Password?</span>
        <button onClick={submit} disabled={loading} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <p style={{textAlign:'center',fontSize:'14px',color:'#6B7280'}}>No account? <span onClick={() => navigate('/signup')} style={{color:'#2563EB',cursor:'pointer',fontWeight:'600'}}>Sign Up</span></p>
      </div>
    </div>
  )
}