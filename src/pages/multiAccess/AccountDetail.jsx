import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#2563EB', '#7C3AED', '#0EA5E9', '#8B5CF6', '#3B82F6', '#6D28D9']

export default function AccountDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { accounts, expenses, addExpense, deleteExpense, updateExpense, updateBudget, addUser, getRemaining } = useMultiAccess()

  const account = accounts.find(a => a.id === id)
  const accExpenses = expenses[id] || []
  const remaining = getRemaining(id)

  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [editId, setEditId] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [newMember, setNewMember] = useState('')
  const [showEditBudget, setShowEditBudget] = useState(false)
  const [newBudget, setNewBudget] = useState('')
  const [showChart, setShowChart] = useState(false)

  const spendingByMember = account ? account.members.map((m, i) => ({
    name: m,
    value: accExpenses.filter(e => e.paidBy === m).reduce((s, e) => s + Number(e.amount), 0),
    color: COLORS[i % COLORS.length]
  })).filter(d => d.value > 0) : []

  const save = async () => {
    if (!desc || !amount || !date || !paidBy) return
    await addExpense(id, { desc, amount: Number(amount), date, paidBy })
    setDesc(''); setAmount(''); setDate(''); setPaidBy('')
  }

  const saveEdit = async (expId) => {
    await updateExpense(id, expId, { amount: Number(editAmount) })
    setEditId(null); setEditAmount('')
  }

  const saveUser = async () => {
    if (!newMember.trim()) return
    await addUser(id, newMember.trim())
    setNewMember(''); setShowAddUser(false)
  }

  const saveBudget = async () => {
    if (!newBudget) return
    await updateBudget(id, newBudget)
    setNewBudget(''); setShowEditBudget(false)
  }

  if (!account) return <div style={{padding:'32px'}}>Account not found.</div>

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'640px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/multiaccess')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>{account.name}</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{account.members.join(', ')}</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
        <div style={{background:'#2563EB',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL BUDGET</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{account.budget.toLocaleString()}</p>
        </div>
        <div style={{background:remaining>=0?'#7C3AED':'#EF4444',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>REMAINING</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{remaining.toLocaleString()}</p>
        </div>
      </div>

      <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
        <button onClick={() => setShowAddUser(!showAddUser)} style={{flex:1,background:'#FFFFFF',border:'2px solid #2563EB',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#2563EB',cursor:'pointer'}}>+ Add User</button>
        <button onClick={() => setShowEditBudget(!showEditBudget)} style={{flex:1,background:'#FFFFFF',border:'2px solid #7C3AED',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#7C3AED',cursor:'pointer'}}>Edit Budget</button>
        {spendingByMember.length > 0 && (
          <button onClick={() => setShowChart(!showChart)} style={{flex:1,background:'#FFFFFF',border:'2px solid #0EA5E9',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#0EA5E9',cursor:'pointer'}}>📊 Spending</button>
        )}
      </div>

      {showAddUser && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px',display:'flex',gap:'12px'}}>
          <input placeholder="New member name" value={newMember} onChange={e => setNewMember(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',flex:1}} />
          <button onClick={saveUser} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'12px 20px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>Add</button>
        </div>
      )}

      {showEditBudget && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'20px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px',display:'flex',gap:'12px'}}>
          <input type="number" placeholder="New budget amount" value={newBudget} onChange={e => setNewBudget(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',flex:1}} />
          <button onClick={saveBudget} style={{background:'#7C3AED',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'12px 20px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>Save</button>
        </div>
      )}

      {showChart && spendingByMember.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>WHO SPENT THE MOST</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={spendingByMember} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                {spendingByMember.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Spent']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>ADD EXPENSE</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <div>
            <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'8px'}}>PAID BY</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
              {account.members.map(m => (
                <button key={m} onClick={() => setPaidBy(m)} style={{padding:'8px 16px',borderRadius:'10px',border:'none',fontSize:'14px',fontWeight:'600',cursor:'pointer',background:paidBy===m?'#2563EB':'#F3F4F6',color:paidBy===m?'#FFFFFF':'#6B7280'}}>{m}</button>
              ))}
            </div>
          </div>
          <button onClick={save} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Add Expense</button>
        </div>
      </div>

      {accExpenses.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>EXPENSE LOG</p>
          {[...accExpenses].sort((a,b) => new Date(a.date)-new Date(b.date)).map(e => (
            <div key={e.id} style={{padding:'12px 0',borderBottom:'1px solid #F3F4F6'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{e.desc}</p>
                  <p style={{fontSize:'13px',color:'#2563EB',fontWeight:'600'}}>{new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</p>
                  <p style={{fontSize:'13px',color:'#6B7280'}}>{e.paidBy}</p>
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
                  <button onClick={() => deleteExpense(id, e.id)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#EF4444'}}>✕</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => navigate(`/multiaccess/${id}/settlement`)} style={{background:'#7C3AED',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%',marginTop:'16px'}}>View Settlement</button>
        </div>
      )}
    </div>
  )
}