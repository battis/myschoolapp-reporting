import { DateTimeString, HTMLString } from '@battis/descriptive-types';

export type Item = {
  assignment_id: number;
  assignment_index_id: number;
  date_assignedTicks: number;
  date_assigned: DateTimeString;
  date_dueTicks: number;
  date_due: DateTimeString;
  publish_ind: boolean;
  publish_on_assigned_ind: boolean;
  marking_period_id: number;
  title_no_html: string;
  assignment_title: HTMLString;
  inc_grade_book: boolean;
  abbr_description: string;
  max_points: number;
  factor: number;
  extra_credit: boolean;
  inc_cum_grade: boolean;
  publish_grade: boolean;
  on_paper_sub: boolean;
  drop_box_ind: boolean;
  assignment_type: string;
  major: boolean;
  assessment_id: number;
  assignment_type_id: number;
  discussion_ind: boolean;
  assessment_ind: boolean;
  brief: HTMLString;
  detail: HTMLString;
  formative_ind: boolean;
  new_assessment_ind: boolean;
};

export type Response = Item[];
