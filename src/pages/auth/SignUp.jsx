import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export default function SignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async () => {
    if (!form.name || !form.username || !form.email || !form.password || !form.confirm) return setError('All fields are required.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const res = await createUserWithEmailAndPassword(auth, form.email, form.password)
      await updateProfile(res.user, { displayName: form.name })
      await setDoc(doc(db, 'users', res.user.uid), { name: form.name, username: form.username, email: form.email, uid: res.user.uid })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'48px',display:'flex',flexDirection:'column',gap:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',width:'100%',maxWidth:'420px'}}>
        <button onClick={() => navigate('/')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',textAlign:'left',marginBottom:'8px'}}>← Back</button>
        <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827'}}>Create Account</h1>
        {error && <p style={{color:'#EF4444',fontSize:'14px'}}>{error}</p>}
        {['name','username','email','password','confirm'].map((field) => (
          <input
            key={field}
            name={field}
            type={field === 'password' || field === 'confirm' ? 'password' : 'text'}
            placeholder={field === 'confirm' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={handle}
            style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'14px',fontSize:'15px',outline:'none',width:'100%'}}
          />
        ))}
        <button onClick={submit} disabled={loading} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginTop:'8px'}}>
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
        <p style={{textAlign:'center',fontSize:'14px',color:'#6B7280'}}>Already have an account? <span onClick={() => navigate('/login')} style={{color:'#2563EB',cursor:'pointer',fontWeight:'600'}}>Sign In</span></p>
      </div>
    </div>
  )
}