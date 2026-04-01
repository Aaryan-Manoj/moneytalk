import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const GroupContext = createContext()

export function GroupProvider({ children }) {
  const [groups, setGroups] = useState([])
  const [expenses, setExpenses] = useState({})
  const [uid, setUid] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const groupSnap = await getDocs(collection(db, 'users', user.uid, 'groups'))
        const loadedGroups = groupSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setGroups(loadedGroups)
        const loadedExpenses = {}
        for (const group of loadedGroups) {
          const expSnap = await getDocs(collection(db, 'users', user.uid, 'groups', group.id, 'expenses'))
          loadedExpenses[group.id] = expSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        }
        setExpenses(loadedExpenses)
      }
    })
    return () => unsub()
  }, [])

  const createGroup = async (name, members) => {
    const groupData = { name, members: ['Me', ...members] }
    if (uid) {
      const ref = await addDoc(collection(db, 'users', uid, 'groups'), groupData)
      setGroups(prev => [...prev, { id: ref.id, ...groupData }])
      return ref.id
    } else {
      const id = Date.now().toString()
      setGroups(prev => [...prev, { id, ...groupData }])
      return id
    }
  }

  const deleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const currentUser = auth.currentUser
    for (const member of group.members) {
      if (member !== 'Me') {
        await addDoc(collection(db, 'notifications'), {
          toName: member,
          message: `The group "${group.name}" was deleted by ${currentUser?.displayName || 'the creator'}.`,
          type: 'group_deleted',
          read: false,
          createdAt: new Date().toISOString()
        })
      }
    }
    const expSnap = await getDocs(collection(db, 'users', uid, 'groups', groupId, 'expenses'))
    for (const e of expSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'groups', groupId, 'expenses', e.id))
    }
    await deleteDoc(doc(db, 'users', uid, 'groups', groupId))
    setGroups(prev => prev.filter(g => g.id !== groupId))
    setExpenses(prev => { const copy = {...prev}; delete copy[groupId]; return copy })
  }

  const addGroupExpense = async (groupId, expense) => {
    if (uid) {
      const ref = await addDoc(collection(db, 'users', uid, 'groups', groupId, 'expenses'), expense)
      setExpenses(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), { id: ref.id, ...expense }]
      }))
    } else {
      setExpenses(prev => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), { id: Date.now().toString(), ...expense }]
      }))
    }
  }

  const deleteGroupExpense = async (groupId, expId) => {
    setExpenses(prev => ({
      ...prev,
      [groupId]: (prev[groupId] || []).filter(e => e.id !== expId)
    }))
    if (uid) await deleteDoc(doc(db, 'users', uid, 'groups', groupId, 'expenses', expId))
  }

  const updateGroupExpense = async (groupId, expId, updated) => {
    setExpenses(prev => ({
      ...prev,
      [groupId]: (prev[groupId] || []).map(e => e.id === expId ? { ...e, ...updated } : e)
    }))
    if (uid) await updateDoc(doc(db, 'users', uid, 'groups', groupId, 'expenses', expId), updated)
  }

  const getSettlement = (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return { balances: [], transactions: [] }
    const groupExpenses = expenses[groupId] || []
    const balances = {}
    group.members.forEach(m => balances[m] = 0)
    groupExpenses.forEach(exp => {
      const splitAmount = exp.amount / exp.splitAmong.length
      exp.splitAmong.forEach(member => {
        if (member !== exp.paidBy) {
          balances[exp.paidBy] += splitAmount
          balances[member] -= splitAmount
        }
      })
    })

    const transactions = []
    const pos = Object.entries(balances).filter(([,v]) => v > 0).map(([m,v]) => ({ member: m, amount: v }))
    const neg = Object.entries(balances).filter(([,v]) => v < 0).map(([m,v]) => ({ member: m, amount: -v }))

    let i = 0, j = 0
    while (i < pos.length && j < neg.length) {
      const amount = Math.min(pos[i].amount, neg[j].amount)
      transactions.push({
        from: neg[j].member,
        to: pos[i].member,
        amount: Math.round(amount * 100) / 100
      })
      pos[i].amount -= amount
      neg[j].amount -= amount
      if (pos[i].amount < 0.01) i++
      if (neg[j].amount < 0.01) j++
    }

    return {
      balances: Object.entries(balances).map(([member, balance]) => ({
        member,
        balance: Math.round(balance * 100) / 100
      })),
      transactions
    }
  }

  return (
    <GroupContext.Provider value={{ groups, createGroup, deleteGroup, addGroupExpense, deleteGroupExpense, updateGroupExpense, getSettlement, expenses }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  return useContext(GroupContext)
}