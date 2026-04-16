import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'

export default function CreateAccount() {
  const navigate = useNavigate()
  const { createAccount } = useMultiAccess()
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [members, setMembers] = useState([{ search: '', selected: null, inviteLink: '', inviteId: '', results: [] }])
  const [saving, setSaving] = useState(false)

  const searchUsers = async (i, val) => {
    const updated = [...members]
    updated[i].search = val
    updated[i].selected = null
    updated[i].results = []
    setMembers([...updated])
    if (val.length < 1) return
    const snap = await getDocs(collection(db, 'users'))
    const lower = val.toLowerCase()
    updated[i].results = snap.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter(u => u.username?.toLowerCase().includes(lower) || u.name?.toLowerCase().includes(lower))
      .filter(u => u.uid !== auth.currentUser?.uid)
    setMembers([...updated])
  }

  const selectUser = (i, user) => {
    const updated = [...members]
    updated[i].search = user.username
    updated[i].selected = user
    updated[i].results = []
    updated[i].inviteLink = ''
    setMembers([...updated])
  }

  const generateInvite = async (i) => {
    const member = members[i]
    const currentUser = auth.currentUser
    const ref = await addDoc(collection(db, 'invites'), {
      type: 'multiAccess',
      entityName: name || 'a shared account',
      memberName: member.search,
      createdBy: currentUser.uid,
      createdByName: currentUser.displayName || 'Someone',
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    const link = `${window.location.origin}/join/${ref.id}`
    const updated = [...members]
    updated[i].inviteLink = link
    updated[i].inviteId = ref.id
    setMembers([...updated])
  }

  const copyLink = (link) => {
    navigator.clipboard.writeText(link)
    alert('Link copied to clipboard!')
  }

  const addMember = () => setMembers([...members, { search: '', selected: null, inviteLink: '', inviteId: '', results: [] }])
  const removeMember = (i) => setMembers(members.filter((_, idx) => idx !== i))

  const save = async () => {
    if (!name || !budget) return
    setSaving(true)
    const validMembers = members.filter(m => m.search.trim() !== '')
    const memberUids = validMembers.map(m => m.selected?.uid || null)
    const memberNames = validMembers.map(m => m.selected?.name || m.search)
    const accountId = await createAccount(name, memberUids, memberNames, budget)
    for (const m of validMembers) {
      if (m.inviteId && accountId) {
        const { updateDoc, doc } = await import('firebase/firestore')
        await updateDoc(doc(db, 'invites', m.inviteId), { entityId: accountId })
      }
    }
    setSaving(false)
    navigate('/multiaccess')
  }

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/multiaccess')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'24px'}}>Create Shared Account</h1>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>ACCOUNT NAME</p>
        <input placeholder="e.g. Family Budget" value={name} onChange={e => setName(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}} />
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>TOTAL BUDGET (₹)</p>
        <input type="number" placeholder="0" value={budget} onChange={e => setBudget(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}} />
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'4px'}}>ADD MEMBERS</p>
        <p style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'16px'}}>Type a username to search. Or generate an invite link for someone without an account.</p>

        {members.map((m, i) => (
          <div key={i} style={{marginBottom:'16px',padding:'16px',background:'#F9FAFB',borderRadius:'12px'}}>
            <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
              <div style={{flex:1,position:'relative'}}>
                <input
                  placeholder="Search by username or name"
                  value={m.search}
                  onChange={e => searchUsers(i, e.target.value)}
                  style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',width:'100%'}}
                />
                {m.results.length > 0 && (
                  <div style={{position:'absolute',top:'100%',left:0,right:0,background:'#FFFFFF',borderRadius:'12px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)',zIndex:10,marginTop:'4px',maxHeight:'180px',overflowY:'auto'}}>
                    {m.results.map(u => (
                      <div key={u.uid} onClick={() => selectUser(i, u)} style={{padding:'12px 16px',cursor:'pointer',borderBottom:'1px solid #F3F4F6',fontSize:'14px'}}>
                        <span style={{fontWeight:'600',color:'#111827'}}>@{u.username}</span>
                        <span style={{color:'#6B7280',marginLeft:'8px'}}>{u.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {members.length > 1 && (
                <button onClick={() => removeMember(i)} style={{background:'#FEE2E2',border:'none',borderRadius:'12px',padding:'12px',cursor:'pointer',color:'#EF4444',fontSize:'16px'}}>✕</button>
              )}
            </div>

            {m.selected && (
              <p style={{fontSize:'13px',color:'#10B981',marginBottom:'8px'}}>✓ {m.selected.name} (@{m.selected.username}) — will receive notification</p>
            )}

            {!m.selected && m.search.trim() && !m.inviteLink && (
              <button onClick={() => generateInvite(i)} style={{background:'#EFF6FF',border:'none',borderRadius:'10px',padding:'8px 16px',fontSize:'13px',fontWeight:'600',color:'#2563EB',cursor:'pointer'}}>
                Generate Invite Link
              </button>
            )}

            {m.inviteLink && (
              <div style={{display:'flex',gap:'8px',alignItems:'center',marginTop:'8px'}}>
                <input value={m.inviteLink} readOnly style={{flex:1,border:'1px solid #E5E7EB',borderRadius:'10px',padding:'8px 12px',fontSize:'12px',outline:'none',color:'#6B7280',background:'#F9FAFB'}} />
                <button onClick={() => copyLink(m.inviteLink)} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'10px',padding:'8px 14px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>Copy</button>
              </div>
            )}
          </div>
        ))}

        <button onClick={addMember} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'10px 16px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer'}}>+ Add Member</button>
      </div>

      <button onClick={save} disabled={saving || !name || !budget} style={{background: (name && budget) ? '#2563EB' : '#E5E7EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:(name&&budget)?'pointer':'not-allowed',width:'100%'}}>
        {saving ? 'Creating...' : 'Create Account'}
      </button>
    </div>
  )
}