export function isStudentSuspended(user) {
  return !!(user && user.role === 'student' && (user.isSuspended || user.status === 'suspended'));
}

export function isInstructorSuspended(user) {
  return !!(user && user.role === 'instructor' && (user.isSuspended || user.status === 'suspended'));
}

export function isStudentRestricted(user, key) {
  if (!key) return false;
  if (!isStudentSuspended(user)) return false;
  const restrictions = user && user.restrictions ? user.restrictions : {};
  return !!restrictions[key];
}

export function isInstructorRestricted(user, key) {
  if (!key) return false;
  if (!isInstructorSuspended(user)) return false;
  const restrictions = user && user.restrictions ? user.restrictions : {};
  return !!restrictions[key];
}
