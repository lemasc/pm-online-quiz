export type QuizItem = {
  content: string;
  selected: number;
};

export type QuizModel = {
  content?: string;
  items: Record<number, QuizItem>;
};
