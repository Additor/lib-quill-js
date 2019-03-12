import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';
import { BlockEmbed } from '../blots/block';
import AdditorImage from './imageBlock';
import _ from 'lodash';

const MAX_IMAGE_LENGTH = 3;

function isDisabled() {
  return !!document.querySelector('.ql-disabled');
}

class ImageGrid extends BlockEmbed {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.setAttribute('id', imageGridId());
  }

  static create(value) {
    const node = super.create();
    const { data } = value;
    node.setAttribute('image-grid-data', JSON.stringify(data));

    const dropHelperWrapper = document.createElement('div');
    dropHelperWrapper.classList.add('image-grid-drop-helper-wrapper');

    const dropHelperTop = document.createElement('div');
    dropHelperTop.classList.add('image-grid-drop-helper', 'top');
    dropHelperTop.addEventListener('dragenter', () => {
      hideDropHelper();
      dropHelperTop.style.borderTop = '1px solid #7552f6';
    });
    dropHelperTop.addEventListener('dragleave', () => {
      dropHelperTop.style.borderTop = 'none';
    });
    dropHelperTop.setAttribute('drop-index', '-1');

    const dropHelperWrapperVertical = document.createElement('div');
    dropHelperWrapperVertical.classList.add('image-grid-drop-helper-wrapper-vertical');

    function showGuideline(index) {
      const { height } = node.querySelector('.ql-img img').getBoundingClientRect();

      let leftPosition = '-6px';
      if (index > 0) {
        let sumOfWidths = -6;
        node.querySelectorAll('.ql-img').forEach((img, i) => {
          if (i < index) {
            sumOfWidths += img.getBoundingClientRect().width + 8;
          }
        });
        leftPosition = `${sumOfWidths}px`;
      }
      const guidelineElement = node.querySelector('.guideline');
      guidelineElement.style.left = leftPosition;
      guidelineElement.style.height = `${height}px`;
      guidelineElement.style.display = 'block';
    }

    function hideDropHelper() {
      const guidelineElement = node.querySelector('.guideline');
      guidelineElement.style.display = 'none';
      const dropHelperWrapperElement = node.querySelector('.image-grid-drop-helper-wrapper');
      dropHelperWrapperElement.style.display = 'none';
    }

    for (let i = 0; i <= data.length; i++) {
      const dropHelper = document.createElement('div');
      dropHelper.classList.add('image-grid-drop-helper');
      dropHelper.setAttribute('drop-index', i);
      dropHelper.addEventListener('dragenter', () => {
        showGuideline(i);
      });
      dropHelper.addEventListener('drop', () => {
        hideDropHelper();
      });
      dropHelperWrapperVertical.appendChild(dropHelper);
    }
    dropHelperWrapperVertical.addEventListener('dragleave', event => {
      if (
        event.fromElement &&
        !event.fromElement.classList.contains('image-grid-drop-helper')
      ) {
        hideDropHelper();
      }
    });

    dropHelperWrapper.appendChild(dropHelperTop);
    dropHelperWrapper.appendChild(dropHelperWrapperVertical);

    const imageGridItemWrapper = document.createElement('div');
    imageGridItemWrapper.classList.add('image-grid-item-wrapper');

    const cursor = document.createElement('div');
    cursor.classList.add('vertical-bar', 'cursor');
    imageGridItemWrapper.appendChild(cursor);

    const guideline = document.createElement('div');
    guideline.classList.add('vertical-bar', 'guideline');
    imageGridItemWrapper.appendChild(guideline);

    imageGridItemWrapper.appendChild(dropHelperWrapper);

    const sumOfRatios = data.reduce((accumulator, { attributes: { ratio } }) => accumulator + Number(ratio), 0);

    data.forEach((eachImageData, index) => {
      const {
        image: imageSrc,
        attributes: { ratio, caption, 'inline-comment': inlineComment },
      } = eachImageData;

      const imaegGridItemContainer = document.createElement('DIV');

      const imageElement = document.createElement('IMG');
      imageElement.setAttribute('src', this.sanitize(imageSrc));
      imageElement.setAttribute('caption', caption);

      const captionElement = document.createElement('SPAN');
      captionElement.setAttribute('contenteditable', 'true');
      captionElement.setAttribute('spellcheck', 'false');
      captionElement.classList.add('caption');
      if (isDisabled()) {
        captionElement.setAttribute('contenteditable', 'false');
      } else {
        captionElement.setAttribute('placeholder', 'Write a caption');
      }
      captionElement.innerText = caption;
      captionElement.addEventListener('click', ev => {
        ev.stopPropagation();
      });
      captionElement.addEventListener('keydown', ev => {
        // Enter, Tab, Escape
        if (ev.keyCode === 13 || ev.keyCode === 9 || ev.keyCode === 27) {
          ev.preventDefault();
        } else {
          ev.stopPropagation();
        }
      });
      captionElement.addEventListener('copy', ev => {
        ev.stopPropagation();
      });
      captionElement.addEventListener('paste', ev => {
        ev.preventDefault();
        ev.stopPropagation();

        const text = ev.clipboardData.getData('text/plain');
        document.execCommand('insertHTML', false, text);
      });

      imaegGridItemContainer.style.width = `${(Number(ratio) * 100) / sumOfRatios}%`;
      imaegGridItemContainer.classList.add('image-grid-item-container', 'ql-img');
      if (inlineComment && inlineComment.length > 0) {
        inlineComment.forEach(commentId => {
          imaegGridItemContainer.classList.add(commentId);
        });
      }
      imaegGridItemContainer.appendChild(imageElement);
      imaegGridItemContainer.appendChild(captionElement);
      imaegGridItemContainer.setAttribute('item-index', index);
      imaegGridItemContainer.setAttribute('contenteditable', 'false');

      imageGridItemWrapper.appendChild(imaegGridItemContainer);
    });
    const imageGridItems = imageGridItemWrapper.querySelectorAll('.image-grid-item-container');
    imageGridItems[0].classList.add('left');
    imageGridItems[imageGridItems.length - 1].classList.add('right');
    imageGridItemWrapper.setAttribute('contenteditable', 'false');
    node.appendChild(imageGridItemWrapper);

    node.setAttribute('contenteditable', 'false');
    return node;
  }

  static value(domNode) {
    const data = JSON.parse(domNode.getAttribute('image-grid-data'));
    const result = {
      data,
    };
    return result;
  }

  static sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  sanitize(url) {
    return sanitize(url, ['http', 'https', 'data']) ? url : '//:0';
  }

  static getMaxLength() {
    return MAX_IMAGE_LENGTH;
  }

  value() {
    const imageGridItemWrapper = this.domNode.querySelector('.image-grid-item-wrapper');
    if (!imageGridItemWrapper.onclick && this.scroll.isEnabled()) {
      imageGridItemWrapper.onclick = event => {
        if (event.target === imageGridItemWrapper) {
          const sections = [];
          sections.push({ start: 0, end: 8 });
          _.map(
            imageGridItemWrapper.querySelectorAll('.ql-img'),
            el => el.getBoundingClientRect().width,
          ).forEach((imageWidth, i) => {
            const lastEnd = sections[i].end;
            const start = lastEnd + imageWidth;
            const end = start + 8;
            sections.push({ start, end });
          });
          sections.forEach(({ start, end }, i) => {
            if (start < event.offsetX && event.offsetX < end) {
              this.showFakeCursor(i);
              return false;
            }
          });
        }
      };
    }
    return super.value();
  }

  static formats(domNode) {
    const data = JSON.parse(domNode.getAttribute('image-grid-data'));
    const result = {
      data,
    };
    return result;
  }

  format(format, value) {
    if (format === 'created-data') {
      const { index: newImageIndex, animation } = value;
      const imageGridItemWrapper = this.domNode.querySelector('.image-grid-item-wrapper');
      const animationTarget = imageGridItemWrapper.querySelectorAll(`.image-grid-item-container`)[newImageIndex];
      animationTarget.addEventListener('animationend', () => {
        animationTarget.classList.remove(animation);
      });
      animationTarget.classList.add(animation);
    } else if (format === 'add-data') {
      const { data: nextData } = value;
      let { index: dropIndex } = value;
      if (dropIndex === MAX_IMAGE_LENGTH) {
        dropIndex -= 1;
      }
      const sumOfRatios = nextData.reduce((accumulator, { attributes: { ratio } }) => accumulator + Number(ratio), 0);
      const [newImage] = nextData.slice(dropIndex, dropIndex + 1);

      // add dropHelper
      const dropHelperWrapperVertical = this.domNode.querySelector('.image-grid-drop-helper-wrapper-vertical');
      this.domNode.querySelector('.image-grid-drop-helper-wrapper-vertical').innerHTML = '';
      for (let i = 0; i <= nextData.length; i++) {
        const dropHelper = document.createElement('div');
        dropHelper.classList.add('image-grid-drop-helper');
        dropHelper.setAttribute('drop-index', i);
        dropHelper.addEventListener('dragenter', () => {
          this.showGuideline(i);
        });
        dropHelper.addEventListener('drop', () => {
          this.hideDropHelper();
        });
        dropHelperWrapperVertical.appendChild(dropHelper);
      }

      // create new image element
      const {
        image: imageSrc,
        attributes: { caption, 'inline-comment': inlineComment },
      } = newImage;

      const imaegGridItemContainer = document.createElement('DIV');

      const imageElement = document.createElement('IMG');
      imageElement.setAttribute('src', this.sanitize(imageSrc));
      imageElement.setAttribute('caption', caption);

      const captionElement = document.createElement('SPAN');
      captionElement.setAttribute('contenteditable', 'true');
      captionElement.setAttribute('spellcheck', 'false');
      captionElement.classList.add('caption');
      if (isDisabled()) {
        captionElement.setAttribute('readonly', true);
      } else {
        captionElement.setAttribute('placeholder', 'Write a caption');
      }
      captionElement.innerText = caption;
      captionElement.addEventListener('click', ev => {
        ev.stopPropagation();
      });
      captionElement.addEventListener('keydown', ev => {
        // Enter, Tab, Escape
        if (ev.keyCode === 13 || ev.keyCode === 9 || ev.keyCode === 27) {
          ev.preventDefault();
        } else {
          // ctrl, cmd, shift, alt, metaKey, backspace, delete 아닌경우, 40자 이상이면 ev.preventDefault();
          ev.stopPropagation();
        }
      });

      imaegGridItemContainer.classList.add('image-grid-item-container', 'ql-img');
      if (inlineComment && inlineComment.length > 0) {
        inlineComment.forEach(commentId => {
          imaegGridItemContainer.classList.add(commentId);
        });
      }
      imaegGridItemContainer.appendChild(imageElement);
      imaegGridItemContainer.appendChild(captionElement);
      imaegGridItemContainer.setAttribute('contenteditable', 'false');

      // insert new image element to ImageGrid
      const imageGridItemWrapper = this.domNode.querySelector('.image-grid-item-wrapper');
      imageGridItemWrapper
        .querySelectorAll('.image-grid-item-container')
        .forEach(imageGridItemContainer => {
          imageGridItemContainer.classList.remove('left', 'right');
        });
      this.domNode
        .querySelector('.image-grid-item-wrapper')
        .insertBefore(
          imaegGridItemContainer,
          imageGridItemWrapper.querySelectorAll(`.image-grid-item-container`)[dropIndex],
        );

      // adjust width
      imageGridItemWrapper
        .querySelectorAll('.image-grid-item-container')
        .forEach((eachImage, i) => {
          const { ratio } = nextData[i].attributes;
          eachImage.style.width = `${(Number(ratio) * 100) / sumOfRatios}%`;
          eachImage.setAttribute('item-index', i);
          eachImage.classList.remove('left', 'right');
        });
      const imageGridItems = imageGridItemWrapper.querySelectorAll('.image-grid-item-container');
      imageGridItems[0].classList.add('left');
      imageGridItems[imageGridItems.length - 1].classList.add('right');
      this.domNode.setAttribute('image-grid-data', JSON.stringify(nextData));
      return;
    } else if (format === 'remove-data') {
      const { data: nextData, index: removeIndex } = value;
      const sumOfRatios = nextData.reduce((accumulator, { attributes: { ratio } }) => accumulator + Number(ratio), 0);

      const imageGridItemWrapper = this.domNode.querySelector('.image-grid-item-wrapper');
      imageGridItemWrapper.querySelectorAll(`.image-grid-item-container`)[removeIndex].remove();
      imageGridItemWrapper
        .querySelectorAll('.image-grid-item-container')
        .forEach((eachImage, i) => {
          const { ratio } = nextData[i].attributes;
          eachImage.style.width = `${(Number(ratio) * 100) / sumOfRatios}%`;
          eachImage.setAttribute('item-index', i);
          eachImage.classList.remove('left', 'right');
        });
      this.domNode.setAttribute('image-grid-data', JSON.stringify(nextData));
      return;
    }
    super.format(format, value);
  }

  showFakeCursor(index = 0) {
    if (!this.scroll.isEnabled()) return;
    const imageGrids = this.scroll.descendants(ImageGrid);
    _.forEach(imageGrids, imageGrid => imageGrid.hideFakeCursor());

    const images = this.scroll.descendants(AdditorImage);
    _.forEach(images, imageGrid => imageGrid.hideFakeCursor());

    const cursor = this.domNode.querySelector('.cursor');
    const { height } = this.domNode.querySelector('.ql-img img').getBoundingClientRect();
    cursor.style.height = `${height}px`;

    let leftPosition = '';
    if (index < 0) {
      leftPosition = `calc(100% + 6px)`;
    } else if (index === 0) {
      leftPosition = `-6px`;
    } else {
      let sumOfWidths = -7;
      this.domNode.querySelectorAll('.ql-img').forEach((img, i) => {
        if (i < index) {
          sumOfWidths += img.getBoundingClientRect().width + 8;
        }
      });
      leftPosition = `${sumOfWidths}px`;
    }

    cursor.style.left = leftPosition;
    cursor.style.height = `${height}px`;
    cursor.style.display = 'block';
    setTimeout(() => {
      cursor.style.animation = 'blinker 1s step-end infinite';
    }, 200);
    const maxCursorOffset = this.domNode.querySelectorAll('.ql-img').length;
    const cursorOffset = index < 0 ? maxCursorOffset : index;
    setTimeout(() => {
      this.scroll.domNode.blur(); // TODO: 이미지 focus된거 있으면 풀어주기
      this.scroll.emitter.once(Emitter.events.SELECTION_CHANGE, () => {
        this.hideFakeCursor();
      });
      this.scroll.emitter.emit(Emitter.events.IMAGE_GRID_FOCUS, {
        blot: this,
        cursorOffset,
        maxCursorOffset,
      });
      document.activeElement && document.activeElement.blur();
    });
  }

  hideFakeCursor() {
    const cursor = this.domNode.querySelector('.cursor');
    cursor.style.display = 'none';
    cursor.style.animation = 'none';
    this.scroll.emitter.emit(Emitter.events.IMAGE_FOCUS, undefined);
    this.scroll.emitter.emit(Emitter.events.IMAGE_GRID_FOCUS, undefined);
  }

  showGuideline(index) {
    const { height } = this.domNode.querySelector('.ql-img img').getBoundingClientRect();

    let leftPosition = '-6px';
    if (index > 0) {
      let sumOfWidths = -6;
      this.domNode.querySelectorAll('.ql-img').forEach((img, i) => {
        if (i < index) {
          sumOfWidths += img.getBoundingClientRect().width + 8;
        }
      });
      leftPosition = `${sumOfWidths}px`;
    }
    const guidelineElement = this.domNode.querySelector('.guideline');
    guidelineElement.style.left = leftPosition;
    guidelineElement.style.height = `${height}px`;
    guidelineElement.style.display = 'block';
  }

  showDropHelper(disableVerticalGiudeline) {
    const dropHelperVertical = this.domNode.querySelector('.image-grid-drop-helper-wrapper-vertical');
    const dropHelperTop = this.domNode.querySelector('.image-grid-drop-helper.top');
    const dropHelper = this.domNode.querySelector('.image-grid-drop-helper-wrapper');
    const { height } = this.domNode.querySelector('.ql-img').getBoundingClientRect();

    if (disableVerticalGiudeline) {
      dropHelperVertical.style.display = 'none';
      dropHelperTop.style.height = `${height}px`;
      dropHelper.style.display = 'block';
      return;
    }
    dropHelperVertical.style.height = `${height}px`;
    dropHelperVertical.style.display = 'flex';
    dropHelperTop.style.height = '30px';
    dropHelper.style.display = 'block';
  }

  hideDropHelper() {
    const guideline = this.domNode.querySelector('.guideline');
    guideline.style.display = 'none';
    const dropHelper = this.domNode.querySelector('.image-grid-drop-helper-wrapper');
    dropHelper.style.display = 'none';
  }
}
ImageGrid.blotName = 'image-grid';
ImageGrid.className = 'image-grid';
ImageGrid.tagName = 'DIV';

function imageGridId() {
  const id = Math.random()
    .toString(36)
    .slice(2, 6);
  return `image-grid-${id}`;
}

export default ImageGrid;
