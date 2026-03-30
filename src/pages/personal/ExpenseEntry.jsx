import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'

const CATEGORIES = ['Food', 'Groceries', 'Rent', 'Stationery', 'Clothes', 'Salary', 'Miscellaneous']

export default function ExpenseEntry() {
  const navigate = useNavigate()
  const { expenses, addExpense, deleteExpense, updateExpense, remaining, budget } = usePersonal()
  const [item, setItem] = useState('')
  const [category, setCategory] = useState('Food')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [editId, setEditId] = useState(null)
  const [editAmount, setEditAmount] = useState('')

  const save = () => {
    if (!item || !amount || !date) return
    addExpense({ item, category, amount: Number(amount), date })
    setItem('')
    setAmount('')
    setDate('')
  }

  const saveEdit = (id) => {
    updateExpense(id, { amount: Number(editAmount) })
    setEditId(null)
    setEditAmount('')
  }

  const groupedByDate = expenses.reduce((acc, e) => {
    acc[e.date] = acc[e.date] || []
    acc[e.date].push(e)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedByDate).sort()

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <button onClick={() => navigate('/personal')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer',marginBottom:'24px'}}>← Back</button>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>Daily Expenses</h1>

      <div style={{background:'#2563EB',borderRadius:'16px',padding:'24px',marginBottom:'24px'}}>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>AVAILABLE BALANCE</p>
        <p style={{fontSize:'32px',fontWeight:'700',color:'#FFFFFF'}}>₹{remaining.toLocaleString()}</p>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginTop:'4px'}}>{budget.month || 'No month set'}</p>
      </div>

      <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
        <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>ADD EXPENSE</p>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <input placeholder="Item description" value={item} onChange={e => setItem(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none',background:'#FFFFFF'}}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'12px',padding:'12px',fontSize:'15px',outline:'none'}} />
          <button onClick={save} style={{background:'#2563EB',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer'}}>Add Expense</button>
        </div>
      </div>

      {sortedDates.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {sortedDates.map(date => (
            <div key={date} style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
              <p style={{fontSize:'13px',fontWeight:'700',color:'#2563EB',marginBottom:'12px'}}>{new Date(date).toLocaleDateString('en-IN', {weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
              {groupedByDate[date].map(e => (
                <div key={e.id} style={{padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <p style={{fontSize:'15px',fontWeight:'600',color:'#111827'}}>{e.item}</p>
                      <p style={{fontSize:'13px',color:'#6B7280'}}>{e.category}</p>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      {editId === e.id ? (
                        <>
                          <input type="number" value={editAmount} onChange={ev => setEditAmount(ev.target.value)} style={{border:'1px solid #E5E7EB',borderRadius:'8px',padding:'6px',fontSize:'14px',outline:'none',width:'80px'}} />
                          <button onClick={() => saveEdit(e.id)} style={{background:'#10B981',color:'#FFFFFF',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer'}}>✓</button>
                        </>
                      ) : (
                        <>
                          <p style={{fontSize:'15px',fontWeight:'700',color:'#EF4444'}}>-₹{e.amount}</p>
                          <button onClick={() => { setEditId(e.id); setEditAmount(e.amount) }} style={{background:'#F3F4F6',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#6B7280'}}>Edit</button>
                        </>
                      )}
                      <button onClick={() => deleteExpense(e.id)} style={{background:'#FEE2E2',border:'none',borderRadius:'8px',padding:'6px 10px',fontSize:'13px',cursor:'pointer',color:'#EF4444'}}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginTop:'12px',textAlign:'right'}}>Day total: ₹{groupedByDate[date].reduce((s,e) => s + e.amount, 0).toLocaleString()}</p>
            </div>
          ))}
          <button onClick={() => navigate('/personal/summary')} style={{background:'#7C3AED',color:'#FFFFFF',border:'none',borderRadius:'12px',padding:'14px',fontSize:'15px',fontWeight:'600',cursor:'pointer',width:'100%'}}>View Summary</button>
        </div>
      )}
    </div>
  )
}