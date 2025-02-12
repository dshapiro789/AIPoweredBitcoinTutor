import {
  type User,
  type Subject,
  type ChatSession,
  type Progress,
  type InsertUser,
  type InsertSubject,
  type InsertChatSession,
  type InsertProgress,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSubjects(): Promise<Subject[]>;
  getChatSessions(userId: number): Promise<ChatSession[]>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, messages: { role: string; content: string }[]): Promise<void>;
  getProgress(userId: number): Promise<Progress[]>;
  updateProgress(progress: InsertProgress): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subjects: Map<number, Subject>;
  private chatSessions: Map<number, ChatSession>;
  private progress: Map<number, Progress>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.chatSessions = new Map();
    this.progress = new Map();
    this.currentId = 1;
    this.initializeSubjects();
  }

  private initializeSubjects() {
    const defaultSubjects: InsertSubject[] = [
      { name: "Python Programming", category: "Coding", description: "Learn Python programming from basics to advanced concepts" },
      { name: "Web Development", category: "Coding", description: "Master HTML, CSS, and JavaScript" },
      { name: "Calculus", category: "Math", description: "Understanding derivatives, integrals, and their applications" },
      { name: "Physics", category: "Science", description: "Explore mechanics, electricity, and modern physics" },
      { name: "Spanish", category: "Languages", description: "Learn Spanish conversation and grammar" },
    ];

    defaultSubjects.forEach((subject) => {
      const id = this.currentId++;
      this.subjects.set(id, { ...subject, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSubjects(): Promise<Subject[]> {
    return Array.from(this.subjects.values());
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return Array.from(this.chatSessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const id = this.currentId++;
    const chatSession = { ...session, id };
    this.chatSessions.set(id, chatSession);
    return chatSession;
  }

  async updateChatSession(id: number, messages: { role: string; content: string }[]): Promise<void> {
    const session = this.chatSessions.get(id);
    if (session) {
      this.chatSessions.set(id, { ...session, messages });
    }
  }

  async getProgress(userId: number): Promise<Progress[]> {
    return Array.from(this.progress.values()).filter(
      (p) => p.userId === userId,
    );
  }

  async updateProgress(insertProgress: InsertProgress): Promise<void> {
    const id = this.currentId++;
    this.progress.set(id, { ...insertProgress, id });
  }
}

export const storage = new MemStorage();
