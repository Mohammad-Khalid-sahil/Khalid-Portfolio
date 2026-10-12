import Certification from "../models/Certification.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getCertifications = getAll(Certification, { defaultSort: "-date" });
export const getCertification = getOne(Certification);
export const createCertification = createOne(Certification);
export const updateCertification = updateOne(Certification);
export const deleteCertification = deleteOne(Certification);
