import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import _ from 'lodash';
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
    this.listenTableFocus();
    this.listenSelectionChange();

    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('touchstart', this.handleMouseDown.bind(this));
    window.addEventListener('keydown', this.handleKeyDownFakeCursor.bind(this));
    window.addEventListener('resize', _.throttle(() => this.fitTables(), 50));
  }

  handleMouseDown() {
    const oldFakeCursor = document.getElementById('table-fake-cursor');
    if (oldFakeCursor) oldFakeCursor.remove();
  }

  handleKeyDownFakeCursor(ev) {
    if (!this.tableFocusData) return;
    const { cursorOffset, blot } = this.tableFocusData;
    const tableIndex = this.quill.getIndex(blot);
    const tableLastIndex = tableIndex + blot.length();
    const quillLength = this.quill.getLength();

    let prevented = false;
    switch (ev.keyCode) {
      case 37: // arrow left
        if (cursorOffset === 0) {
          if (tableIndex > 0) {
            this.quill.setSelection(tableIndex - 1, 0, Quill.sources.USER);
          }
        } else {
          this.quill.setSelection(tableLastIndex - 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 38: // arrow up
        if (tableIndex > 0) {
          this.quill.setSelection(tableIndex - 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 39: // arrow right
        if (cursorOffset === 0) {
          this.quill.setSelection(tableIndex, 0, Quill.sources.USER);
        } else if (tableLastIndex < quillLength) {
          this.quill.setSelection(tableIndex + blot.length(), 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 40: // arrow down
        if (tableLastIndex < quillLength) {
          this.quill.setSelection(tableIndex + blot.length(), 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 13: // enter
        if (cursorOffset === 0) {
          const delta = new Delta().retain(tableIndex).insert('\n');
          this.quill.updateContents(delta, 'user');
          const [line] = this.quill.getLine(tableIndex);
          if (line) {
            const newTableWrapper = line.next;
            newTableWrapper.showFakeCursor();
          }
        } else {
          const delta = new Delta().retain(tableLastIndex).insert('\n');
          this.quill.updateContents(delta, 'user');
          this.quill.setSelection(tableLastIndex, 'user');
        }
        prevented = true;
        break;
      case 8: // backspace
        if (cursorOffset === 0) {
          if (tableIndex > 0) {
            const [line] = this.quill.getLine(tableIndex - 1);
            if (line.length() <= 1) {
              line.remove();
              const [cellContent] = this.quill.getLine(tableIndex - 1);
              if (cellContent) {
                const newTableWrapper = cellContent.tableWrapper();
                newTableWrapper.showFakeCursor();
              }
            } else {
              this.quill.setSelection(tableIndex - 1, 0, Quill.sources.USER);
            }
          }
        } else {
          blot.remove();
          this.quill.update(Quill.sources.USER);
          this.quill.setSelection(tableIndex, Quill.sources.SILENT);
        }
        prevented = true;
        break;
      default:
    }

    if (!prevented && !ev.metaKey && !ev.ctrlKey) {
      if (ev.key.length === 1 && cursorOffset === 0) {
        const delta = new Delta().retain(tableIndex).insert('\n');
        this.quill.updateContents(delta, 'user');
        this.quill.setSelection(tableIndex, Quill.sources.USER);
      } else if (ev.key.length === 1) {
        const delta = new Delta().retain(tableLastIndex).insert('\n');
        this.quill.updateContents(delta, 'user');
        this.quill.setSelection(tableLastIndex, Quill.sources.USER);
      } else {
        prevented = true;
      }
    }

    if (prevented) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  balanceTables() {
    this.quill.scroll.descendants(TableContainer).forEach(table => {
      table.balanceCells();
    });
  }

  fitTables() {
    this.quill.scroll.descendants(TableContainer).forEach(table => {
      table.fitCells();
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
    const [cellContent] = this.quill.getLine(range.index);
    const tableWrapper = cellContent.tableWrapper();
    // table 다음 라인 제거
    if (
      tableWrapper.next &&
      tableWrapper.next.statics.blotName === 'block' &&
      tableWrapper.next.length() === 1
    ) {
      tableWrapper.next.remove();
    }
    this.quill.setSelection(range.index, Quill.sources.SILENT);
    this.balanceTables();
  }

  listenBalanceCells() {
    this.quill.on(Quill.events.SCROLL_OPTIMIZE, mutations => {
      mutations.some(mutation => {
        if (['TD', 'TR', 'TBODY', 'TABLE'].includes(mutation.target.tagName)) {
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

  listenTableFocus() {
    this.quill.on(Quill.events.TABLE_FOCUS, data => {
      this.tableFocusData = data;
    });
  }

  listenSelectionChange() {
    this.quill.on(Quill.events.TEXT_CHANGE, () => {
      this.tableFocusData = undefined;
    });
    this.quill.on(Quill.events.SELECTION_CHANGE, () => {
      this.tableFocusData = undefined;
    });
  }
}

export default Table;
