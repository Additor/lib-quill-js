import { BlockEmbed } from '../blots/block';
import Link from '../formats/link';

const ATTRIBUTES = ['height', 'width'];

class AdditorEmbed extends BlockEmbed {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.setAttribute('id', `embed_${Math.random().toString(36).substr(2, 9)}`);
  }

  static create(value) {
    const node = super.create(value);
    node.setAttribute('src', this.sanitize(value));
    node.setAttribute('frameborder', '0');
    node.setAttribute('onmousewheel', true);
    node.setAttribute('allowfullscreen', true);
    node.setAttribute('draggable', true);
    return node;
  }

  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  static sanitize(url) {
    return Link.sanitize(url); // eslint-disable-line import/no-named-as-default-member
  }

  static value(domNode) {
    return domNode.getAttribute('src');
  }

  format(name, value) {
    if (ATTRIBUTES.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

AdditorEmbed.blotName = 'embed';
AdditorEmbed.className = 'ql-embed';
AdditorEmbed.tagName = 'IFRAME';

export default AdditorEmbed;
