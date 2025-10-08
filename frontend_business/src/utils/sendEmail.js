import emailjs from '@emailjs/browser';

/**
 * Send an email using EmailJS
 * @param {string} templateId - The EmailJS template ID
 * @param {object} params - Object with template variables (e.g. to_name, message)
 * @returns {Promise}
 */
export const sendEmail = async (templateId, params) => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const result = await emailjs.send(serviceId, templateId, params, publicKey);
    return result;
  } catch (error) {
    console.error('EmailJS error:', error);
    throw error;
  }
};
