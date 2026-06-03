import { IUser } from '../types';
import { isAdminUser } from './admin';

export function serializeUser(user: IUser) {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    isAdmin: isAdminUser(user),
    preferences: user.preferences,
    subscription: user.subscription,
    usage: user.usage,
    createdAt: user.createdAt,
  };
}
