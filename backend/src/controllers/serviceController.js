import Service from "../models/Service.js";
import { getAll, getOne, createOne, updateOne, deleteOne } from "../utils/handlerFactory.js";

export const getServices = getAll(Service);
export const getService = getOne(Service);
export const createService = createOne(Service);
export const updateService = updateOne(Service);
export const deleteService = deleteOne(Service);
