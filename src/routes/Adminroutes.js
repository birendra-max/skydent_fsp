import { Routes, Route } from 'react-router-dom';
import Login from "../pages/admin/Login";
import Dashboard from '../pages/admin/Dashboard';
import { AdminProvider } from '../Context/AdminContext';
import ResetPsswordClient from '../pages/admin/ResetPsswordClient';
import AddClient from '../pages/admin/AddClient';
import ClientReports from '../pages/admin/ClientResports';
import ResetPasswordDesigner from '../pages/admin/ResetPasswordDesigner';
import AddDesigner from '../pages/admin/AddDesigner';
import AllCases from '../pages/admin/AllCases';
import CasesReports from '../pages/admin/CasesReports';
import InitialFile from '../pages/admin/InitialFile';
import FinishedFile from '../pages/admin/FinishedFile';
import StlFile from '../pages/admin/StlFile';
import Profile from '../pages/admin/Profile';
import DesignerReports from '../pages/admin/DesignerReports';
export default function Adminroutes() {
    return (
        <AdminProvider>
            <Routes>
                <Route index element={<Login />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/reset-password' element={<ResetPsswordClient />} />
                <Route path='/add-client' element={<AddClient />} />
                <Route path='/clients-reports' element={<ClientReports />} />
                <Route path='/designer-reports' element={<DesignerReports />} />
                <Route path='/reset-password-designer' element={<ResetPasswordDesigner />} />
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