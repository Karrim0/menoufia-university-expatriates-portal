import "./SplashScreen.css";
import splashLogo from "../assets/menoufia-splash.png";

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <img
          src={splashLogo}
          alt="Menoufia University Logo"
          className="splash-logo"
        />

        <h1 className="splash-title-ar">جامعة المنوفية</h1>

        <h2 className="splash-title-en">Menoufia University</h2>

        <p className="splash-subtitle">منارة المعرفة في قلب الدلتا</p>
      </div>
    </div>
  );
}