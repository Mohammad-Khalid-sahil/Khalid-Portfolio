import Skill from "../models/Skill.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

const RELATED_PROJECTS_POPULATE = { path: "relatedProjects", select: "title slug thumbnail category" };

export const getSkills = getAll(Skill, { defaultSort: "category order", populate: RELATED_PROJECTS_POPULATE });
export const getSkill = getOne(Skill, { populate: RELATED_PROJECTS_POPULATE });
export const createSkill = createOne(Skill);
export const updateSkill = updateOne(Skill);
export const deleteSkill = deleteOne(Skill);
