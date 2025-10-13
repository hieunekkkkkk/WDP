// utils/cloudinaryUpload.js
export const uploadToCloudinary = async (files) => {
  const fileArray = Array.isArray(files) ? files : [files];
  const uploadedUrls = [];

  for (const file of fileArray) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      if (!res.ok) throw new Error(`Upload thất bại (${res.status})`);

      const data = await res.json();
      uploadedUrls.push(data.secure_url);
    } catch (err) {
      console.error(" Lỗi upload Cloudinary:", err);
      throw err;
    }
  }

  return uploadedUrls;
};
