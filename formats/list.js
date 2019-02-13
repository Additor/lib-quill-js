import Block from '../blots/block';
import Container from '../blots/container';
import Quill from '../core/quill';

class ListContainer extends Container {}
ListContainer.blotName = 'list-container';
ListContainer.tagName = 'OL';

class ListItem extends Block {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-list', value);
    return node;
  }

  static formats(domNode) {
    return domNode.getAttribute('data-list') || undefined;
  }

  static register() {
    Quill.register(ListContainer);
  }

  constructor(scroll, domNode) {
    super(scroll, domNode);
    const ui = domNode.ownerDocument.createElement('span');
    const listEventHandler = () => {
      if (!scroll.isEnabled()) return;
      const format = this.statics.formats(domNode, scroll);
      if (format === 'checked') {
        this.format('list', 'unchecked');
      } else if (format === 'unchecked') {
        this.format('list', 'checked');
      }
    };
    ui.addEventListener('mousedown', listEventHandler);
    ui.addEventListener('touchstart', listEventHandler);
    if (domNode.getAttribute('data-list') !== 'ordered') {
      // ordered 에서만 다른 리스트와 달리 해당 ui 가 마우스로 선택되는 현상이 발생함
      // 이것을 막기 위해서 ordered list 에서는 ui 를 붙이지 않음
      this.attachUI(ui);
    }
  }

  format(name, value) {
    if (name === this.statics.blotName && value) {
      this.domNode.setAttribute('data-list', value);
      if (value !== 'ordered' && !this.uiNode) {
        // ordered list 가 아닌 다른 list 로 변경시 uiNode 를 새로 붙여줌
        const ui = this.domNode.ownerDocument.createElement('span');
        const listEventHandler = () => {
          if (!this.scroll.isEnabled()) return;
          const format = this.statics.formats(this.domNode, this.scroll);
          if (format === 'checked') {
            this.format('list', 'unchecked');
          } else if (format === 'unchecked') {
            this.format('list', 'checked');
          }
        };
        ui.addEventListener('mousedown', listEventHandler);
        ui.addEventListener('touchstart', listEventHandler);
        this.attachUI(ui);
      } else if (value === 'ordered' && this.uiNode) {
        // ordered list 로 변경시 uiNode 를 제거해 줌
        this.uiNode.remove();
        delete this.uiNode;
      }
    } else {
      super.format(name, value);
    }
  }
}
ListItem.blotName = 'list';
ListItem.tagName = 'LI';

ListContainer.allowedChildren = [ListItem];
ListItem.requiredContainer = ListContainer;

export { ListContainer, ListItem as default };
