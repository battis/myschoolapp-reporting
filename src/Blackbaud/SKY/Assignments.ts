export type Assignment = {
  id: number;
  date: DateTimeString;
  description: HTMLString;
  discussion: boolean;
  due_date: DateTimeString;
  enrolled: number;
  graded_count: number;
  index_id: number;
  major: boolean;
  name: string;
  publish_on_assigned: boolean;
  published: boolean;
  rank: number;
  status: number;
  type: string;
  type_id: number;
};

export type AssignmentList = {
  count: number;
  value: Assignment[];
};
