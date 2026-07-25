import './App.css'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Navbar from "./components/Navbar.tsx"
import Auth from "./Pages/Auth.tsx"
import Dashboard from "./Pages/Dashboard.tsx"
import Insights from "./Pages/Insights.tsx"
import SaveMore from "./Pages/SaveMore.tsx"
import Automation from "./Pages/Automation.tsx"

function AppShell() {
  const location = useLocation()
  const hideNavbar = location.pathname === '/auth'

  return (
    <div className='app-container'>
      {!hideNavbar && <Navbar />}
      <Routes>
          <Route path='/' element={<Dashboard/>}/>
          <Route path='/insights' element={<Insights/>}/>
          <Route path='/save-more' element={<SaveMore/>}/>
          <Route path='/automation' element={<Automation/>}/>
          <Route path='/auth' element={<Auth/>}/>
      </Routes>
    </div>
  )
}

function App() {
  return (
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
  )
}

export default App
