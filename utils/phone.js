export const formatPhoneNumber = (phone) => {
  if (!phone) return '';

  // remove all spaces and non-digit characters except +
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');

  // if starts with +, assume already in international format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // if starts with 0, replace with +234
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.slice(1);
  }

  // if starts with 234 (no +), add +
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  }

  if (/^\d{10,11}$/.test(cleaned)) {
    return '+234' + cleaned;
  }

  // fallback: assume it's already correct
  return cleaned;
};
