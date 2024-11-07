export type BulletinBoardContent = {
  ContentId: number;
  RowIndex: number;
  ColumnIndex: number;
  CellIndex: 2;
  GenericSettings: any; // FIXME type
  PendingInd: boolean;
};
