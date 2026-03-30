import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const PersonalContext = createContext()

export function PersonalProvider({ children }) {
  const [allMonths, setAllMonths] = useState({})
  const [activeMonth, setActiveMonth] = useState('')
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const monthSnap = await getDocs(collection(db, 'users', user.uid, 'months'))
        const loaded = {}
        for (const d of monthSnap.docs) {
          const expSnap = await getDocs(collection(db, 'users', user.uid, 'months', d.id, 'expenses'))
          loaded[d.id] = {
            ...d.data(),
            expenses: expSnap.docs.map(e => ({ id: e.id, ...e.data() }))
          }
        }
        setAllMonths(loaded)
        const keys = Object.keys(loaded)
        if (keys.length > 0) setActiveMonth(keys[keys.length - 1])
      }
    })
    return () => unsub()
  }, [])

  const budget = allMonths[activeMonth] || { month: activeMonth, total: 0, allocations: [] }
  const expenses = budget.expenses || []

  const setBudget = async (data) => {
    const key = data.month
    setActiveMonth(key)
    const existing = allMonths[key] || { expenses: [] }
    const updated = { ...existing, ...data }
    setAllMonths(prev => ({ ...prev, [key]: updated }))
    if (uid) {
      await setDoc(doc(db, 'users', uid, 'months', key), {
        month: data.month,
        total: data.total,
        allocations: data.allocations
      })
    }
  }

  const addExpense = async (expense) => {
    if (!activeMonth) return
    if (uid) {
      const ref = await addDoc(collection(db, 'users', uid, 'months', activeMonth, 'expenses'), expense)
      setAllMonths(prev => ({
        ...prev,
        [activeMonth]: {
          ...prev[activeMonth],
          expenses: [...(prev[activeMonth]?.expenses || []), { id: ref.id, ...expense }]
        }
      }))
    } else {
      setAllMonths(prev => ({
        ...prev,
        [activeMonth]: {
          ...prev[activeMonth],
          expenses: [...(prev[activeMonth]?.expenses || []), { id: Date.now().toString(), ...expense }]
        }
      }))
    }
  }

  const deleteExpense = async (id) => {
    setAllMonths(prev => ({
      ...prev,
      [activeMonth]: {
        ...prev[activeMonth],
        expenses: (prev[activeMonth]?.expenses || []).filter(e => e.id !== id)
      }
    }))
    if (uid) await deleteDoc(doc(db, 'users', uid, 'months', activeMonth, 'expenses', id))
  }

  const updateExpense = async (id, updated) => {
    setAllMonths(prev => ({
      ...prev,
      [activeMonth]: {
        ...prev[activeMonth],
        expenses: (prev[activeMonth]?.expenses || []).map(e => e.id === id ? { ...e, ...updated } : e)
      }
    }))
    if (uid) await updateDoc(doc(db, 'users', uid, 'months', activeMonth, 'expenses', id), updated)
  }

  const remaining = (budget.total || 0)
    - (budget.allocations || []).reduce((sum, a) => sum + Number(a.amount || 0), 0)
    - expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  return (
    <PersonalContext.Provider value={{
      budget, setBudget, expenses, addExpense, deleteExpense, updateExpense,
      remaining, activeMonth, setActiveMonth, allMonths
    }}>
      {children}
    </PersonalContext.Provider>
  )
}

export function usePersonal() {
  return useContext(PersonalContext)
}