import { Link } from 'react-router-dom';

export default function Foot() {
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-gray-900 text-gray-300 py-4 px-6 flex flex-col md:flex-row justify-between items-center w-full mt-4">
      <div className="text-sm">
        <strong>
          Copyright &copy; 2014-
          <span>{new Date().getFullYear()}</span>{" "}
          <Link to="/user/home" className="text-orange-500 hover:underline">
            Skydent
          </Link>
        </strong>{" "}
        All rights reserved.
      </div>

      <div className="text-sm mt-2 md:mt-0">
        <b className="text-white">Skydent</b>
      </div>
    </footer>
  );
}
