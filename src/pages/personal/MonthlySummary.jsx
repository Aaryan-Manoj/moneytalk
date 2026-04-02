import { useState } from 'react'
import { exportPersonalPDF } from '../../pdfExport'
import { useNavigate } from 'react-router-dom'
import { usePersonal } from '../../context/PersonalContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function MonthlySummary() {
  const navigate = useNavigate()
  const { expenses, budget } = usePersonal()
  const [selectedCategory, setSelectedCategory] = useState(null)

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const allCategories = [...new Set([
    ...Object.keys(categoryTotals),
    ...budget.allocations.filter(a => a.label).map(a => a.label)
  ])]

  const data = allCategories.map(cat => ({
    category: cat,
    spent: categoryTotals[cat] || 0,
    allocated: budget.allocations.find(a => a.label === cat) ? Number(budget.allocations.find(a => a.label === cat).amount) : 0
  }))

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const selectedItems = selectedCategory ? expenses.filter(e => e.category === selectedCategory) : []

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'900px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate('/personal')} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>
      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>Monthly Summary</h1>
      <p style={{fontSize:'15px',color:'#6B7280',marginBottom:'24px'}}>{budget.month || 'No month set'}</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
        <div style={{background:'#2563EB',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL BUDGET</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{budget.total.toLocaleString()}</p>
        </div>
        <div style={{background:'#7C3AED',borderRadius:'16px',padding:'20px'}}>
          <p style={{fontSize:'13px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>TOTAL SPENT</p>
          <p style={{fontSize:'24px',fontWeight:'700',color:'#FFFFFF'}}>₹{total.toLocaleString()}</p>
        </div>
      </div>

      {/* ✅ Export PDF button — after stat cards */}
      <button onClick={() => exportPersonalPDF(budget, expenses)} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%',marginTop:'16px'}}>⬇ Export PDF</button>

      <div style={{display:'grid',gridTemplateColumns:selectedCategory?'1fr 1fr':'1fr',gap:'16px'}}>
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'4px'}}>SPENDING BY CATEGORY</p>
          <p style={{fontSize:'12px',color:'#9CA3AF',marginBottom:'16px'}}>Click a bar to see details</p>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} onClick={e => e && e.activeLabel && setSelectedCategory(e.activeLabel)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="category" tick={{fontSize:11,fill:'#6B7280'}} />
                <YAxis tick={{fontSize:11,fill:'#6B7280'}} />
                <Tooltip formatter={(v,n) => [`₹${v}`, n==='spent'?'Spent':'Allocated']} />
                <Legend />
                <Bar dataKey="spent" fill="#2563EB" radius={[6,6,0,0]} name="Spent" />
                <Bar dataKey="allocated" fill="#7C3AED" radius={[6,6,0,0]} name="Allocated" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{color:'#6B7280',fontSize:'15px',textAlign:'center',padding:'48px 0'}}>No expenses logged yet.</p>
          )}
        </div>

        {selectedCategory && (
          <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
              <p style={{fontSize:'15px',fontWeight:'700',color:'#111827'}}>{selectedCategory}</p>
              <button onClick={() => setSelectedCategory(null)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer',fontSize:'18px'}}>✕</button>
            </div>
            {selectedItems.length > 0 ? selectedItems.map(e => (
              <div key={e.id} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
                <div>
                  <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{e.item}</p>
                  <p style={{fontSize:'12px',color:'#6B7280'}}>{e.date}</p>
                </div>
                <p style={{fontSize:'14px',fontWeight:'700',color:'#EF4444'}}>-₹{e.amount}</p>
              </div>
            )) : (
              <p style={{color:'#6B7280',fontSize:'14px'}}>No expenses under this category.</p>
            )}
            <div style={{marginTop:'16px',padding:'12px',background:'#F9FAFB',borderRadius:'12px'}}>
              <p style={{fontSize:'13px',fontWeight:'600',color:'#111827'}}>Total: ₹{selectedItems.reduce((s,e)=>s+e.amount,0).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* ✅ Export PDF button — bottom of page */}
      <button onClick={() => exportPersonalPDF(budget, expenses)} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%',marginTop:'16px'}}>⬇ Export PDF</button>

    </div>
  )
}