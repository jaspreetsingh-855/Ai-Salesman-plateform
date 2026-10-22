export async function teamSalesmanIds(user) {
  if (user.role === "admin") return null;
  return [user._id];
}

export async function salesmanFilter(user, requestedId) {
  if (user.role === "salesman") {
    return { salesman: user._id };
  }
  if (requestedId) {
    return { salesman: requestedId };
  }
  return {};
}

export function canManage(user, salesmanId) {
  if (user.role === "admin") return true;
  return String(salesmanId) === String(user._id);
}
