type DropDownItem = {
  Value: number;
  Display: string;
};
type DropDownList = { DropDownList: DropDownItem[] };

type Column = {
  DatabaseColumn: string;
  PropertyName?: string;
  DataType?: number;
  Selected: boolean;
  Required?: boolean;
  CanDisplay?: boolean;
  ColumnOrder?: number;
  Width?: number;
  CategoryId?: number;
  IsSearchDisabled?: boolean;
  SeeMoreText?: boolean;
  Checksum?: string;
  DisplayName?: string;
  Description?: string;
  SortOrder?: number;
  OrderColumnAdded: number;
  SortColumn?: string;
  AdditionalDatabaseColumns?: string[];
  DisplayFormat?: number;
  DisplayLink?: boolean;
  AdditionalDatabaseColumn?: string;
  DropDown?: DropDownList;
};

type Action = {
  DisplayName: string;
  Css: string;
  ContextProperty: string;
  VisibilityColumn: string;
};

type FilterValue = {
  Description: string;
  Key: number;
  Selected: boolean;
};

type Filter = {
  Column: Column;
  Values: FilterValue[];
  Category: string;
  FilterType: number;
  UserDefinedId: number;
  Selected: boolean;
  SelectedOption: number;
  HasChildFilters: boolean;
  SelectedValues: any[]; // TODO Assignent2/AssignmentCenterCourseListGet/Payload.Filter.SelectedValues type
  FilterClass: string;
  ServiceFilterClass: string;
  FilterLabel: string;
  UseViewerId: boolean;
  FilterAlwaysSelected: boolean;
  DoNotClear: boolean;
};

export type Payload = {
  UseReadOnlyDb: boolean;
  UseLiveDBOverride: boolean;
  IsSmallCollege: boolean;
  IsOneRoster: boolean;
  Columns: Column[];
  Actions: Action[];
  SortColumn: string;
  SortDesc: boolean;
  PageSize: number;
  CurrentPage: number;
  TotalCount: number;
  PageOnClient: boolean;
  Filters: Filter[];
  Categories: any[]; // TODO Assignent2/AssignmentCenterCourseListGet/Payload.Payload.Categories type
  AlwaysSearchServer: boolean;
  Name: string;
  Id: number;
  ListType: number;
};
