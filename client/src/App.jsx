

import Home from "./page/home";

import { BrowserRouter, Routes, Route , Navigate} from "react-router-dom";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/about" element={<About />} /> */}
        {/* <Route path="/blog" element={<Blog />} /> */}
        {/* <Route path="*" element={<Notfound/>} /> */}
        {/* <Route path="/home" element={<Navigate to="/" />} /> */}
        {/* <Route path="/info" element={<Navigate to="/about" />} /> */}
        {/* <Route path="/blog/:id" element={<Details />} /> */}
      </Routes>
      </BrowserRouter>
  );
}

export default App;
