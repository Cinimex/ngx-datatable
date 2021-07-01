import { TemplateRef, OnChanges } from '@angular/core';
import { ColumnChangesService } from '../../services/column-changes.service';
import { TableColumnProp } from '../../types/table-column.type';
export declare class DataTableColumnDirective implements OnChanges {
  private columnChangesService;
  name: string;
  prop: TableColumnProp;
  frozenLeft: any;
  frozenRight: any;
  flexGrow: number;
  resizeable: boolean;
  comparator: any;
  pipe: any;
  sortable: boolean;
  draggable: boolean;
  canAutoResize: boolean;
  minWidth: number;
  width: number;
  maxWidth: number;
  checkboxable: boolean;
  headerCheckboxable: boolean;
  headerClass: string | ((data: any) => string | any);
  cellClass: string | ((data: any) => string | any);
  isTreeColumn: boolean;
  treeLevelIndent: number;
  summaryFunc: (cells: any[]) => any;
  summaryTemplate: TemplateRef<any>;
  _cellTemplateInput: TemplateRef<any>;
  _cellTemplateQuery: TemplateRef<any>;
  get cellTemplate(): TemplateRef<any>;
  _headerTemplateInput: TemplateRef<any>;
  _headerTemplateQuery: TemplateRef<any>;
  get headerTemplate(): TemplateRef<any>;
  _treeToggleTemplateInput: TemplateRef<any>;
  _treeToggleTemplateQuery: TemplateRef<any>;
  get treeToggleTemplate(): TemplateRef<any>;
  private isFirstChange;
  constructor(columnChangesService: ColumnChangesService);
  ngOnChanges(): void;
}
