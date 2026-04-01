import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PersonalProvider } from './context/PersonalContext'
import { GroupProvider } from './context/GroupContext'
import { MultiAccessProvider } from './context/MultiAccessContext'

import Landing from './pages/auth/Landing'
import SignUp from './pages/auth/SignUp'
import Login from './pages/auth/Login'
import Dashboard from './pages/Dashboard'
import PersonalDashboard from './pages/personal/PersonalDashboard'
import BudgetSetup from './pages/personal/BudgetSetup'
import ExpenseEntry from './pages/personal/ExpenseEntry'
import MonthlySummary from './pages/personal/MonthlySummary'
import GroupDashboard from './pages/group/GroupDashboard'
import CreateGroup from './pages/group/CreateGroup'
import GroupExpenseEntry from './pages/group/GroupExpenseEntry'
import SettlementView from './pages/group/SettlementView'
import AccountDashboard from './pages/multiAccess/AccountDashboard'
import CreateAccount from './pages/multiAccess/CreateAccount'
import AccountDetail from './pages/multiAccess/AccountDetail'
import SettlementCalc from './pages/multiAccess/SettlementCalc'
import MonthEndSummary from './pages/monthEnd/MonthEndSummary'

function App() {
  return (
    <BrowserRouter>
      <PersonalProvider>
        <GroupProvider>
          <MultiAccessProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/personal" element={<PersonalDashboard />} />
              <Route path="/personal/budget" element={<BudgetSetup />} />
              <Route path="/personal/expenses" element={<ExpenseEntry />} />
              <Route path="/personal/summary" element={<MonthlySummary />} />
              <Route path="/group" element={<GroupDashboard />} />
              <Route path="/group/create" element={<CreateGroup />} />
              <Route path="/group/:id/expenses" element={<GroupExpenseEntry />} />
              <Route path="/group/:id/settlement" element={<SettlementView />} />
              <Route path="/multiaccess" element={<AccountDashboard />} />
              <Route path="/multiaccess/create" element={<CreateAccount />} />
              <Route path="/multiaccess/:id" element={<AccountDetail />} />
              <Route path="/multiaccess/:id/settlement" element={<SettlementCalc />} />
              <Route path="/monthend" element={<MonthEndSummary />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </MultiAccessProvider>
        </GroupProvider>
      </PersonalProvider>
    </BrowserRouter>
  )
}

export default App