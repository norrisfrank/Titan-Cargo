function isNonEmptyString(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength;
}

function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  email = email.trim();
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,10}$/;
  return re.test(email);
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
};
