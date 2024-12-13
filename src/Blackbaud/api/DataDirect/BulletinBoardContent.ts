export type BulletinBoardContent = {
  ContentId: number;
  RowIndex: number;
  ColumnIndex: number;
  CellIndex: 2;
  GenericSettings: any; // TODO DataDirect/BulletinBoardContent.GenericSettings type
  PendingInd: boolean;
};
