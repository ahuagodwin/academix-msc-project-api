import crypto from 'crypto';


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key';
const IV_LENGTH = 16; // AES requires a 16-byte IV (Initialization Vector)


export const getEnvVariable = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
};


 export const hashedToken = (key: string) => {
    const hmac = crypto.createHash('sha256');
    hmac.update(key);
    return hmac.digest('hex') === key;
 }



// Function to encrypt text using AES-256-CBC
export const encryptData = (data: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random IV
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Return IV + encrypted data
};

// Function to decrypt text using AES-256-CBC
export const decryptData = (encryptedData: string): string => {
  const [iv, encrypted] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
 

 // Array for mapping month numbers to their string representations
export const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];



  // Function to generate initials from departmentName
export const generateInitials = (name: string): string => {
  return name
    .split(" ") // Split by spaces
    .map(word => word[0]?.toUpperCase()) // Get first letter and capitalize
    .join(""); // Join initials together
}
