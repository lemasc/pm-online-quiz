import { GenericExamModel } from "@/types/exam";
import { QuizItem } from "@/types/model";
type Answer = {
  item: string;
  index: number;
  selected: number;
};

export type ExportExamModel = Partial<
  Pick<GenericExamModel, "content" | "name">
>;

export type Result = ExportExamModel & {
  items: (QuizItem & Omit<Answer, "item">)[];
};
