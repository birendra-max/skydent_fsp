import React from "react";

import { Routes, Route } from 'react-router-dom';
import Login from '../pages/designer/Login';
import Home from "../pages/designer/Home";
import NewRequest from "../pages/designer/NewRequest";
import AllCases from "../pages/designer/AllCases";
import Progress from "../pages/designer/Progress";
import Cancel from "../pages/designer/Cancel";
import Completed from "../pages/designer/Completed";
import Rush from '../pages/designer/Rush';
import Qc from "../pages/designer/Qc";
import Hold from "../pages/designer/Hold";
import TodayCases from "../pages/designer/TodayCases";
import YesteardayCases from '../pages/designer/YesteardayCases';
import WeeklyCases from '../pages/designer/WeeklyCases';
import Profile from "../pages/designer/Profile";
import MultiSearch from "../pages/designer/MultiSearch";
import Reports from "../pages/designer/Reports";
import RedesignCases from '../pages/designer/RedesignCases';
import { DesignerProvider } from "../Context/DesignerContext";
import OrderDetails from "../pages/designer/OrderDetails";
import SearchOrder from "../pages/designer/SearchOrder";

export default function DesignerRoutes() {
    document.title='Designers Login | Portal'
    return (
        <DesignerProvider>
            <Routes>
                <Route index element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/multisearch" element={<MultiSearch />} />
                <Route path="/reports" element={<Reports />} />
                <Route path='/profile' element={<Profile />} />

                <Route path="/new_request" element={<NewRequest />} />
                <Route path="/new_case" element={<Home />} />
                <Route path="/all_cases" element={<AllCases />} />
                <Route path="/in_progress" element={<Progress />} />
                <Route path="/canceled_case" element={<Cancel />} />
                <Route path="/completed_case" element={<Completed />} />
                <Route path="/rush_cases" element={<Rush />} />
                <Route path="/qc_required" element={<Qc />} />
                <Route path="/case_on_hold" element={<Hold />} />
                <Route path="/yesterday_cases" element={<YesteardayCases />} />
                <Route path="/today_cases" element={<TodayCases />} />
                <Route path="/weekly_case" element={<WeeklyCases />} />
                <Route path="/redesign_cases" element={<RedesignCases />} />
                <Route path="/orderDeatails/:id" element={<OrderDetails />} />
                <Route path='/search-order/:id' element={<SearchOrder />} />
            </Routes>
        </DesignerProvider>
    )
}