import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
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
      } else {
        setUid(null)
        setCurrentUser(null)
        setAccounts([])
        setExpenses({})
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
      const ownerUid = acc.ownerUid || userId
      const expSnap = await getDocs(collection(db, 'users', ownerUid, 'multiAccess', acc.id, 'expenses'))
      loadedExpenses[acc.id] = expSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
    setExpenses(loadedExpenses)
  }

  const createAccount = async (name, memberUids, memberNames, budget) => {
    if (!uid) return null
    const data = {
      name,
      members: ['Me', ...memberNames],
      memberUids: [uid, ...memberUids.filter(u => u)],
      pendingMembers: memberNames.filter((_, i) => memberUids[i]),
      status: memberNames.length === 0 ? 'active' : 'awaiting',
      budget: Number(budget),
      createdBy: uid,
      createdByName: currentUser?.displayName || 'Someone',
      createdAt: new Date().toISOString()
    }
    const ref = await addDoc(collection(db, 'users', uid, 'multiAccess'), data)
    const accountId = ref.id

    for (let i = 0; i < memberNames.length; i++) {
      const memberUid = memberUids[i]
      const memberName = memberNames[i]
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
    const { groupId, ownerUid, toName, toUid } = notification
    const ref = doc(db, 'users', ownerUid, 'multiAccess', groupId)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const data = snap.data()

    const newPending = (data.pendingMembers || []).filter(m => m !== toName)
    const isNowActive = newPending.length === 0

    await updateDoc(ref, { pendingMembers: newPending, status: isNowActive ? 'active' : 'awaiting' })

    // ✅ Write full copy to B's Firestore path
    const myData = { ...data, pendingMembers: newPending, status: isNowActive ? 'active' : 'awaiting', ownerUid, isShared: true }
    await setDoc(doc(db, 'users', toUid, 'multiAccess', groupId), myData)

    // ✅ Update all other members' copies
    for (const memberUid of (data.memberUids || [])) {
      if (memberUid !== ownerUid && memberUid !== toUid) {
        try {
          const memberCopy = doc(db, 'users', memberUid, 'multiAccess', groupId)
          const memberSnap = await getDoc(memberCopy)
          if (memberSnap.exists()) {
            await updateDoc(memberCopy, {
              pendingMembers: newPending,
              status: isNowActive ? 'active' : 'awaiting'
            })
          }
        } catch (e) {}
      }
    }

    // ✅ Refresh local state
    await loadAccounts(toUid)
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

    for (const memberUid of (data.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try { await deleteDoc(doc(db, 'users', memberUid, 'multiAccess', groupId)) } catch (e) {}
      }
    }
  }

  const deleteAccount = async (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return
    const ownerUid = account.ownerUid || uid

    for (const memberUid of (account.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try {
          const memberIndex = (account.memberUids || []).indexOf(memberUid)
          const memberName = account.members[memberIndex] || 'Member'
          await addDoc(collection(db, 'notifications'), {
            toUid: memberUid,
            toName: memberName,
            fromName: currentUser?.displayName || 'Someone',
            groupId: accountId,
            groupName: account.name,
            message: `${currentUser?.displayName || 'Someone'} deleted the shared account "${account.name}".`,
            type: 'group_deleted',
            feature: 'multiAccess',
            read: false,
            createdAt: new Date().toISOString()
          })
        } catch (e) {}
      }
    }

    const expSnap = await getDocs(collection(db, 'users', ownerUid, 'multiAccess', accountId, 'expenses'))
    for (const e of expSnap.docs) await deleteDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId, 'expenses', e.id))
    await deleteDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId))

    for (const memberUid of (account.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try { await deleteDoc(doc(db, 'users', memberUid, 'multiAccess', accountId)) } catch (e) {}
      }
    }

    setAccounts(prev => prev.filter(a => a.id !== accountId))
    setExpenses(prev => { const copy = {...prev}; delete copy[accountId]; return copy })
  }

  const updateBudget = async (accountId, newBudget) => {
    const account = accounts.find(a => a.id === accountId)
    const ownerUid = account?.ownerUid || uid
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, budget: Number(newBudget) } : a))
    if (ownerUid) await updateDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId), { budget: Number(newBudget) })
  }

  const addUser = async (accountId, newMember) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return
    const updated = [...account.members, newMember]
    setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, members: updated } : a))
    const ownerUid = account.ownerUid || uid
    if (ownerUid) await updateDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId), { members: updated })
  }

  const addExpense = async (accountId, expense) => {
    const account = accounts.find(a => a.id === accountId)
    const ownerUid = account?.ownerUid || uid
    if (ownerUid) {
      const ref = await addDoc(collection(db, 'users', ownerUid, 'multiAccess', accountId, 'expenses'), expense)
      setExpenses(prev => ({ ...prev, [accountId]: [...(prev[accountId] || []), { id: ref.id, ...expense }] }))
    }
  }

  const deleteExpense = async (accountId, expId) => {
    const account = accounts.find(a => a.id === accountId)
    const ownerUid = account?.ownerUid || uid
    setExpenses(prev => ({ ...prev, [accountId]: (prev[accountId] || []).filter(e => e.id !== expId) }))
    if (ownerUid) await deleteDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId, 'expenses', expId))
  }

  const updateExpense = async (accountId, expId, updated) => {
    const account = accounts.find(a => a.id === accountId)
    const ownerUid = account?.ownerUid || uid
    setExpenses(prev => ({ ...prev, [accountId]: (prev[accountId] || []).map(e => e.id === expId ? { ...e, ...updated } : e) }))
    if (ownerUid) await updateDoc(doc(db, 'users', ownerUid, 'multiAccess', accountId, 'expenses', expId), updated)
  }

  const getSettlement = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return []
    const accExpenses = expenses[accountId] || []
    const paid = {}
    account.members.forEach(m => paid[m] = 0)
    accExpenses.forEach(e => { paid[e.paidBy] = (paid[e.paidBy] || 0) + Number(e.amount) })
    const totalSpent = accExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const perPerson = totalSpent / account.members.length
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
    <MultiAccessContext.Provider value={{ accounts, createAccount, deleteAccount, acceptAccountInvite, declineAccountInvite, updateBudget, addUser, addExpense, deleteExpense, updateExpense, getSettlement, getRemaining, expenses, uid, currentUser, loadAccounts }}>
      {children}
    </MultiAccessContext.Provider>
  )
}

export function useMultiAccess() {
  return useContext(MultiAccessContext)
}