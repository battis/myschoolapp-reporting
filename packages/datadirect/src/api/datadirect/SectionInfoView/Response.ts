import {
  DateString,
  NumericBoolean,
  NumericTimestamp
} from '@battis/descriptive-types';

export type Item = {
  AssociationId: number;
  Block: string;
  CourseTopic: string | null;
  Current: NumericBoolean;
  Description: string;
  Duration: string;
  DurationId: number;
  EndDate: DateString;
  EndDateTicks: NumericTimestamp;
  GroupName: string;
  Id: number;
  Identifier: string;
  IsManager: NumericBoolean;
  IsOwner: NumericBoolean;
  LayoutId: number;
  LeadSectionId: number;
  Length: number;
  Level: string;
  LevelNum: number;
  OfferingId: number;
  PendingLayoutId: number | null;
  Room: string;
  SchoolYear: string;
  StartDate: DateString;
  StartDateTicks: NumericTimestamp;
  Teacher: string;
  TeacherId: number;
  building_id: number | null;
};

export type Response = Item[];
