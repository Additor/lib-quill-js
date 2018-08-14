import Block from '../blots/block';
import Container from '../blots/container';
import _ from 'lodash';

const CELL_STYLE_ATTRIBUTES = ['data-row', 'width'];
class TableCell extends Block {
  constructor(scroll, domNode) {
    super(scroll, domNode);

    const resizer = document.createElement('div');
    const resizerInner = document.createElement('div');
    resizerInner.classList.add('resizer-inner');
    resizer.appendChild(resizerInner);
    resizer.classList.add('resizer');
    resizer.contentEditable = false;
    domNode.appendChild(resizer);
    resizer.addEventListener('mouseenter', () => {
      resizer.classList.add('hovered');
      const tableContainer = this.table();
      const cells = tableContainer.cells(this.cellOffset());
      _.forEach(cells, cell => cell.resizer.classList.add('hovered'));
    });

    resizer.addEventListener('mouseleave', () => {
      resizer.classList.remove('hovered');
      const tableContainer = this.table();
      const cells = tableContainer.cells(this.cellOffset());
      _.forEach(cells, cell => cell.resizer.classList.remove('hovered'));
    });

    this.resizer = resizer;
  }

  static create(value) {
    const node = super.create();

    if (_.isString(value)) {
      node.setAttribute('data-row', value);
    } else {
      if (value['data-row']) {
        node.setAttribute('data-row', value['data-row']);
      } else {
        node.setAttribute('data-row', tableId());
      }

      if (value.width) {
        node.style.width = value.width;
      }
    }
    return node;
  }

  static formats(domNode) {
    return CELL_STYLE_ATTRIBUTES.reduce((formats, name) => {
      if (name === 'data-row') {
        formats[name] = domNode.getAttribute('data-row');
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
    if (name === 'data-row') {
      this.domNode.setAttribute('data-row', value);
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

  setWidth(width) {
    this.format('width', width);
  }

  getWidth() {
    return this.domNode.getBoundingClientRect().width;
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
        const blot = this.scroll.create(TableCell.blotName, value['data-row']);
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
      const cell = this.scroll.create(TableCell.blotName, value['data-row']);
      row.insertBefore(cell, ref);
    });
  }

  insertRow(index) {
    const [body] = this.descendant(TableBody);
    if (body == null || body.children.head == null) return;
    const id = tableId();
    const row = this.scroll.create(TableRow.blotName);
    body.children.head.children.forEach(() => {
      const cell = this.scroll.create(TableCell.blotName, id);
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

// class ScrollableTableContainer extends Container {}
// ScrollableTableContainer.blotName = 'scrollable-table-container';
// ScrollableTableContainer.className = 'scrollable-table-container';
// ScrollableTableContainer.tagName = 'DIV';
//
// ScrollableTableContainer.allowedChildren = [TableContainer];
// TableContainer.requiredContainer = ScrollableTableContainer;

TableContainer.allowedChildren = [TableBody];
TableBody.requiredContainer = TableContainer;

TableBody.allowedChildren = [TableRow];
TableRow.requiredContainer = TableBody;

TableRow.allowedChildren = [TableCell];
TableCell.requiredContainer = TableRow;

function tableId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `row-${id}`;
}

export { TableCell, TableRow, TableBody, TableContainer, tableId };
