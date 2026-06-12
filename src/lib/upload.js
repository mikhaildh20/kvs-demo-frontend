import fetchData from "./fetch";

const uploadFile = async (file, folder) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetchData("uploads/file", formData, "POST", true);

    if (response.error) {
        throw new Error(response.message || "File upload failed");
    }

    return response;
}

export default uploadFile;