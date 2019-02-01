import { EmbedBlot } from 'parchment';
import { sanitize } from '../formats/link';

const ImageFormatAttributesList = [
  'alt',
  'height',
  'width',
  'style',
  'image-style',
  'caption',
];

class AdditorImage extends EmbedBlot {
  static create(value) {
    const node = super.create(value);

    // image
    node.setAttribute(
      'id',
      `img_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    );

    const image = document.createElement('IMG');
    if (typeof value === 'string') {
      image.setAttribute('src', this.sanitize(value));
    }
    node.appendChild(image);

    // caption
    const captionInput = document.createElement('INPUT');
    captionInput.addEventListener('click', ev => {
      ev.stopPropagation();
    });
    captionInput.addEventListener('keydown', ev => {
      if (ev.keyCode === 13 || ev.keyCode === 9 || ev.keyCode === 27) { // Enter, Tab, Escape
        ev.preventDefault();
      } else {
        ev.stopPropagation();
      }
    });
    captionInput.setAttribute('type', 'text');
    captionInput.setAttribute('placeholder', 'Write a caption');
    captionInput.setAttribute('class', 'caption');
    captionInput.setAttribute('spellcheck', 'false');
    node.appendChild(captionInput);
    node.setAttribute('contenteditable', 'false');
    return node;
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
    return domNode.getElementsByTagName('IMG')[0].getAttribute('src');
  }

  static formats(domNode) {
    const imageNode = domNode.getElementsByTagName('IMG')[0];
    return ImageFormatAttributesList.reduce((formats, attribute) => {
      if (attribute === 'caption') {
        formats[attribute] = imageNode.getAttribute(attribute) || '';
        return formats;
      }

      if (attribute === 'image-style') {
        if (imageNode.hasAttribute(attribute)) {
          formats[attribute] = imageNode.getAttribute(attribute);
        }
        return formats;
      }

      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }

      return formats;
    }, {});
  }

  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (name === 'caption') {
        const captionInput = this.domNode.getElementsByTagName('INPUT')[0];
        if (captionInput) {
          captionInput.setAttribute('value', value);
        }
      }

      if (name === 'image-style' || name === 'width' || name === 'height') {
        const imageNode = this.domNode.getElementsByTagName('IMG')[0];
        if (value) {
          imageNode.setAttribute(
            name,
            _.replace(value, 'visibility: hidden;', ''),
          ); // visibility 가 hidden 일 경우 제거해줌
        } else {
          imageNode.removeAttribute(name);
        }
      }

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

AdditorImage.tagName = 'DIV';
AdditorImage.blotName = 'image';
AdditorImage.className = 'ql-img';

export default AdditorImage;
