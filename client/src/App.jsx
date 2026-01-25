import React from "react";
import './index.css';
import { Link, Route, Routes } from "react-router-dom";
import Finance from './finance';
import Home from './Home';

function App() {
    return (
        <>
            <header>
                <h1 className='hdr'>
                    BoonSunClon IS ALIVE!
                </h1>
            </header>
            <nav>
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/finance">Finance</Link>
                    </li>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/finance" element={<Finance />} />
            </Routes>
        </>
    )
}

export default App;