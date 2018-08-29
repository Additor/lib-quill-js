import Block from '../blots/block';
import Container from '../blots/container';
import _ from 'lodash';

const CELL_STYLE_ATTRIBUTES = ['data-row', 'data-table', 'width'];
const NOT_AVAILABLE_FORMATS = [
  'background',
  'script',
  'blockquote',
  'header',
  'indent',
  'list',
  'align',
  'direction',
  'code-block',
  'embed',
  'image',
];

class TableCell extends Block {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    if (scroll.isEnabled()) {
      const resizer = document.createElement('div');
      const resizerInner = document.createElement('div');
      resizerInner.classList.add('resizer-inner');
      resizer.appendChild(resizerInner);
      resizer.classList.add('resizer');
      resizer.contentEditable = false;
      domNode.appendChild(resizer);
      resizer.addEventListener('mouseenter', () => {
        if (!scroll.isEnabled()) return;
        resizer.classList.add('hovered');
        const tableContainer = this.table();
        const cells = tableContainer.cells(this.cellOffset());
        _.forEach(cells, cell => cell.resizer.classList.add('hovered'));
      });
      resizer.addEventListener('mouseleave', () => {
        if (!scroll.isEnabled()) return;
        resizer.classList.remove('hovered');
        const tableContainer = this.table();
        const cells = tableContainer.cells(this.cellOffset());
        _.forEach(cells, cell => cell.resizer.classList.remove('hovered'));
      });

      this.resizer = resizer;
    }
  }

  static create(value) {
    const node = super.create();

    if (_.isString(value)) {
      node.setAttribute('data-row', value);
    } else {
      if (value['data-row']) {
        node.setAttribute('data-row', value['data-row']);
      } else {
        node.setAttribute('data-row', rowId());
      }

      if (value['data-table']) {
        node.setAttribute('data-table', value['data-table']);
      } else {
        node.setAttribute('data-table', tableId());
      }

      if (value.width) {
        node.style.width = value.width;
        node.style.minWidth = value.width;
      }
    }
    return node;
  }

  static formats(domNode) {
    return CELL_STYLE_ATTRIBUTES.reduce((formats, name) => {
      if (name === 'data-row') {
        formats[name] = domNode.getAttribute('data-row');
      } else if (name === 'data-table') {
        formats[name] = domNode.getAttribute('data-table');
      } else if (domNode.style[name]) {
        formats[name] = domNode.style[name];
      }
      return formats;
    }, {});
  }

  cellOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  format(name, value) {
    if (NOT_AVAILABLE_FORMATS.indexOf(name) !== -1) {
      return;
    }
    if (name === 'data-row') {
      this.domNode.setAttribute('data-row', value);
    } else if (name === 'data-table') {
      this.domNode.setAttribute('data-table', value);
    } else if (name === 'width') {
      this.domNode.style[name] = value;
    } else {
      super.format(name, value);
    }
  }

  getId() {
    return this.domNode.getAttribute('data-row');
  }

  row() {
    return this.parent;
  }

  rowOffset() {
    if (this.row()) {
      return this.row().rowOffset();
    }
    return -1;
  }

  table() {
    return this.row() && this.row().table();
  }
}
TableCell.blotName = 'table';
TableCell.tagName = 'TD';

class TableRow extends Container {
  checkMerge() {
    if (super.checkMerge() && this.next.children.head != null) {
      const thisHead = this.children.head.getId();
      const thisTail = this.children.tail.getId();
      const nextHead = this.next.children.head.getId();
      const nextTail = this.next.children.tail.getId();
      return (
        thisHead === thisTail &&
        thisHead === nextHead &&
        thisHead === nextTail
      );
    }
    return false;
  }

  optimize(...args) {
    super.optimize(...args);
    this.children.forEach(child => {
      if (child.next == null) return;
      const childFormats = child.getId();
      const nextFormats = child.next.getId();
      if (childFormats !== nextFormats) {
        const next = this.splitAfter(child);
        if (next) {
          next.optimize();
        }
        // We might be able to merge with prev now
        if (this.prev) {
          this.prev.optimize();
        }
      }
    });
  }

