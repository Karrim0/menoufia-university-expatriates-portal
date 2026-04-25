import Home from "./HomePage/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import News from "./NewsPage/News";
import AddNews from "./NewsPage/AddNews";
import EditNews from "./NewsPage/EditNews";
import Details from "./NewsDetails/Details";
import ContactUs from "./ContactUsPage/ContactUs";
import Collage from "./Collages/Collages";
import Login from "./LoginPage/Login";
import Header from "./HomePage/Header/Header";
import Footer from "./HomePage/Footer/Footer";
import CollegeAndProgramsPage from "./CollegeAndProgramsPage/CollegeAndProgramsPage";
import SectorsNews from "./SectorsNewsPage/SectorsNews";
import { useTranslation } from "react-i18next";

function App() {
    const { i18n } = useTranslation();

  return (
    <Router>
      <Header index={2} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/add" element={<AddNews />} />
        <Route path="/news/edit/:id" element={<EditNews />} />
        <Route path="/details/:id" element={<Details />} />
        <Route path="/contactUs" element={<ContactUs />} />
        <Route path="/collage" element={<Collage />} />
<Route path="/colleges-programs" element={<CollegeAndProgramsPage />} />        <Route path="/login" element={<Login />} />
        <Route path="/sectors/:sectorName" element={<SectorsNews />} />
      </Routes>
      <Footer />

<ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={i18n.language === "ar"}  
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Router>
  );
}

export default App;