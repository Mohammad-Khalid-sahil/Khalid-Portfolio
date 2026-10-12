import Experience from "../models/Experience.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getExperiences = getAll(Experience, { defaultSort: "-startDate" });
export const getExperience = getOne(Experience);
export const createExperience = createOne(Experience);
export const updateExperience = updateOne(Experience);
export const deleteExperience = deleteOne(Experience);
