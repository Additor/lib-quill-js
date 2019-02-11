import { EmbedBlot } from 'parchment';
import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';

const ImageFormatAttributesList = [
  'alt',
  'height',
  'width',
  'style',
  'image-style',
  'caption',
  'ratio', // width / height
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

    const imageWrapper = document.createElement('DIV');

    const cursorLeft = document.createElement('div');
    cursorLeft.classList.add('cursor', 'left');
    const cursorRight = document.createElement('div');
    cursorRight.classList.add('cursor', 'right');

    imageWrapper.appendChild(cursorLeft);
    imageWrapper.appendChild(cursorRight);

    const image = document.createElement('IMG');
    if (typeof value === 'string') {
      image.setAttribute('src', this.sanitize(value));
    }
    imageWrapper.appendChild(image);

    // caption
    const captionInput = document.createElement('INPUT');
    captionInput.addEventListener('click', ev => {
      ev.stopPropagation();
    });
    captionInput.addEventListener('keydown', ev => {
      // Enter, Tab, Escape
      if (ev.keyCode === 13 || ev.keyCode === 9 || ev.keyCode === 27) {
        ev.preventDefault();
      } else {
        ev.stopPropagation();
      }
    });
    captionInput.setAttribute('type', 'text');
    captionInput.setAttribute('placeholder', 'Write a caption');
    captionInput.setAttribute('class', 'caption');
    captionInput.setAttribute('spellcheck', 'false');
    imageWrapper.appendChild(captionInput);

    const dropHelperLeft = document.createElement('div');
    dropHelperLeft.classList.add('image-drop-helper', 'left');

    const dropHelperRight = document.createElement('div');
    dropHelperRight.classList.add('image-drop-helper', 'right');

    node.appendChild(dropHelperLeft);
    node.appendChild(dropHelperRight);
    node.appendChild(imageWrapper);

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
        const imageNode = this.domNode.getElementsByTagName('IMG')[0];
        if (captionInput) {
          captionInput.setAttribute('value', value);
          imageNode.setAttribute('caption', value);
        }
      }

      if (name === 'image-style' || name === 'width' || name === 'height' || name === 'ratio') {
        const imageNode = this.domNode.getElementsByTagName('IMG')[0];
        if (value) {
          imageNode.setAttribute(
            name,
            _.replace(value, 'visibility: hidden;', ''),
          ); // visibility 가 hidden 일 경우 제거해줌
          if (name === 'width') {
            const captionInput = this.domNode.querySelector('.caption');
            if (captionInput) {
              captionInput.style.width = `${value}px`;
            }
          }
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

  showFakeCursor(isLeft = true) {
    this.hideFakeCursor();
    const width = this.domNode.getAttribute('width');
    const height = width / this.domNode.getAttribute('ratio');
    let cursor = null;
    if (isLeft) {
      cursor = this.domNode.querySelector('.cursor.left');
      cursor.style.left = `calc(50% - ${width / 2 + 5}px)`;
    } else {
      cursor = this.domNode.querySelector('.cursor.right');
      cursor.style.right = `calc(50% - ${width / 2 + 5}px)`;
    }
    cursor.style.display = 'block';
    cursor.style.height = `${height}px`;
    setTimeout(() => {
      this.scroll.domNode.blur();
      this.scroll.emitter.once(Emitter.events.SELECTION_CHANGE, () => {
        this.hideFakeCursor();
      });
      this.scroll.emitter.emit(Emitter.events.IMAGE_FOCUS, {
        blot: this,
        cursorOffset: isLeft ? 0 : 1,
      });
    });
  }

  hideFakeCursor() {
    const cursors = this.domNode.querySelectorAll('.cursor');
    cursors.forEach(cursor => {
      cursor.style.display = 'none';
    });
    this.scroll.emitter.emit(Emitter.events.IMAGE_FOCUS, undefined);
  }
}

AdditorImage.tagName = 'DIV';
AdditorImage.blotName = 'image';
AdditorImage.className = 'ql-img';

export default AdditorImage;
