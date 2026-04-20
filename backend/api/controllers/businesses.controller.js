import axios from "axios";

export const fetchInstagramPosts = async () => {
  const response = await axios.get(process.env.APIFY_URL);
  return response.data;
};