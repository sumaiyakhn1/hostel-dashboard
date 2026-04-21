import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./component/Landing";
import HostelDashboard from "./component/HostelDashboard";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard/:regNo" element={<HostelDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;

