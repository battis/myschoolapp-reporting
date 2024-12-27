// TODO DataDirect/common/ContentItem/Expectations identical to Syllabus, GradingRubric
export type Expectations = {
  Id: number;
  SectionId: number;
  Description: HTMLString;
  ShortDescription: string;
  ExpireDate: DateTimeString;
  PublishDate: DateTimeString;
  Attachment: string;
};

export type Content = Expectations[];
