import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#FFFFFF',borderRadius:'24px',padding:'56px 48px',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)',width:'100%',maxWidth:'420px'}}>
        <h1 style={{fontSize:'32px',fontWeight:'700',color:'#111827',letterSpacing:'-0.5px'}}>MoneyTalk</h1>
        <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'16px'}}>Personal Finance Tracker</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px',width:'100%'}}>
          <button style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}} onClick={() => navigate('/signup')}>Sign Up</button>
          <button style={{background:'#F3F4F6',color:'#111827',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}} onClick={() => navigate('/login')}>Sign In</button>
        </div>
      </div>
    </div>
  )
}
