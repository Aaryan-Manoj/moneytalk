import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const MultiAccessContext = createContext()

export function MultiAccessProvider({ children }) {
  const [accounts, setAccounts] = useState([])
  const [expenses, setExpenses] = useState({})
  const [uid, setUid] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        setCurrentUser(user)
        await loadAccounts(user.uid)
      }
    })
    return () => unsub()
  }, [])

  const loadAccounts = async (userId) => {
    const snap = await getDocs(collection(db, 'users', userId, 'multiAccess'))
    const loaded = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    setAccounts(loaded)
    const loadedExpenses = {}
    for (const acc of loaded) {
      const expSnap = await getDocs(collection(db, 'users', userId, 'multiAccess', acc.id, 'expenses'))
      loadedExpenses[acc.id] = expSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
    setExpenses(loadedExpenses)
  }

  const createAccount = async (name, memberUids, memberNames, budget) => {
    if (!uid) return null
    const data = {
      name,
      members: ['Me', ...memberNames],
      memberUids: [uid, ...memberUids],
      pendingMembers: memberNames.filter((_, i) => memberUids[i] !== null),
      status: memberNames.length === 0 ? 'active' : 'awaiting',
      budget: Number(budget),
      createdBy: uid,
      createdByName: currentUser?.displayName || 'Someone',
      createdAt: new Date().toISOString()
    }
    const ref = await addDoc(collection(db, 'users', uid, 'multiAccess'), data)
    const accountId = ref.id

    for (let i = 0; i < memberNames.length; i++) {
      const memberName = memberNames[i]
      const memberUid = memberUids[i]
      if (memberUid) {
        await addDoc(collection(db, 'notifications'), {
          toUid: memberUid,
          toName: memberName,
          fromName: currentUser?.displayName || 'Someone',
          groupId: accountId,
          groupName: name,
          ownerUid: uid,
          type: 'group_invite',
          feature: 'multiAccess',
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      }
    }

    setAccounts(prev => [...prev, { id: accountId, ...data }])
    return accountId
  }

  const acceptAccountInvite = async (notification) => {
    const { groupId, ownerUid, toName } = notification
    const ref = doc(db, 'users', ownerUid, 'multiAccess', groupId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const data = snap.data()
    const newPending = (data.pendingMembers || []).filter(m => m !== toName)
    const isNowActive = newPending.length === 0
    await updateDoc(ref, { pendingMembers: newPending, status: isNowActive ? 'active' : 'awaiting' })
    setAccounts(prev => prev.map(a => a.id === groupId ? { ...a, pendingMembers: newPending, status: isNowActive ? 'active' : 'awaiting' } : a))
  }

  const declineAccountInvite = async (notification) => {
    const { groupId, ownerUid, groupName, toName } = notification
    const ref = doc(db, 'users', ownerUid, 'multiAccess', groupId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const data = snap.data()
    await addDoc(collection(db, 'notifications'), {
      toUid: ownerUid,
      toName: data.createdByName,
      fromName: toName,
      groupId,
      groupName,
      ownerUid,
      type: 'group_declined',
      feature: 'multiAccess',
      status: 'info',
      createdAt: new Date().toISOString()
    })
    const expSnap = await getDocs(collection(db, 'users', ownerUid, 'multiAccess', groupId, 'expenses'))
    for (const e of expSnap.docs) await deleteDoc(doc(db, 'users', ownerUid, 'multiAccess', groupId, 'expenses', e.id))
    await deleteDoc(ref)
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
      setExpenses(prev => ({ ...prev, [accountId]: [...(prev[accountId] || []), { id: ref.id, ...expense }] }))
    } else {
      setExpenses(prev => ({ ...prev, [accountId]: [...(prev[accountId] || []), { id: Date.now().toString(), ...expense }] }))
    }
  }

  const deleteExpense = async (accountId, expId) => {
    setExpenses(prev => ({ ...prev, [accountId]: (prev[accountId] || []).filter(e => e.id !== expId) }))
    if (uid) await deleteDoc(doc(db, 'users', uid, 'multiAccess', accountId, 'expenses', expId))
  }

  const updateExpense = async (accountId, expId, updated) => {
    setExpenses(prev => ({ ...prev, [accountId]: (prev[accountId] || []).map(e => e.id === expId ? { ...e, ...updated } : e) }))
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
    <MultiAccessContext.Provider value={{ accounts, createAccount, acceptAccountInvite, declineAccountInvite, updateBudget, addUser, addExpense, deleteExpense, updateExpense, getSettlement, getRemaining, expenses, uid, currentUser }}>
      {children}
    </MultiAccessContext.Provider>
  )
}

export function useMultiAccess() {
  return useContext(MultiAccessContext)
}