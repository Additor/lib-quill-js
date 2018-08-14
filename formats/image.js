import { EmbedBlot } from 'parchment';
import { sanitize } from '../formats/link';

const ATTRIBUTES = ['alt', 'height', 'width'];
const ImageFormatAttributesList = [
  'alt',
  'height',
  'width',
  'style',
];

class Image extends EmbedBlot {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'string') {
      node.setAttribute('src', this.sanitize(value));
    }
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

  static match(url) {
    return /\.(jpe?g|gif|png)$/.test(url) || /^data:image\/.+;base64/.test(url);
  }

  static register() {
    if (/Firefox/i.test(navigator.userAgent)) {
      setTimeout(() => {
        // Disable image resizing in Firefox
        document.execCommand('enableObjectResizing', false, false);
      }, 1);
    }
  }

  static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
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
Image.blotName = 'image';
Image.tagName = 'IMG';

class AdditorImage extends Image {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.setAttribute('id', `img_${Math.random().toString(36).substr(2, 9)}`);
  }
  static formats(domNode) {
    return ImageFormatAttributesList.reduce(function(formats, attribute) {
      if (domNode.hasAttribute(attribute)) {
        let attr = domNode.getAttribute(attribute);
        if (attribute === 'style') attr = _.replace(attr, 'visibility: hidden;', '');
        formats[attribute] = attr;
      }
      return formats;
    }, {});
  }
  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (value) {
        this.domNode.setAttribute(name, _.replace(value, 'visibility: hidden;', '')); // visibility 가 hidden 일 경우 제거해줌
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
AdditorImage.className = 'ql-img';

export default AdditorImage;
