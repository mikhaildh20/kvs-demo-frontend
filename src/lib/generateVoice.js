import fetchData from "./fetch";

const generateVoice = async(text, folder)=> {
    const response = await fetchData("voice/generate",{ text, folder }, "POST");

    if(response.error){
        throw new Error(
            response.message || "Voice generation failed"
        );
    }

    return response;
};

export default generateVoice;