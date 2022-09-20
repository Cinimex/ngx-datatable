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
    set inputCellTemplate(inputCellTemplate: any);
    set queryCellTemplate(queryCellTemplate: any);
    cellTemplate: TemplateRef<any>;
    set inputHeaderTemplate(inputHeaderTemplate: any);
    set queryHeaderTemplate(queryHeaderTemplate: any);
    headerTemplate: TemplateRef<any>;
    set inputTreeToggleTemplate(inputTreeToggleTemplate: any);
    set queryTreeToggleTemplate(queryTreeToggleTemplate: any);
    treeToggleTemplate: TemplateRef<any>;
    private isFirstChange;
    constructor(columnChangesService: ColumnChangesService);
    ngOnChanges(): void;
}