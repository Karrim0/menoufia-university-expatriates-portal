const BASE_IMAGE_URL = "https://mu.menofia.edu.eg/uploads/";

export const getImageUrl = (img) => {
  if (!img) return "";

  // لو لينك كامل
  if (img.startsWith("http")) {
    return img;
  }

  // لو filename
  return BASE_IMAGE_URL + img;
};