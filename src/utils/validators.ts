
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};
