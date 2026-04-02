import { useState } from 'react'
import { exportMultiAccessPDF } from '../../pdfExport'
import { useNavigate, useParams } from 'react-router-dom'
import { useMultiAccess } from '../../context/MultiAccessContext'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#2563EB', '#7C3AED', '#0EA5E9', '#8B5CF6', '#3B82F6', '#6D28D9']

export default function SettlementCalc() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { accounts, expenses } = useMultiAccess()

  const account = accounts.find(a => a.id === id)
  const accExpenses = expenses[id] || []
  const totalSpent = accExpenses.reduce((s, e) => s + Number(e.amount), 0)
  const remaining = account ? account.budget - totalSpent : 0

  if (!account) return <div style={{padding:'32px'}}>Account not found.</div>

  const memberSpend = {}
  accExpenses.forEach(e => {
    memberSpend[e.paidBy] = (memberSpend[e.paidBy] || 0) + Number(e.amount)
  })

  const categorySpend = {}
  accExpenses.forEach(e => {
    const cat = e.category || e.desc || 'Other'
    categorySpend[cat] = (categorySpend[cat] || 0) + Number(e.amount)
  })

  const pieData = Object.entries(memberSpend).map(([name, value]) => ({ name, value }))
  const categoryData = Object.entries(categorySpend).sort((a, b) => b[1] - a[1])

  const byMember = {}
  accExpenses.forEach(e => {
    byMember[e.paidBy] = byMember[e.paidBy] || []
    byMember[e.paidBy].push(e)
  })

  return (
    <div style={{minHeight:'100vh',background:'#F9FAFB',padding:'32px',maxWidth:'560px',margin:'0 auto'}}>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <button onClick={() => navigate(`/multiaccess/${id}`)} style={{background:'none',border:'none',color:'#6B7280',fontSize:'14px',cursor:'pointer'}}>← Back</button>
        <button onClick={() => navigate('/dashboard')} style={{background:'#EFF6FF',border:'none',color:'#2563EB',fontSize:'14px',cursor:'pointer',borderRadius:'8px',padding:'4px 12px',fontWeight:'600'}}>⌂ Home</button>
      </div>

      <h1 style={{fontSize:'24px',fontWeight:'700',color:'#111827',marginBottom:'4px'}}>Spending Summary</h1>
      <p style={{fontSize:'14px',color:'#6B7280',marginBottom:'24px'}}>{account.name}</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginBottom:'24px'}}>
        <div style={{background:'#2563EB',borderRadius:'16px',padding:'16px'}}>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>BUDGET</p>
          <p style={{fontSize:'18px',fontWeight:'700',color:'#FFFFFF'}}>₹{account.budget.toLocaleString()}</p>
        </div>
        <div style={{background:'#7C3AED',borderRadius:'16px',padding:'16px'}}>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>SPENT</p>
          <p style={{fontSize:'18px',fontWeight:'700',color:'#FFFFFF'}}>₹{totalSpent.toLocaleString()}</p>
        </div>
        <div style={{background:remaining >= 0 ? '#10B981' : '#EF4444',borderRadius:'16px',padding:'16px'}}>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'4px'}}>LEFT</p>
          <p style={{fontSize:'18px',fontWeight:'700',color:'#FFFFFF'}}>₹{Math.abs(remaining).toLocaleString()}</p>
        </div>
      </div>

      {pieData.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>WHO SPENT HOW MUCH</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={false}        // ✅ removes the label lines completely
                labelLine={false}    // ✅ removes the connecting lines
              >
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              {/* ✅ Tooltip shows name + amount only on hover */}
              <Tooltip formatter={(value, name) => [`₹${Number(value).toLocaleString()}`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>

          <div style={{marginTop:'16px'}}>
            {Object.entries(memberSpend).sort((a,b) => b[1]-a[1]).map(([member, amt], i) => (
              <div key={member} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
                <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'50%',background:COLORS[i % COLORS.length]}} />
                  <p style={{fontSize:'14px',fontWeight:'600',color:'#111827'}}>{member}</p>
                </div>
                <p style={{fontSize:'14px',fontWeight:'700',color:'#2563EB'}}>₹{amt.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {categoryData.length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>WHAT WAS SPENT ON</p>
          {categoryData.map(([cat, amt]) => (
            <div key={cat} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #F3F4F6'}}>
              <p style={{fontSize:'14px',color:'#374151'}}>{cat}</p>
              <p style={{fontSize:'14px',fontWeight:'700',color:'#7C3AED'}}>₹{amt.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {Object.keys(byMember).length > 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'24px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{fontSize:'13px',fontWeight:'600',color:'#6B7280',marginBottom:'16px'}}>SPENDING REPORT</p>
          {Object.entries(byMember).map(([member, exps]) => (
            <div key={member} style={{marginBottom:'16px'}}>
              <p style={{fontSize:'14px',fontWeight:'700',color:'#111827',marginBottom:'8px'}}>{member}</p>
              {exps.map((e, i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0 6px 12px',borderLeft:'3px solid #E5E7EB'}}>
                  <div>
                    <p style={{fontSize:'13px',color:'#374151'}}>{e.desc || e.item}</p>
                    <p style={{fontSize:'11px',color:'#9CA3AF'}}>{e.category || ''} · {e.date}</p>
                  </div>
                  <p style={{fontSize:'13px',fontWeight:'700',color:'#EF4444'}}>₹{Number(e.amount).toLocaleString()}</p>
                </div>
              ))}
              <p style={{fontSize:'12px',fontWeight:'700',color:'#6B7280',textAlign:'right',marginTop:'6px'}}>
                Total: ₹{exps.reduce((s,e) => s + Number(e.amount), 0).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {accExpenses.length === 0 && (
        <div style={{background:'#FFFFFF',borderRadius:'16px',padding:'48px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <p style={{color:'#6B7280',fontSize:'15px'}}>No expenses recorded yet.</p>
        </div>
      )}

      {/* ✅ Fixed: passes memberSpend and categorySpend instead of old settlement */}
      <button onClick={() => exportMultiAccessPDF(account, accExpenses, memberSpend, categorySpend)} style={{background:'#F3F4F6',border:'none',borderRadius:'12px',padding:'12px',fontSize:'14px',fontWeight:'600',color:'#6B7280',cursor:'pointer',width:'100%',marginTop:'16px'}}>⬇ Export PDF</button>
    </div>
  )
}