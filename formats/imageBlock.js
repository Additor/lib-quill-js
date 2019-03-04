import _ from 'lodash';
import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';
import { BlockEmbed } from '../blots/block';

const ImageFormatAttributesList = [
  'alt',
  'height',
  'width',
  'style',
  'image-style',
  'caption',
  'ratio', // width / height
  'inline-comment',
];

function isDisabled() {
  return !!document.querySelector('.ql-disabled');
}

class AdditorImage extends BlockEmbed {
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
    imageWrapper.classList.add('ql-img-wrapper');

    function getVerticalBarPosition(isGuidelineLeft, imageWidth) {
      let cursorPosition = '';
      let alignStyle = null;
      const styles = node.getAttribute('style');
      if (styles) {
        styles
          .split(';')
          .map(style => style.trim())
          .forEach(style => {
            const [styleName, styleValue] = style.split(': ');
            if (styleName === 'float') {
              alignStyle = styleValue;
              return false;
            }
            return true;
          });
      }

      if (alignStyle === 'left') {
        cursorPosition = isGuidelineLeft ? `-2px` : `${imageWidth + 7}px`;
      } else if (alignStyle === 'right') {
        cursorPosition = isGuidelineLeft
          ? `calc(100% - ${imageWidth + 8}px)`
          : `calc(100% + 1px)`;
      } else {
        cursorPosition = isGuidelineLeft
          ? `calc(50% - ${imageWidth / 2 + 5}px)`
          : `calc(50% + ${imageWidth / 2 + 4}px)`;
      }
      return cursorPosition;
    }

    const cursor = document.createElement('div');
    cursor.classList.add('vertical-bar', 'cursor');
    const guideline = document.createElement('div');
    guideline.classList.add('vertical-bar', 'guideline');

    imageWrapper.appendChild(cursor);
    imageWrapper.appendChild(guideline);

    const image = document.createElement('IMG');
    if (typeof value === 'string') {
      image.setAttribute('src', this.sanitize(value));
    }
    image.classList.add('fade-in-and-scale-up');
    image.addEventListener('animationend', () => {
      image.classList.remove('fade-in-and-scale-up');
    });
    imageWrapper.appendChild(image);

    const captionInput = document.createElement('INPUT');
    captionInput.setAttribute('maxlength', '40');
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
    captionInput.setAttribute('spellcheck', 'false');
    captionInput.classList.add('caption');
    if (isDisabled()) {
      captionInput.setAttribute('readonly', true);
    } else {
      captionInput.setAttribute('placeholder', 'Write a caption');
    }
    imageWrapper.setAttribute('contenteditable', 'false');
    imageWrapper.appendChild(captionInput);

    const dropHelperTop = document.createElement('div');
    dropHelperTop.classList.add('image-drop-helper', 'image-drop-helper-horizontal', 'top');
    dropHelperTop.addEventListener('dragenter', () => {
      guideline.style.display = 'none';
      dropHelperTop.style.borderTop = '1px solid #7552f6';
    });

    const dropHelperLeft = document.createElement('div');
    dropHelperLeft.classList.add('image-drop-helper', 'image-drop-helper-vertical', 'left');
    dropHelperLeft.addEventListener('dragenter', () => {
      const width = Number(node.getAttribute('width'));
      const height = width / Number(node.getAttribute('ratio'));
      const position = getVerticalBarPosition(true, width);
      guideline.style.display = 'block';
      guideline.style.height = `${height}px`;
      guideline.style.left = position;
    });

    const dropHelperRight = document.createElement('div');
    dropHelperRight.classList.add('image-drop-helper', 'image-drop-helper-vertical', 'right');
    dropHelperRight.addEventListener('dragenter', () => {
      const width = Number(node.getAttribute('width'));
      const height = width / Number(node.getAttribute('ratio'));
      const position = getVerticalBarPosition(false, width);
      guideline.style.display = 'block';
      guideline.style.height = `${height}px`;
      guideline.style.left = position;
    });

    node.appendChild(dropHelperTop);
    node.appendChild(dropHelperLeft);
    node.appendChild(dropHelperRight);
    node.appendChild(imageWrapper);

    node.setAttribute('contenteditable', 'false');

    node.addEventListener('dragleave', event => {
      if (event.relatedTarget) {
        if (event.relatedTarget.classList.contains('ql-img')) {
          return;
        }
        const relatedTargetImage = event.relatedTarget.closest('.ql-img');
        if (relatedTargetImage && relatedTargetImage === node) {
          return;
        }
      }

      dropHelperLeft.style.display = 'none';
      dropHelperRight.style.display = 'none';
      dropHelperTop.style.display = 'none';
      dropHelperTop.style.borderTop = 'none';
      guideline.style.display = 'none';
    });

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

