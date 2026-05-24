import Home from "./HomePage/Home";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
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
import FacultyNewsPage from "./FacultyNewsPage/FacultyNews";
import UniversityHistory from "./HomePage/UniversityHistory/UniversityHistory";
import FacultyNewsDetails from "./FacultyNewsDetails/FacultyNewsDetails";
import ErrorPage from "./ErrorPage/ErrorPage";
import SplashScreen from "./SplashScreen/SplashScreen";
import IntroVideo from "./IntroVideo/IntroVideo";
import DepartmentPage from "./DepartmentPage/DepartmentPage";
import UniversitySectorsPage from "./UniversitySectorsPage/UniversitySectorsPage";
import { useTranslation } from "react-i18next";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
};

const LayoutFooter = () => {
  const { pathname } = useLocation();

  if (pathname.startsWith("/fac/")) {
    return null;
  }

  return <Footer />;
};

const isPositiveNumber = (value) => {
  return /^[1-9]\d*$/.test(value);
};

const isValidRouteShape = (pathname) => {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  const staticPaths = [
    "/",
    "/news",
    "/news/add",
    "/contactUs",
    "/collage",
    "/colleges-programs",
    "/login",
    "/university-history",
  ];

  if (staticPaths.includes(cleanPath)) {
    return true;
  }

  const parts = cleanPath.split("/").filter(Boolean);

  if (parts[0] === "news" && parts[1] === "edit" && parts.length === 3) {
    return isPositiveNumber(parts[2]);
  }

  if (parts[0] === "details" && parts.length === 2) {
    return isPositiveNumber(parts[1]);
  }

  if (parts[0] === "sectors" && parts.length === 2) {
    return Boolean(parts[1]);
  }
  if (parts[0] === "university-sectors" && parts.length === 2) {
  return Boolean(parts[1]);
}
  if (parts[0] === "fac" && parts.length === 2) {
    return Boolean(parts[1]);
  }
  if (
  parts[0] === "fac" &&
  parts[2] === "department" &&
  parts.length === 4
) {
  return Boolean(parts[1]) && Boolean(parts[3]);
}
  if (parts[0] === "fac" && parts[2] === "details" && parts.length === 4) {
    return Boolean(parts[1]) && isPositiveNumber(parts[3]);
  }

  return false;
};

const AppContent = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  const [showSplash, setShowSplash] = useState(() => {
    return sessionStorage.getItem("hasSeenSplash") !== "true";
  });

  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash") === "true";
    const hasSeenVideo =
      sessionStorage.getItem("hasSeenIntroVideo") === "true";

    if (hasSeenSplash) {
      if (!hasSeenVideo) {
        setShowIntroVideo(true);
      }

      return;
    }

    const timer = setTimeout(() => {
      sessionStorage.setItem("hasSeenSplash", "true");
      setShowSplash(false);

      if (!hasSeenVideo) {
        setShowIntroVideo(true);
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const closeIntroVideo = () => {
    sessionStorage.setItem("hasSeenIntroVideo", "true");
    setShowIntroVideo(false);
  };

  const isErrorPage = !isValidRouteShape(location.pathname);

  return (
    <>
      {showSplash && <SplashScreen />}

      {!showSplash && showIntroVideo && (
        <IntroVideo onClose={closeIntroVideo} />
      )}

      <ScrollToTop />

      <Header index={2} />

      {isErrorPage ? (
        <ErrorPage />
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/add" element={<AddNews />} />
          <Route path="/news/edit/:id" element={<EditNews />} />
          <Route path="/details/:id" element={<Details />} />
          <Route path="/contactUs" element={<ContactUs />} />
          <Route path="/collage" element={<Collage />} />
          <Route
            path="/colleges-programs"
            element={<CollegeAndProgramsPage />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/sectors/:sectorName" element={<SectorsNews />} />
          <Route path="/university-history" element={<UniversityHistory />} />
          <Route path="/fac/:fac" element={<FacultyNewsPage />} />
          
          <Route path="/fac/:fac/details/:id" element={<FacultyNewsDetails />}/>
          <Route
  path="/university-sectors/:keyword"
  element={<UniversitySectorsPage />}
/>
          <Route path="/fac/:fac/department/:departmentCode" element={<DepartmentPage />}
/>
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      )}

      <LayoutFooter />

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
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;