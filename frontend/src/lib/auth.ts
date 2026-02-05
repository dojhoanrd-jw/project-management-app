import { storage } from './storage';

export interface CurrentUser {
  email: string;
  name: string;
  role: string;
}

export const getCurrentUser = (): CurrentUser | null => {
  return storage.getUser();
};
