import { Routes, Route } from 'react-router-dom';
import Login from "../pages/admin/Login";
import Dashboard from '../pages/admin/Dashboard';
import NewRequest from '../pages/admin/NewRequest';
import MultiSerch from '../pages/admin/MultiSerch';
import CasesReports from '../pages/admin/CasesReports';
import { AdminProvider } from '../Context/AdminContext';
import ResetPsswordClient from '../pages/admin/ResetPsswordClient';
import AddClient from '../pages/admin/AddClient';
import ResetPasswordDesigner from '../pages/admin/ResetPasswordDesigner';
import AddDesigner from '../pages/admin/AddDesigner';
import AllCases from '../pages/admin/AllCases';
import InitialFile from '../pages/admin/InitialFile';
import FinishedFile from '../pages/admin/FinishedFile';
import StlFile from '../pages/admin/StlFile';
import Profile from '../pages/admin/Profile';
import AddAdmin from '../pages/admin/AddAdmin';
import ResetPasswordAdmin from '../pages/admin/ResetPasswordAdmin';
import CompletedCases from '../pages/admin/CompletedCases';
import QcCases from '../pages/admin/QcCases';
import RushCases from '../pages/admin/RushCases';
import CancelledCases from '../pages/admin/CancelledCases';
import PendingCases from '../pages/admin/PendingCases';
import RedesignCases from '../pages/admin/RedesignCases';
import YesteardayCases from '../pages/admin/YesteardayCases';
import TodayCases from '../pages/admin/TodayCases';
import NewCases from '../pages/admin/NewCases';
import HoldCases from '../pages/admin/HoldCases';
import WeeklyCases from '../pages/admin/WeeklyCases';
import AllClients from '../pages/admin/AllClients';
import AllDesigners from '../pages/admin/AllDesigner';
import AssignOrders from '../pages/admin/AssignOrders';
import OrderDetails from '../pages/admin/OrderDetails';
export default function Adminroutes() {

    document.title = 'Admin Login | Portal';

    return (
        <AdminProvider>
            <Routes>
                <Route index element={<Login />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/new_request' element={<NewRequest />} />
                <Route path='/multisearch' element={<MultiSerch />} />
                <Route path='/cases-reports' element={<CasesReports />} />

                <Route path='/assign-orders' element={<AssignOrders />} />

                <Route path='/all-cases' element={<AllCases />} />
                <Route path='/new-cases' element={<NewCases />} />
                <Route path='/initial-files' element={<InitialFile />} />
                <Route path='/stl-files' element={<StlFile />} />
                <Route path='/finished-files' element={<FinishedFile />} />
                <Route path='/completed-cases' element={<CompletedCases />} />
                <Route path='/qc-cases' element={<QcCases />} />
                <Route path='/hold-cases' element={<HoldCases />} />
                <Route path='/rush-cases' element={<RushCases />} />
                <Route path='/cancelled-cases' element={<CancelledCases />} />
                <Route path='/pending-cases' element={<PendingCases />} />
                <Route path='/redesign-cases' element={<RedesignCases />} />
                <Route path='/yesterday-cases' element={<YesteardayCases />} />
                <Route path='/today-cases' element={<TodayCases />} />
                <Route path='/weekly-cases' element={<WeeklyCases />} />

                <Route path='/all-clients/:id' element={<AllClients />} />
                <Route path='/all-designers/:id' element={<AllDesigners />} />
                <Route path='/add-admin' element={<AddAdmin />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/add-client' element={<AddClient />} />
                <Route path='/add-designer' element={<AddDesigner />} />
                <Route path='/reset-password-admin' element={<ResetPasswordAdmin />} />
                <Route path='/reset-password-client' element={<ResetPsswordClient />} />
                <Route path='/reset-password-designer' element={<ResetPasswordDesigner />} />
                <Route path="/orderDeatails/:id" element={<OrderDetails />} />
            </Routes>
        </AdminProvider>
    )
}