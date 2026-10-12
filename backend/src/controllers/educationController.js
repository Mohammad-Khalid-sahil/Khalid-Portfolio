import Education from "../models/Education.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getEducationList = getAll(Education, { defaultSort: "-startDate" });
export const getEducation = getOne(Education);
export const createEducation = createOne(Education);
export const updateEducation = updateOne(Education);
export const deleteEducation = deleteOne(Education);
