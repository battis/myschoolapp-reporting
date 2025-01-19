import {
  DateString,
  DateTimeString,
  HTMLString,
  NumericString,
  TimeString,
  URLString
} from '@battis/descriptive-types';

type Lti = {
  ProviderId: NumericString;
  'provider-id': NumericString;
  ToolId: number | NumericString;
  fileSubmissionInd: number;
};

type MarkingPeriod = {
  MarkingPeriodId: number;
  MarkingPeriodDescription: string;
  /** j/n/Y g:i A */
  BeginDate: DateTimeString;
  /** j/n/Y g:i A */
  EndDate: DateTimeString;
  SectionId: number;
};

type SectionLink = {
  selected: boolean;
  hasGrades: boolean | null;
  HasEvaluation: boolean | null;
  hasAssessmentResults: null;
  SectionName: string;
  AssignmentId: number | null;
  AssignmentIndexId: number | null;
  SectionId: number;
  OfferingId: number;
  /** m/d/Y */
  AssignmentDate: DateString;
  /** G:i:s */
  AssignmentTime: TimeString;
  /** c */
  dateDue: DateTimeString;
  /** m/d/Y */
  DueDate: DateString;
  /** G:i:s */
  DueTime: TimeString;
  PublishInd: boolean;
  PublishOnAssignedInd: boolean;
  publishStatus: NumericString;
  defaultPublishStatus: NumericString;
  /** G:i:s */
  defaultTime: TimeString;
  /** G:i:s */
  defaultDueTime: TimeString;
  markingPeriods: MarkingPeriod[];
  notification: boolean;
  incGradebook: boolean;
  markingPeriodId: number;
  DropBoxSubmitted: boolean | null;
  PartialInd: boolean | null;
  PartialCount: number | null;
  UsersList: [];
};

type LinkItem = {
  ShortDescription: string;
  urlDescription: URLString;
  Url: URLString;
  Delete: boolean;
};

type AssignmentUser = {
  selected: boolean;
  StudentUserId: number;
  SectionId: number;
  Firstname: string | null;
  Lastname: string | null;
  GradYear: NumericString;
  FullName: string;
  LockedInd: boolean;
};

export type Payload = {
  LongDescription: HTMLString;
  SendNotification: boolean;
  ShortDescription: HTMLString;
  AssignmentTypeId: number;
  PublishGrade: boolean;
  IncCumGrade: boolean;
  ExtraCredit: boolean;
  /** max length 9 */
  AbbrDescription: string;
  'max-points': number;
  MaxPoints: number;
  Factor: number | NumericString;
  RubricId: number;
  EvaluationMethod: number;
  AssignmentSkills: [];
  AssignmentCourses: [];
  'inc-rubric': boolean;
  IncRubric: boolean;
  gradebook_ind: boolean;
  IncGradebook: boolean;
  Lti: Lti[];
  'inc-gradebook-lti': boolean;
  OnPaperSubmission: boolean | { value: boolean };
  DropboxInd: boolean | { value: boolean };
  'assignment-instance': boolean | { value: boolean };
  RecurrenceNum: null;
  'recurrence-list': [];
  /** h:i:s A */
  DropboxTimeLate: TimeString;
  SectionLinks: SectionLink[];
  AssignmentUsers: AssignmentUser[];
  notifBodyControl_ShortDescription: HTMLString;
  notifBodyControl_LongDescription: HTMLString;
  DownloadItems: [];
  LinkItems: LinkItem[];
  Notifications: number[];
};
