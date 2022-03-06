import { QuizItem } from "./model";

export enum ExamLevel {
  SECONDARY = "มัธยมศึกษา",
  UPPER_SECONDARY = "มัธยมศึกษาตอนปลาย",
}

export interface BaseExamModel {
  name: string;
  time?: number;
  allowRandom: boolean;
  content?: string;
  items?: Record<string, QuizItem>;
}

export interface SectionModel extends BaseExamModel {
  canShowName: boolean;
}

export interface ExamModel extends BaseExamModel {
  level: keyof typeof ExamLevel;
  subject: string;
}

export type GenericExamModel = ExamModel & SectionModel;

export type ExamAPIItem = Pick<ExamModel, "level" | "subject" | "time"> & {
  id: string;
  status: "READY" | "ON_PROGRESS" | "SUBMITTED";
  count: number;
  names: string[];
};

export type SubmissionAPIItem = Omit<ExamSubmission, "answers" | "hash"> &
  ExamAPIItem;

export type ExamListModel = {
  exam: ExamAPIItem[];
  submission: Record<string, SubmissionAPIItem>;
};

export type ExamSessionData = {
  hash: Record<string, string>;
  startTime: number;
  endTime?: number;
};

export type ExamStartPayload = {
  data: string[];
  content?: string[];
  answers?: Record<string, number>;
};

export type ExamContentPayload = {
  content: string;
  id: string;
};

type SavedAnswer = {
  selected: number;
  index: number;
};

export type ExamSubmitBody = {
  answers: Record<string, SavedAnswer>;
};

export type ExamSubmission = {
  score: number;
  total: number;
  hash: ExamSessionData["hash"];
  answers: ExamSubmitBody["answers"];
  startTime: Date;
  submittedTime: Date;
};