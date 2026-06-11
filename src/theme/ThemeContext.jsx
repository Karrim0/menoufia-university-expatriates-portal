import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { palettes } from "./palettes";

const ThemeContext = createContext(null);

const STORAGE_KEY = "selectedWebsitePalette";

export const ThemeProvider = ({ children }) => {
  const [selectedPalette, setSelectedPalette] = useState(() => {
    const savedPalette = localStorage.getItem(STORAGE_KEY);

    return palettes[savedPalette] ? savedPalette : "palette1";
  });

  useEffect(() => {
    const palette = palettes[selectedPalette];

    if (!palette) return;

    Object.entries(palette.colors).forEach(([variable, value]) => {
      document.documentElement.style.setProperty(variable, value);
    });

    document.documentElement.dataset.palette = selectedPalette;
    localStorage.setItem(STORAGE_KEY, selectedPalette);
  }, [selectedPalette]);

  const changePalette = (paletteId) => {
    if (!palettes[paletteId]) return;

    setSelectedPalette(paletteId);
  };

  const value = useMemo(
    () => ({
      palettes,
      selectedPalette,
      changePalette,
    }),
    [selectedPalette]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};