import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  const cards = [
    { label: 'Personal', path: '/personal', color: '#2563EB' },
    { label: 'Group', path: '/group', color: '#7C3AED' },
    { label: 'Multi Access', path: '/multiaccess', color: '#2563EB' },
    { label: 'Month End Summary', path: '/monthend', color: '#7C3AED' },
  ]

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px'}}>
      <h1 style={{fontSize:'28px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>MoneyTalk</h1>
      <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'40px'}}>What would you like to do?</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',width:'100%',maxWidth:'560px'}}>
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            style={{background:'#FFFFFF',border:`2px solid ${card.color}`,borderRadius:'20px',padding:'40px 24px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',minHeight:'160px'}}
          >
            <div style={{width:'48px',height:'48px',borderRadius:'14px',background:card.color,marginBottom:'16px'}} />
            <span style={{fontSize:'16px',fontWeight:'600',color:'#111827',textAlign:'center'}}>{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}