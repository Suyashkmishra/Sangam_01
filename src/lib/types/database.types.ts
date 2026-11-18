export type UserRole = "shishya" | "guru" | "admin";
export type GuruStatus = "none" | "pending" | "approved" | "rejected";
export type PostCategory = "poetry" | "music";
export type ContentLanguage = "Hindi" | "English" | "Kannada";
export type MediaType = "video" | "audio" | "none";
export type ConnectionStatus = "pending" | "accepted" | "rejected";
export type PostStatus = "published" | "suspended" | "pending_review";
export type NotificationType =
  | "like"
  | "comment"
  | "connect_request"
  | "connect_accepted"
  | "guru_approved"
  | "guru_rejected"
  | "post_suspended"
  | "post_deleted"
  | "post_resubmitted"
  | "post_approved"
  | "post_rejected";
export type PaymentPlan = "shishya_onetime" | "guru_monthly";
export type PaymentStatus = "paid" | "failed" | "pending";
export type ContactChannel = "whatsapp" | "instagram" | "email";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  bio: string;
  city: string;
  languages: ContentLanguage[];
  avatar_url: string | null;
  guru_status: GuruStatus;
  is_verified: boolean;
  is_suspended?: boolean;
  suspended_at?: string | null;
  created_at: string;
}

export interface ProfileContact {
  user_id: string;
  contact_whatsapp: string | null;
  contact_instagram: string | null;
  contact_email: string | null;
  preferred_channel: ContactChannel;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  category: PostCategory;
  language: ContentLanguage;
  title: string;
  body_text: string | null;
  media_url: string | null;
  media_type: MediaType;
  external_link: string | null;
  status?: PostStatus;
  moderation_reason?: string | null;
  moderated_at?: string | null;
  moderated_by?: string | null;
  created_at: string;
  // joined relations
  author?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked_by_user?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface Connection {
  id: string;
  guru_id: string;
  shishya_id: string;
  post_id: string | null;
  note: string;
  status: ConnectionStatus;
  created_at: string;
  guru?: Profile;
  shishya?: Profile;
  post?: Post;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  connection_id: string | null;
  post_title?: string | null;
  reason?: string | null;
  message?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
  connection?: Connection;
}

export interface AdminAction {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: "post" | "user" | "guru";
  target_id: string;
  target_name?: string | null;
  reason?: string | null;
  created_at: string;
  admin?: Profile;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  plan: PaymentPlan;
  status: PaymentStatus;
  mock: boolean;
  created_at: string;
}

