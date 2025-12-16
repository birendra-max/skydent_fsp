import { Routes, Route } from 'react-router-dom';
import Login from '../pages/user/Login';
import Home from "../pages/user/Home";
import NewRequest from '../pages/user/NewRequest';
import MultiSearch from '../pages/user/MultiSearch';
import Reports from '../pages/user/Reports';
import Progress from "../pages/user/Progress";
import Cancel from '../pages/user/Cancel';
import Completed from '../pages/user/Completed';
import Rush from '../pages/user/Rush';
import Hold from '../pages/user/Hold';
import Qc from '../pages/user/Qc';
import AllCases from '../pages/user/AllCases';
import YesteardayCases from '../pages/user/YesteardayCases';
import TodayCases from '../pages/user/TodayCases';
import WeeklyCases from '../pages/user/WeeklyCases';
import Profile from '../pages/user/Profile';
import RedesignCases from '../pages/user/RedesignCases';
import { UserProvider } from "../Context/UserContext";
import SearchOrder from '../pages/user/SearchOrder';

export default function UserRoutes() {
    document.title = 'Clients Login | Portal'
    return (
        <UserProvider>
            <Routes>
                <Route index element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/new_request" element={<NewRequest />} />
                <Route path="/multisearch" element={<MultiSearch />} />
                <Route path="/reports" element={<Reports />} />

                <Route path="/new_case" element={<Home />} />
                <Route path="/in_progress" element={<Progress />} />
                <Route path="/canceled_case" element={<Cancel />} />
                <Route path="/completed_case" element={<Completed />} />
                <Route path="/rush_cases" element={<Rush />} />
                <Route path="/qc_required" element={<Qc />} />
                <Route path="/case_on_hold" element={<Hold />} />
                <Route path="/all_cases" element={<AllCases />} />
                <Route path="/yesterday_cases" element={<YesteardayCases />} />
                <Route path="/today_cases" element={<TodayCases />} />
                <Route path="/weekly_case" element={<WeeklyCases />} />
                <Route path="/redesign_cases" element={<RedesignCases />} />
                <Route path='/search-order/:searchData' element={<SearchOrder />} />
                <Route path='/profile' element={<Profile />} />
            </Routes>
        </UserProvider>
    )
}