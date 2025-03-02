import { v2 as cloudinary } from "cloudinary";
import { configDotenv } from "dotenv";
import fs from "fs/promises";
import "path";
import path from "path";

const IMAGE_DATA = path.join(process.cwd(), "data/images.yml");

const upload = async (filePath) => {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const publicId = filePath.replace(/(^.*[\\/])(.+)(\..*)/, "$2");

  // Upload an image
  const uploadResult = await cloudinary.uploader
    .upload(filePath, {
      public_id: publicId,
    })
    .catch((error) => {
      console.log(error);
      process.exitCode = 1;
      throw error;
    });

  console.log(uploadResult);

  // Optimize delivery by resizing and applying auto-format and auto-quality
  const optimizeUrl = cloudinary.url(publicId, {
    fetch_format: "auto",
    quality: "auto",
  });

  return { publicId, optimizeUrl };
};

configDotenv();

const imagesDir = path.join(process.cwd(), "images");
const images = await fs.readdir(imagesDir);

for (const image of images) {
  if (image === "processed") {
    continue;
  }

  const imageLoc = path.join(imagesDir, image);
  const res = await upload(imageLoc);

  const data = await fs.readFile(IMAGE_DATA, "utf-8");

  if (data.includes(res.publicId)) {
    const re = new RegExp(`/$${res.publicId}:.*/gm`);
    const newData = data.replace(re, `${res.publicId}: ${res.optimizeUrl}`);
    await fs.writeFile(IMAGE_DATA, newData, "utf-8");
  } else {
    await fs.appendFile(
      IMAGE_DATA,
      `\n${res.publicId}: ${res.optimizeUrl}`,
      "utf-8",
    );
  }
  const newLoc = imageLoc.replace("/static/images/", "/processed_images/");
  await fs.rename(imageLoc, newLoc);
}
