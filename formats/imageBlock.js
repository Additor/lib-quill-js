import _ from 'lodash';
import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';
import { BlockEmbed } from '../blots/block';
import ImageGrid from './imageGrid';

const ImageFormatAttributesList = [
  'alt',
  'height',
  'width',
  'style',
  'image-style',
  'caption',
  'ratio', // width / height
  'inline-comment',
  'create-animation',
];

function isDisabled() {
  return !!document.querySelector('.ql-disabled');
}

class AdditorImage extends BlockEmbed {
  static create(value) {
    const node = super.create(value);

    node.setAttribute(
      'id',
      `img_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    );

    const imageWrapper = document.createElement('DIV');
    imageWrapper.classList.add('ql-img-wrapper');

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
    imageWrapper.appendChild(image);

    const captionInput = document.createElement('SPAN');
    captionInput.setAttribute('contenteditable', 'true');
    captionInput.addEventListener('click', ev => {
      ev.stopPropagation();
    });
    captionInput.addEventListener('keydown', ev => {
      if (ev.keyCode === 37) {
        // ArrowLeft
        if (window.getSelection) {
          const selected = window.getSelection();
          if (selected.isCollapsed && selected.focusOffset === 0) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      } else if (ev.keyCode === 39) {
        // ArrowRight
        if (window.getSelection) {
          const selected = window.getSelection();
          if (selected.isCollapsed && selected.focusOffset === selected.focusNode.length) {
            ev.preventDefault();
            ev.stopPropagation();
          }
        }
      } else if (ev.keyCode === 38 || ev.keyCode === 40) {
        // ArrowUp or ArrowDown
        ev.preventDefault();
        ev.stopPropagation();
      } else if (ev.keyCode === 13 || ev.keyCode === 9 || ev.keyCode === 27) {
        // Enter, Tab, Escape 캡션에서의 keydown 처리는 Web-Frontend-Main 코드에서 한다
        ev.preventDefault();
      } else if ((ev.metaKey || ev.ctrlKey) && ev.keyCode === 65) {
        // 전체선택 (Ctrl or Cmd + A)
        ev.preventDefault();
        ev.stopPropagation();
        if (window.getSelection) {
          const selected = window.getSelection();
          selected.selectAllChildren(captionInput);
        }
      } else {
        ev.stopPropagation();
      }
    });

    captionInput.addEventListener('copy', ev => {
      ev.stopPropagation();
    });
    captionInput.addEventListener('paste', ev => {
      ev.preventDefault();
      ev.stopPropagation();

      const text = ev.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, text);
    });

    captionInput.setAttribute('spellcheck', 'false');
    captionInput.classList.add('caption');
    if (isDisabled()) {
      captionInput.setAttribute('contenteditable', 'false');
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
      const alignStyle = AdditorImage.getImageAlignedStatus(node.getAttribute('style'));
      const position = AdditorImage.getVerticalBarPosition(alignStyle, true, width);
      guideline.style.display = 'block';
      guideline.style.height = `${height}px`;
      guideline.style.left = position;
    });

    const dropHelperRight = document.createElement('div');
    dropHelperRight.classList.add('image-drop-helper', 'image-drop-helper-vertical', 'right');
    dropHelperRight.addEventListener('dragenter', () => {
      const width = Number(node.getAttribute('width'));
      const height = width / Number(node.getAttribute('ratio'));
      const alignStyle = AdditorImage.getImageAlignedStatus(node.getAttribute('style'));
      const position = AdditorImage.getVerticalBarPosition(alignStyle, false, width);
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
    const imageNode = domNode.getElementsByTagName('IMG')[0];
    if (imageNode) {
      return imageNode.getAttribute('src');
    }
  }

  static formats(domNode) {
    const imageNode = domNode.getElementsByTagName('IMG')[0];
    if (!imageNode) return {};
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

  setDropHelperHeight(height) {
    const dropHelpers = this.domNode.querySelectorAll('.image-drop-helper');
    dropHelpers.forEach(dropHelper => {
      dropHelper.style.height = `${height}px`;
    });
  }

  setImageBoundClickHandler() {
    if (this.scroll.isEnabled && this.scroll.isEnabled()) {
      this.domNode.addEventListener('click', event => {
        if (event.target === this.domNode) {
          const center = event.target.getBoundingClientRect().width / 2;
          this.showFakeCursor(event.offsetX < center);
        }
      });
    }
  }

  format(name, value) {
    if (ImageFormatAttributesList.indexOf(name) > -1) {
      if (name === 'create-animation') {
        const image = this.domNode.querySelector('img');
        image.classList.add(value);
        image.addEventListener('animationend', () => {
          image.classList.remove(value);
        });
        return;
      }

      if (name === 'caption') {
        const captionInput = this.domNode.querySelector('.caption');
        const imageNode = this.domNode.getElementsByTagName('IMG')[0];
        if (captionInput) {
          captionInput.innerText = value;
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
              const height = Number(value) / ratio;
              this.setDropHelperHeight(height);
              this.setImageBoundClickHandler();
            }
          } else if (name === 'ratio') { // DomNode, event, listener를 받아서 처리하는 함수로 만들 수 있을 듯..
            const { width } = this.formats();
            if (width) {
              const height = Number(width) / value;
              this.setDropHelperHeight(height);
              this.setImageBoundClickHandler();
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

  /**
   * 이미지 사이즈 찾기
   * @return {Object} { width, height }
   */
  getImageRect() {
    const { width: imageWidth, ratio } = this.formats();
    const width = Number(imageWidth);
    const height = width / ratio;

    return { width, height };
  }

  /**
   * 커서 또는 드래그앤드롭 가이드라인의 위치를 찾는다
   * @param {String} imageAlignStyle [ 'left' | 'right' | '' ]
   * @param {Boolean} isCursorLeft []
   * @param {Number} imageWidth 현재 이미지의 너비
   * @return {String} '**px'
   */
  static getVerticalBarPosition(imageAlignStyle, isCursorLeft, imageWidth) {
    let cursorPosition = '';
    if (imageAlignStyle === 'left') {
      cursorPosition = isCursorLeft ? `0` : `${imageWidth + 4}px`;
    } else if (imageAlignStyle === 'right') {
      cursorPosition = isCursorLeft
        ? `calc(100% - ${imageWidth + 5}px)`
        : `calc(100% - 2px)`;
    } else {
      cursorPosition = isCursorLeft
        ? `calc(50% - ${imageWidth / 2 + 5}px)`
        : `calc(50% + ${imageWidth / 2 + 4}px)`;
    }
    return cursorPosition;
  }

  /**
   * align 상태가 어떤지 찾는다
   * @param {String} styles 해당 blot의 style attribute값
   * @return {String} '' | 'left' | 'right'
   */
  static getImageAlignedStatus(styles) {
    let alignStyle = '';
    if (styles) {
      styles.split(';').forEach(eachStyle => {
        const [styleName, styleValue] = eachStyle.trim().split(': ');
        if (styleName === 'float') {
          alignStyle = styleValue;
        }
        return false;
      });
    }
    return alignStyle;
  }

  /**
   * fakeCursor를 표현한다.
   * @param {Boolean} isLeft fake cursor를 표현할 위치를 정한다. true이면 왼쪽 false이면 오른쪽
   */
  showFakeCursor(isLeft = true) {
    if (!this.scroll.isEnabled()) return;
    const imageGrids = this.scroll.descendants(ImageGrid);
    _.forEach(imageGrids, imageGrid => imageGrid.hideFakeCursor());

    const images = this.scroll.descendants(AdditorImage);
    _.forEach(images, imageGrid => imageGrid.hideFakeCursor());

    const cursor = this.domNode.querySelector('.cursor');
    const { width, height } = this.getImageRect();
    const alignStyle = AdditorImage.getImageAlignedStatus(this.domNode.getAttribute('style'));
    cursor.style.left = AdditorImage.getVerticalBarPosition(alignStyle, isLeft, width);
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
      document.activeElement && document.activeElement.blur(); // caption input 에서 blur 시킴
    });
  }

  hideFakeCursor() {
    const cursor = this.domNode.querySelector('.cursor');
    cursor.style.animation = 'none';
    cursor.style.display = 'none';
    this.scroll.emitter.emit(Emitter.events.IMAGE_FOCUS, undefined);
    this.scroll.emitter.emit(Emitter.events.IMAGE_GRID_FOCUS, undefined);
  }

  /**
   * 사용자가 이미지를 드래그하는 중일 때 dragover target 이미지의 drop helper를 보여줌
   * @param {Boolean} disableVerticalGuideline 세로 드롭헬퍼를 표현하지 않는 경우 true
   */
  showDropHelper(disableVerticalGuideline) {
    if (
      this.domNode.style.float === 'left' ||
      this.domNode.style.float === 'right'
    ) {
      return;
    }
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
