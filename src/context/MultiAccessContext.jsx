import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const MultiAccessContext = createContext()

export function MultiAccessProvider({ children }) {
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState({})
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const accSnap = await getDocs(collection(db, 'users', user.uid, 'multiAccess'))
        const loadedAccounts = accSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setAccounts(loadedAccounts)
        const loadedExpenses = {}
        for (const acc of loadedAccounts) {
          const expSnap = await getDocs(collection(db, 'users', user.uid, 'multiAccess', acc.id, 'expenses'))
          loadedExpenses[acc.id] = expSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        }
        setExpenses(loadedExpenses)
      }
    })
    return () => unsub()
  }, [])

  const createAccount = async (name, members, budget) => {
    const data = { name, members: ['Me', ...members], budget: Number(budget), createdAt: new Date().toISOString() }
    if (uid) {
      const ref = await addDoc(collection(db, 'users', uid, 'multiAccess'), data)
      setAccounts(prev => [...prev, { id: ref.id, ...data }])
      return ref.id
    } else {
      const id = Date.now().toString()
      setAccounts(prev => [...prev, { id, ...data }])
      return id
    }
  }

  const updateBudget = async (accountId, newBudget) => {
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, budget: Number(newBudget) } : a))
    if (uid) await updateDoc(doc(db, 'users', uid, 'multiAccess', accountId), { budget: Number(newBudget) })
  }

  const addUser = async (accountId, newMember) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return
    const updated = [...account.members, newMember]
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, members: updated } : a))
    if (uid) await updateDoc(doc(db, 'users', uid, 'multiAccess', accountId), { members: updated })
  }

  const addExpense = async (accountId, expense) => {
    if (uid) {
      const ref = await addDoc(collection(db, 'users', uid, 'multiAccess', accountId, 'expenses'), expense)
      setExpenses(prev => ({
        ...prev,
        [accountId]: [...(prev[accountId] || []), { id: ref.id, ...expense }]
      }))
    } else {
      setExpenses(prev => ({
        ...prev,
        [accountId]: [...(prev[accountId] || []), { id: Date.now().toString(), ...expense }]
      }))
    }
  }

  const deleteExpense = async (accountId, expId) => {
    setExpenses(prev => ({
      ...prev,
      [accountId]: (prev[accountId] || []).filter(e => e.id !== expId)
    }))
    if (uid) await deleteDoc(doc(db, 'users', uid, 'multiAccess', accountId, 'expenses', expId))
  }

  const updateExpense = async (accountId, expId, updated) => {
    setExpenses(prev => ({
      ...prev,
      [accountId]: (prev[accountId] || []).map(e => e.id === expId ? { ...e, ...updated } : e)
    }))
    if (uid) await updateDoc(doc(db, 'users', uid, 'multiAccess', accountId, 'expenses', expId), updated)
  }

  const getSettlement = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return []
    const accExpenses = expenses[accountId] || []
    const totalSpent = accExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const perPerson = totalSpent / account.members.length
    const paid = {}
    account.members.forEach(m => paid[m] = 0)
    accExpenses.forEach(e => { paid[e.paidBy] = (paid[e.paidBy] || 0) + Number(e.amount) })
    return account.members.map(m => ({
      member: m,
      paid: paid[m] || 0,
      owes: Math.round((perPerson - (paid[m] || 0)) * 100) / 100
    }))
  }

  const getRemaining = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return 0
    const total = (expenses[accountId] || []).reduce((s, e) => s + Number(e.amount), 0)
    return account.budget - total
  }

  return (
    <MultiAccessContext.Provider value={{ accounts, createAccount, updateBudget, addUser, addExpense, deleteExpense, updateExpense, getSettlement, getRemaining, expenses }}>
      {children}
    </MultiAccessContext.Provider>
  )
}

export function useMultiAccess() {
  return useContext(MultiAccessContext)
}