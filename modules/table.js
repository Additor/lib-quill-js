import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import {
  TableCellContent,
  TableCell,
  TableRow,
  TableBody,
  TableContainer,
  ScrollableTableContainer,
  TableWrapper,
  cellId,
  rowId,
  tableId,
} from '../formats/table';

class Table extends Module {
  static register() {
    Quill.register(TableCellContent);
    Quill.register(TableCell);
    Quill.register(TableRow);
    Quill.register(TableBody);
    Quill.register(TableContainer);
    Quill.register(ScrollableTableContainer);
    Quill.register(TableWrapper);
  }

  constructor(...args) {
    super(...args);
    this.listenBalanceCells();
  }

  balanceTables() {
    this.quill.scroll.descendants(TableContainer).forEach(table => {
      table.balanceCells();
    });
  }

  deleteColumn() {
    const [table, , cell] = this.getTable();
    if (cell == null) return;
    table.deleteColumn(cell.cellOffset());
    this.quill.update(Quill.sources.USER);
  }

  deleteRow() {
    const [, row] = this.getTable();
    if (row == null) return;
    row.remove();
    this.quill.update(Quill.sources.USER);
  }

  deleteTable() {
    const [table] = this.getTable();
    if (table == null) return;
    const offset = table.parent.parent.offset();
    table.remove();
    this.quill.update(Quill.sources.USER);
    this.quill.setSelection(offset, Quill.sources.SILENT);
  }

  getTable(range = this.quill.getSelection()) {
    if (range == null) return [null, null, null, -1];
    const [line, offset] = this.quill.getLine(range.index);
    if (line == null || line.statics.blotName !== TableCellContent.blotName) {
      return [null, null, null, -1];
    }
    const cell = line.parent;
    const row = cell.parent;
    const table = row.parent.parent;
    return [table, row, cell, offset, line];
  }

  insertColumn(offset) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (cell == null) return;
    const column = cell.cellOffset();
    table.insertColumn(column + offset);
    this.quill.update(Quill.sources.USER);
    let shift = row.rowOffset();
    if (offset === 0) {
      shift += 1;
    }
    this.quill.setSelection(
      range.index + shift,
      range.length,
      Quill.sources.SILENT,
    );
  }

  insertColumnLeft() {
    this.insertColumn(0);
  }

  insertColumnRight() {
    this.insertColumn(1);
  }

  insertRow(offset) {
    const range = this.quill.getSelection();
    const [table, row, cell] = this.getTable(range);
    if (cell == null) return;
    const index = row.rowOffset();
    table.insertRow(index + offset);
    this.quill.update(Quill.sources.USER);
    if (offset > 0) {
      this.quill.setSelection(range, Quill.sources.SILENT);
    } else {
      this.quill.setSelection(
        range.index + row.children.length,
        range.length,
        Quill.sources.SILENT,
      );
    }
  }

  insertRowAbove() {
    this.insertRow(0);
  }

  insertRowBelow() {
    this.insertRow(1);
  }

  insertTable(rows, columns) {
    const range = this.quill.getSelection();
    if (range == null) return;
    const tid = tableId();
    // const delta = new Array(rows).fill(0).reduce(memo => {
    //   const text = new Array(columns).fill('\n').join('');
    //   return memo.insert(text, {
    //     table: { 'data-cell': cellId(), 'data-row': rowId(), 'data-table': tid },
    //   });
    // }, new Delta().retain(range.index));

    const delta = new Array(rows).fill(0).reduce(memo => {
      const rid = rowId();
      const innerDelta = new Array(columns).fill(0).reduce(innerMemo => {
        return innerMemo.insert('\n', {
          table: { 'data-cell': cellId(), 'data-row': rid, 'data-table': tid },
        });
      }, new Delta());

      return memo.concat(innerDelta);
    }, new Delta().retain(range.index));

    this.quill.updateContents(delta, Quill.sources.USER);
    this.quill.setSelection(range.index, Quill.sources.SILENT);
    this.balanceTables();
  }

  listenBalanceCells() {
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, mutations => {
      mutations.some(mutation => {
        if (mutation.target.tagName === 'TABLE') {
          this.quill.once(Quill.events.TEXT_CHANGE, (delta, old, source) => {
            if (source !== Quill.sources.USER) return;
            this.balanceTables();
          });
          return true;
        }
        return false;
      });
    });
  }
}

export default Table;
