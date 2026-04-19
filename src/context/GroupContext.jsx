import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../firebase'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const GroupContext = createContext()

export function GroupProvider({ children }) {
  const [groups, setGroups] = useState([])
  const [expenses, setExpenses] = useState({})
  const [uid, setUid] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        setCurrentUser(user)
        await loadGroups(user.uid)
      } else {
        setUid(null)
        setCurrentUser(null)
        setGroups([])
        setExpenses({})
      }
    })
    return () => unsub()
  }, [])

  const loadGroups = async (userId) => {
    const groupSnap = await getDocs(collection(db, 'users', userId, 'groups'))
    const loadedGroups = groupSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    setGroups(loadedGroups)
    const loadedExpenses = {}
    for (const group of loadedGroups) {
      const ownerUid = group.ownerUid || userId
      const expSnap = await getDocs(collection(db, 'users', ownerUid, 'groups', group.id, 'expenses'))
      loadedExpenses[group.id] = expSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    }
    setExpenses(loadedExpenses)
  }

  const createGroup = async (name, memberUids, memberNames) => {
    if (!uid) return null
    const groupData = {
      name,
      members: [currentUser?.displayName || 'Me', ...memberNames],
      memberUids: [uid, ...memberUids.filter(u => u)],
      pendingMembers: memberNames.filter((_, i) => memberUids[i]),
      status: memberNames.length === 0 ? 'active' : 'awaiting',
      createdBy: uid,
      createdByName: currentUser?.displayName || 'Someone',
      createdAt: new Date().toISOString()
    }
    const ref = await addDoc(collection(db, 'users', uid, 'groups'), groupData)
    const groupId = ref.id

    for (let i = 0; i < memberNames.length; i++) {
      const memberUid = memberUids[i]
      const memberName = memberNames[i]
      if (memberUid) {
        await addDoc(collection(db, 'notifications'), {
          toUid: memberUid,
          toName: memberName,
          fromName: currentUser?.displayName || 'Someone',
          groupId,
          groupName: name,
          ownerUid: uid,
          type: 'group_invite',
          feature: 'group',
          status: 'pending',
          createdAt: new Date().toISOString()
        })
      }
    }

    setGroups(prev => [...prev, { id: groupId, ...groupData }])
    return groupId
  }

  const acceptGroupInvite = async (notification) => {
    const { groupId, ownerUid, toName, toUid } = notification
    const groupRef = doc(db, 'users', ownerUid, 'groups', groupId)
    const groupSnap = await getDoc(groupRef)
    if (!groupSnap.exists()) return
    const groupData = groupSnap.data()

    const newPending = (groupData.pendingMembers || []).filter(m => m !== toName)
    const isNowActive = newPending.length === 0

    await updateDoc(groupRef, {
      pendingMembers: newPending,
      status: isNowActive ? 'active' : 'awaiting'
    })

    const myGroupData = {
      ...groupData,
      pendingMembers: newPending,
      status: isNowActive ? 'active' : 'awaiting',
      ownerUid,
      isShared: true
    }
    await setDoc(doc(db, 'users', toUid, 'groups', groupId), myGroupData)

    for (const memberUid of (groupData.memberUids || [])) {
      if (memberUid !== ownerUid && memberUid !== toUid) {
        try {
          const memberCopy = doc(db, 'users', memberUid, 'groups', groupId)
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

    await loadGroups(toUid)
  }

  const declineGroupInvite = async (notification) => {
    const { groupId, ownerUid, toName, groupName } = notification
    const groupRef = doc(db, 'users', ownerUid, 'groups', groupId)
    const groupSnap = await getDoc(groupRef)
    if (!groupSnap.exists()) return
    const groupData = groupSnap.data()

    await addDoc(collection(db, 'notifications'), {
      toUid: ownerUid,
      toName: groupData.createdByName,
      fromName: toName,
      groupId,
      groupName,
      ownerUid,
      type: 'group_declined',
      feature: 'group',
      status: 'info',
      createdAt: new Date().toISOString()
    })

    const expSnap = await getDocs(collection(db, 'users', ownerUid, 'groups', groupId, 'expenses'))
    for (const e of expSnap.docs) await deleteDoc(doc(db, 'users', ownerUid, 'groups', groupId, 'expenses', e.id))
    await deleteDoc(groupRef)

    for (const memberUid of (groupData.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try { await deleteDoc(doc(db, 'users', memberUid, 'groups', groupId)) } catch (e) {}
      }
    }
  }

  const deleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const ownerUid = group.ownerUid || uid

    for (const memberUid of (group.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try {
          const memberIndex = (group.memberUids || []).indexOf(memberUid)
          const memberName = group.members[memberIndex] || 'Member'
          await addDoc(collection(db, 'notifications'), {
            toUid: memberUid,
            toName: memberName,
            fromName: currentUser?.displayName || 'Someone',
            groupId,
            groupName: group.name,
            message: `${currentUser?.displayName || 'Someone'} deleted the group "${group.name}".`,
            type: 'group_deleted',
            feature: 'group',
            read: false,
            createdAt: new Date().toISOString()
          })
        } catch (e) {}
      }
    }

    const expSnap = await getDocs(collection(db, 'users', ownerUid, 'groups', groupId, 'expenses'))
    for (const e of expSnap.docs) await deleteDoc(doc(db, 'users', ownerUid, 'groups', groupId, 'expenses', e.id))
    await deleteDoc(doc(db, 'users', ownerUid, 'groups', groupId))

    for (const memberUid of (group.memberUids || [])) {
      if (memberUid !== ownerUid) {
        try { await deleteDoc(doc(db, 'users', memberUid, 'groups', groupId)) } catch (e) {}
      }
    }

    setGroups(prev => prev.filter(g => g.id !== groupId))
    setExpenses(prev => { const copy = {...prev}; delete copy[groupId]; return copy })
  }

  const addGroupExpense = async (groupId, expense) => {
    const group = groups.find(g => g.id === groupId)
    const ownerUid = group?.ownerUid || uid
    if (ownerUid) {
      const ref = await addDoc(collection(db, 'users', ownerUid, 'groups', groupId, 'expenses'), expense)
      setExpenses(prev => ({ ...prev, [groupId]: [...(prev[groupId] || []), { id: ref.id, ...expense }] }))
    }
  }

  const deleteGroupExpense = async (groupId, expId) => {
    const group = groups.find(g => g.id === groupId)
    const ownerUid = group?.ownerUid || uid
    setExpenses(prev => ({ ...prev, [groupId]: (prev[groupId] || []).filter(e => e.id !== expId) }))
    if (ownerUid) await deleteDoc(doc(db, 'users', ownerUid, 'groups', groupId, 'expenses', expId))
  }

  const updateGroupExpense = async (groupId, expId, updated) => {
    const group = groups.find(g => g.id === groupId)
    const ownerUid = group?.ownerUid || uid
    setExpenses(prev => ({ ...prev, [groupId]: (prev[groupId] || []).map(e => e.id === expId ? { ...e, ...updated } : e) }))
    if (ownerUid) await updateDoc(doc(db, 'users', ownerUid, 'groups', groupId, 'expenses', expId), updated)
  }

  const getSettlement = (groupId, viewerUid) => {
    const group = groups.find(g => g.id === groupId)
    if (!group) return { balances: [], transactions: [] }
    const groupExpenses = expenses[groupId] || []

    const resolvedMembers = group.members.map((m) => {
      if (m === 'Me') {
        if (viewerUid && viewerUid === (group.ownerUid || group.createdBy)) return 'Me'
        return group.createdByName || 'Me'
      }
      return m
    })

    const balances = {}
    resolvedMembers.forEach(m => balances[m] = 0)

    groupExpenses.forEach(exp => {
      const paidBy = exp.paidBy === 'Me'
        ? (viewerUid === (group.ownerUid || group.createdBy) ? 'Me' : group.createdByName || 'Me')
        : exp.paidBy
      const splitAmong = exp.splitAmong.map(m =>
        m === 'Me'
          ? (viewerUid === (group.ownerUid || group.createdBy) ? 'Me' : group.createdByName || 'Me')
          : m
      )
      const splitAmount = exp.amount / splitAmong.length
      splitAmong.forEach(member => {
        if (member !== paidBy) {
          balances[paidBy] = (balances[paidBy] || 0) + splitAmount
          balances[member] = (balances[member] || 0) - splitAmount
        }
      })
    })

    const transactions = []
    const pos = Object.entries(balances).filter(([,v]) => v > 0).map(([m,v]) => ({ member: m, amount: v }))
    const neg = Object.entries(balances).filter(([,v]) => v < 0).map(([m,v]) => ({ member: m, amount: -v }))
    let i = 0, j = 0
    while (i < pos.length && j < neg.length) {
      const amount = Math.min(pos[i].amount, neg[j].amount)
      transactions.push({ from: neg[j].member, to: pos[i].member, amount: Math.round(amount * 100) / 100 })
      pos[i].amount -= amount
      neg[j].amount -= amount
      if (pos[i].amount < 0.01) i++
      if (neg[j].amount < 0.01) j++
    }

    return {
      balances: Object.entries(balances).map(([member, balance]) => ({ member, balance: Math.round(balance * 100) / 100 })),
      transactions
    }
  }

  return (
    <GroupContext.Provider value={{ groups, createGroup, deleteGroup, acceptGroupInvite, declineGroupInvite, addGroupExpense, deleteGroupExpense, updateGroupExpense, getSettlement, expenses, uid, currentUser, loadGroups }}>
      {children}
    </GroupContext.Provider>
  )
}

export function useGroup() {
  return useContext(GroupContext)
}