      if (attribute === 'inline-comment') {
        formats[attribute] = _.filter(domNode.classList, className => {
          return _.includes(className, 'comment_');
        });
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

          if (name === 'width') {
            const { ratio } = this.formats();
            if (ratio) {
              const dropHelpers = this.domNode.querySelectorAll('.image-drop-helper-vertical');
              const width = Number(value);
              const height = width / ratio;
              dropHelpers.forEach(dropHelper => {
                dropHelper.style.height = `${height}px`;
              });

              const imageWrapper = this.domNode.querySelector('.ql-img-wrapper');
              imageWrapper.addEventListener('click', event => {
                if (event.target === imageWrapper) {
                  const center = event.target.getBoundingClientRect().width / 2;
                  this.showFakeCursor(event.offsetX < center);
                }
              });
            }
          } else if (name === 'ratio') { // DomNode, event, listener를 받아서 처리하는 함수로 만들 수 있을 듯..
            const { width: imageWidth } = this.formats();
            if (imageWidth) {
              const dropHelpers = this.domNode.querySelectorAll('.image-drop-helper-vertical');
              const width = Number(imageWidth);
              const height = width / value;
              dropHelpers.forEach(dropHelper => {
                dropHelper.style.height = `${height}px`;
              });

              const imageWrapper = this.domNode.querySelector('.ql-img-wrapper');
              imageWrapper.addEventListener('click', event => {
                if (event.target === imageWrapper) {
                  const center = event.target.getBoundingClientRect().width / 2;
                  this.showFakeCursor(event.offsetX < center);
                }
              });
            }
          }
        } else {
          imageNode.removeAttribute(name);
        }
      }

      if (name === 'inline-comment') {
        if (_.isArray(value)) {
          _.forEach(value, commentId => {
            if (_.includes(commentId, 'comment_')) {
              this.domNode.classList.add(commentId);
            }
          });
        } else if (value.cid) {
          let commentId = value.cid;
          if (!_.includes(commentId, 'comment_')) {
            commentId = `comment_${commentId}`;
          }
          this.domNode.classList.add(commentId);
        }
      } else if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }

  getImageRect() {
    const { width: imageWidth, ratio } = this.formats();
    const width = Number(imageWidth);
    const height = width / ratio;

    return { width, height };
  }

  getVerticalBarPosition(imageAlignStyle, isCursorLeft, imageWidth) {
    let cursorPosition = '';
    if (imageAlignStyle === 'left') {
      cursorPosition = isCursorLeft ? `-2px` : `${imageWidth + 7}px`;
    } else if (imageAlignStyle === 'right') {
      cursorPosition = isCursorLeft
        ? `calc(100% - ${imageWidth + 8}px)`
        : `calc(100% + 1px)`;
    } else {
      cursorPosition = isCursorLeft
        ? `calc(50% - ${imageWidth / 2 + 5}px)`
        : `calc(50% + ${imageWidth / 2 + 4}px)`;
    }
    return cursorPosition;
  }

  getImageAlignedStatus() {
    const { style } = this.formats();

    let alignStyle = '';
    if (style) {
      style.split(';').forEach(eachStyle => {
        const [styleName, styleValue] = eachStyle.trim().split(': ');
        if (styleName === 'float') {
          alignStyle = styleValue;
        }
        return false;
      });
    }
    return alignStyle;
  }

  showFakeCursor(isLeft = true) {
    this.hideFakeCursor();

    const cursor = this.domNode.querySelector('.cursor');
    const { width, height } = this.getImageRect();
    const alignStyle = this.getImageAlignedStatus();
    cursor.style.left = this.getVerticalBarPosition(alignStyle, isLeft, width);
    cursor.style.display = 'block';
    setTimeout(() => {
      cursor.style.animation = 'blinker 1s step-end infinite';
    }, 200);
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
    const cursor = this.domNode.querySelector('.cursor');
    cursor.style.animation = 'none';
    cursor.style.display = 'none';
    this.scroll.emitter.emit(Emitter.events.IMAGE_FOCUS, undefined);
  }

  showDropHelper(disableVerticalGuideline) {
    const dropHelpers = this.domNode.querySelectorAll('.image-drop-helper-vertical');
    const dropHelperTop = this.domNode.querySelector('.image-drop-helper-horizontal');
    const { height } = this.getImageRect();

    if (disableVerticalGuideline) {
      dropHelpers.forEach(dropHelper => {
        dropHelper.style.display = 'none';
      });
      dropHelperTop.style.height = `${height}px`;
      dropHelperTop.style.display = 'block';
    } else {
      dropHelpers.forEach(dropHelper => {
        dropHelper.style.height = `${height}px`;
        dropHelper.style.display = 'block';
      });
      dropHelperTop.style.display = 'block';
    }
  }

  hideDropHelper() {
    const dropGuideline = this.domNode.querySelector('.guideline');
    dropGuideline.style.display = 'none';
    const dropHelpers = this.domNode.querySelectorAll('.image-drop-helper');
    dropHelpers.forEach(dropHelper => {
      dropHelper.style.display = 'none';
    });
  }
}

AdditorImage.tagName = 'DIV';
AdditorImage.blotName = 'image';
AdditorImage.className = 'ql-img';

export default AdditorImage;
