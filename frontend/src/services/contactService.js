import api from "./api";

/**
 * Submits the contact form to the backend.
 * @param {{ name: string, email: string, subject: string, message: string }} payload
 */
export function sendContactMessage(payload) {
  return api.post("/contact", payload);
}
