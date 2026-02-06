import fs from "fs";
import { getError } from "../middleware/handleError";

export const deleteFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) getError(err);
  });
};
