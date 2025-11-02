export enum UserRole {
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
