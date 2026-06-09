export type Vision = {
  title: string;
  content: string;
  imageUrl: string;
};

export type Mission = {
  title: string;
  content: string;
  imageUrl: string;
};

export type Collaborator = {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
};

export type CommentItem = {
  id: string;
  author: string;
  text: string;
  visible: boolean;
};

export type InformationalPage = {
  vision: Vision;
  mission: Mission;
  collaborators: Collaborator[];
  comments: CommentItem[];
};
