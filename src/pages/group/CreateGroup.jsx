import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGroup } from '../../context/GroupContext'

export default function CreateGroup() {
  const navigate = useNavigate()
  const { createGroup } = useGroup()
  const [name, setName] = useState('')
  const [members, setMembers] = useState([''])

  const addMember = () => setMembers([...members, ''])

  const updateMember = (i, val) => {
    const updated = [...members]
    updated[i] = val
    setMembers(updated)
  }

  const removeMember = (i) => setMembers(members.filter((_, idx) => idx !== i))

  const save = () => {
    if (!name) return
    const filtered = members.filter(m => m.trim() !== '')
    const id = createGroup(name, filtered)
    navigate('/group')
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={() => navigate('/group')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',marginBottom:'24px'}}>← Back</button>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Create Group</h1>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>GROUP NAME</p>
        <input placeholder="e.g. Roommates" value={name} onChange={e => setName(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}} />
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>ADD MEMBERS</p>
        <p style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'12px'}}>You are automatically added as "Me"</p>
        {members.map((m, i) => (
          <div key={i} style={{display:'flex',gap:'8px',marginBottom:'12px'}}>
            <input placeholder={`Member ${i + 1} name`} value={m} onChange={e => updateMember(i, e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',flex:1}} />
            {members.length > 1 && (
              <button onClick={() => removeMember(i)} style={{background:'#FEE2E2',border:'none',borderRadius:'12px',padding:'12px',cursor:'pointer',color:'#EF4444',fontSize:'16px'}}>✕</button>
            )}
          </div>
        ))}
        <button onClick={addMember} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'10px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>+ Add Member</button>
      </div>

      <button onClick={save} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}}>Save Group</button>
    </div>
  )
}