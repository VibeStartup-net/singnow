import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Host from './pages/Host';
import Guest from './pages/Guest';
import Join from './pages/Join';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-vinyl-black text-spotlight-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host/:roomId" element={<Host />} />
          <Route path="/guest/:roomId" element={<Guest />} />
          <Route path="/join" element={<Join />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
