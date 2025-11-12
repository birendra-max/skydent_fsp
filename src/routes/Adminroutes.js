import { Routes, Route } from 'react-router-dom';
import Login from "../pages/admin/Login";
import Dashboard from '../pages/admin/Dashboard';
import { AdminProvider } from '../Context/AdminContext';
import AllClients from '../pages/admin/AllClients';
import AddClient from '../pages/admin/AddClient';
import ClientReports from '../pages/admin/ClientResports';
import AllDesigner from '../pages/admin/AllDesigner';
import AddDesigner from '../pages/admin/AddDesigner';
import AllCases from '../pages/admin/AllCases';
import CasesReports from '../pages/admin/CasesReports';
import InitialFile from '../pages/admin/InitialFile';
import FinishedFile from '../pages/admin/FinishedFile';
import StlFile from '../pages/admin/StlFile';
import Profile from '../pages/admin/Profile';
export default function Adminroutes() {
    return (
        <AdminProvider>
            <Routes>
                <Route index element={<Login />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/all-clients' element={<AllClients />} />
                <Route path='/add-client' element={<AddClient />} />
                <Route path='/clients-report' element={<ClientReports />} />
                <Route path='/all-designer' element={<AllDesigner />} />
                <Route path='/add-designer' element={<AddDesigner />} />
                <Route path='/all-cases' element={<AllCases />} />
                <Route path='/cases-reports' element={<CasesReports />} />
                <Route path='/initial-files' element={<InitialFile />} />
                <Route path='/stl-files' element={<StlFile />} />
                <Route path='/finished-files' element={<FinishedFile />} />
                <Route path='/profile' element={<Profile />} />
            </Routes>
        </AdminProvider>
    )
}