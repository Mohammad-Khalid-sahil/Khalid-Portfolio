import api from "./api";

async function uploadFile(file, usedIn, uploadTarget) {
  const preparation = await api.post("/uploads/sign", {
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    usedIn,
    uploadTarget,
  });
  const authorization = preparation.data;

  if (authorization.mode === "multipart") {
    const formData = new FormData();
    formData.append("usedIn", usedIn);
    formData.append("file", file);
    const endpoint = uploadTarget === "media" ? "/media" : "/projects/upload";
    return api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
  }

  if (authorization.mode !== "direct") throw new Error("The storage service did not authorize this upload.");

  let response;
  if (authorization.method === "POST") {
    const formData = new FormData();
    Object.entries(authorization.fields).forEach(([name, value]) => formData.append(name, value));
    formData.append("file", file);
    response = await fetch(authorization.uploadUrl, { method: "POST", body: formData });
  } else if (authorization.method === "PUT") {
    response = await fetch(authorization.uploadUrl, {
      method: "PUT",
      headers: authorization.headers,
      body: file,
    });
  } else {
    throw new Error("The storage service returned an unsupported upload method.");
  }

  if (!response.ok) throw new Error("File upload failed. Check storage CORS settings and try again.");
  const completion = { uploadToken: authorization.uploadToken };
  if (authorization.provider === "cloudinary") {
    try {
      completion.cloudinaryResult = await response.json();
    } catch {
      throw new Error("The media provider returned an invalid upload response.");
    }
  }
  return api.post("/uploads/complete", completion);
}

/**
 * Uploads a single image (project thumbnail or gallery item) and returns
 * the public URL to store on the project document.
 */
export async function uploadProjectImage(file, usedIn = "other") {
  const result = await uploadFile(file, usedIn, "project");
  if (result.data?._id) return { url: result.data.url, mediaId: result.data._id };
  return result.data;
}

export { uploadFile };
