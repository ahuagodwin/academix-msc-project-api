
import mongoose from "mongoose"

/**
 * Validates a MongoDB ObjectId.
 * @param {string} id - The MongoDB ObjectId to validate.
 * @throws {Error} If the id is not a valid MongoDB ObjectId.
 */

// export const validateMongoDbId = (id: string) => {
//     const isValid = mongoose.Types.ObjectId.isValid(id);
//     if(!isValid) throw new Error(`Such Id does not exist`)
// }



export const validateMongoDbId = (id: string): void => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Such Id does not exist");
    }
  };