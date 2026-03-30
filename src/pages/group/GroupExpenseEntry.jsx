import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGroup } from '../../context/GroupContext'

export default function GroupExpenseEntry() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { groups, addGroupExpense, deleteGroupExpense, updateGroupExpense, expenses } = useGroup()

  const group = groups.find(g => g.id === id)
  const groupExpenses = expenses[id] || []

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [splitAmong, setSplitAmong] = useState([])
  const [editId, setEditId] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  const toggleSplit = (member) => {
    setSplitAmong(prev =>
      prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
    )
  }

  const save = () => {
    if (!desc || !amount || !date || !paidBy || splitAmong.length === 0) return
    addGroupExpense(id, { desc, amount: Number(amount), date, paidBy, splitAmong })
    setDesc('')
    setAmount('')
    setDate('')
    setPaidBy('')
    setSplitAmong([])
  }

  const saveEdit = (expId) => {
    updateGroupExpense(id, expId, { amount: Number(editAmount) })
    setEditId(null)
    setEditAmount('')
  }

  if (!group) return <div style={{padding:'32px'}}>Group not found.</div>

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={() => navigate('/group')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',marginBottom:'24px'}}>← Back</button>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>{group.name}</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{group.members.join(', ')}</p>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>ADD EXPENSE</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />

          <div>
            <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>PAID BY</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {group.members.map(m => (
                <button key={m} onClick={() => setPaidBy(m)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',background:paidBy===m?'#2563EB':'#F3F4F6',color:paidBy===m?'#FFFFFF':'#6B7280'}}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>SPLIT AMONG</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {group.members.map(m => (
                <button key={m} onClick={() => toggleSplit(m)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',background:splitAmong.includes(m)?'#7C3AED':'#F3F4F6',color:splitAmong.includes(m)?'#FFFFFF':'#6B7280'}}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button onClick={save} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Add Expense</button>
        </div>
      </div>

      {groupExpenses.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>LOGGED EXPENSES</p>
          {groupExpenses.map(e => (
            <div key={e.id} style={{padding:'12px 0',borderBottom:'1px solid #F3F4F6'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{e.desc}</p>
                  <p style={{fontSize:'13px',color:'#6B7280'}}>{e.date} · Paid by {e.paidBy}</p>
                  <p style={{fontSize:'12px',color:'#9CA3AF',marginTop:'2px'}}>Split: {e.splitAmong.join(', ')}</p>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginLeft:'12px'}}>
                  {editId === e.id ? (
                    <>
                      <input type="number" value={editAmount} onChange={ev => setEditAmount(ev.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'6px',fontSize:'14px',outline:'none',width:'80px'}} />
                      <button onClick={() => saveEdit(e.id)} style={{background:'#10B981',color:'#FFFFFF',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer'}}>✓</button>
                    </>
                  ) : (
                    <>
                      <p style={{fontSize:'15px',fontWeight:'700',color:'#111827'}}>₹{e.amount}</p>
                      <button onClick={() => { setEditId(e.id); setEditAmount(e.amount) }} style={{background:'#F3F4F6',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#6B7280'}}>Edit</button>
                    </>
                  )}
                  <button onClick={() => deleteGroupExpense(id, e.id)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#EF4444'}}>✕</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate(`/group/${id}/settlement`)} style={{background:'#7C3AED',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginTop:'16px'}}>View Settlement</button>
        </div>
      )}
    </div>
  )
}