import { Types } from "mongoose";

export interface IUser {
  name: string;
  username: string;
  email: string;
  password: string;
  status: UserStatus;
  lastSeen: Date;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  password: string;
  status: UserStatus;
  lastSeen: Date;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  status: UserStatus;
  lastSeen: Date;
  profilePicture?: string;
}

export enum UserStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  AWAY = "away",
  DO_NOT_DISTURB = "do_not_disturb",
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserDTO {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  profilePicture?: string;
  status?: UserStatus;
}

// export interface User {
//   _id: Types.ObjectId;
//   username: string;
//   password: string;
//   status: 'online' | 'offline';
//   lastSeen?: Date;

// }