  rowOffset() {
    if (this.parent) {
      return this.parent.children.indexOf(this);
    }
    return -1;
  }

  table() {
    return this.parent && this.parent.parent;
  }
}
TableRow.blotName = 'table-row';
TableRow.tagName = 'TR';

class TableBody extends Container {}
TableBody.blotName = 'table-body';
TableBody.tagName = 'TBODY';

class TableContainer extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    _.defer(() => {
      const rows = this.rows();
      if (!_.isEmpty(rows)) {
        let resized = false;
        rows[0].children.forEach((child) => {
          if (child.domNode.style.width) resized = true;
        });
        if (!resized) {
          this.domNode.style.tableLayout = 'fixed';
          this.domNode.style.width = 'calc(100% - 5px)';
        }
      }
    });
  }

  balanceCells() {
    const rows = this.descendants(TableRow);
    const maxColumns = rows.reduce((max, row) => {
      return Math.max(row.children.length, max);
    }, 0);
    rows.forEach(row => {
      new Array(maxColumns - row.children.length).fill(0).forEach(() => {
        let value;
        if (row.children.head != null) {
          value = TableCell.formats(row.children.head.domNode);
        }
        const blot = this.scroll.create(TableCell.blotName, value);
        row.appendChild(blot);
        blot.optimize(); // Add break blot
      });
    });
  }

  cells(column) {
    return this.rows().map(row => row.children.at(column));
  }

  deleteColumn(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach(row => {
      const cell = row.children.at(index);
      if (cell != null) {
        cell.remove();
      }
    });
  }

  insertColumn(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    body.children.forEach(row => {
      const ref = row.children.at(index);
      const value = TableCell.formats(row.children.head.domNode);
      const cell = this.scroll.create(TableCell.blotName, value);
      row.insertBefore(cell, ref);
    });
  }

  insertRow(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const rid = rowId();
    const tid = body.children.head.children.head.domNode.getAttribute('data-table');
    const row = this.scroll.create(TableRow.blotName);
    body.children.head.children.forEach(() => {
      const cell = this.scroll.create(TableCell.blotName, {
        'data-row': rid,
        'data-table': tid,
      });
      row.appendChild(cell);
    });
    const ref = body.children.at(index);
    body.insertBefore(row, ref);
  }

  rows() {
    const body = this.children.head;
    if (body == null) return [];
    return body.children.map(row => row);
  }
}
TableContainer.blotName = 'table-container';
TableContainer.tagName = 'TABLE';

class ScrollableTableContainer extends Container {}

ScrollableTableContainer.blotName = 'scrollable-table-container';
ScrollableTableContainer.className = 'scrollable-table-container';
ScrollableTableContainer.tagName = 'DIV';

class TableWrapper extends Container {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.id = tableId();
  }

  checkMerge() {
    if (super.checkMerge()) {
      if (this.statics.blotName === this.next.statics.blotName) {
        const thisTableId = this.getNearestDataTable(this.children);
        const nextTableId = this.getNearestDataTable(this.next.children);
        return !!thisTableId && !!nextTableId && thisTableId === nextTableId;
      }
      return true;
    }
    return false;
  }

  getNearestDataTable(children) {
    if (!children.head || !children.head.children) return null;
    if (children.head.domNode.hasAttribute('data-table')) {
      return children.head.domNode.getAttribute('data-table');
    }
    return this.getNearestDataTable(children.head.children);
  }
}
TableWrapper.blotName = 'table-wrapper';
TableWrapper.className = 'table-wrapper';
TableWrapper.tagName = 'DIV';

TableWrapper.allowedChildren = [ScrollableTableContainer];
ScrollableTableContainer.requiredContainer = TableWrapper;

ScrollableTableContainer.allowedChildren = [TableContainer];
TableContainer.requiredContainer = ScrollableTableContainer;

TableContainer.allowedChildren = [TableBody];
TableBody.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

function rowId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `row-${id}`;
}

function tableId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `table-${id}`;
}

export { TableCell, TableRow, TableBody, TableContainer, ScrollableTableContainer, TableWrapper, rowId, tableId };
