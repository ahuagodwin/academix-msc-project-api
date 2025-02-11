import axios from "axios";


export const getLocationFromIp = async (ip?: string): Promise<string> => {
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`);
      if (response.data && response.data.status === 'fail') {
        return "Location not available";
      }
      const { city, regionName, country } = response.data;
      return `${city}, ${regionName}, ${country}`;
    } catch (error) {
      console.error("Failed to fetch location:", error);
      return "Location not available";
    }
  };


  // Get the public IP address if local IP is detected
export const getPublicIp = async (): Promise<string> => {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (error) {
    console.error("Failed to fetch public IP:", error);
    return "Unknown";
  }
};