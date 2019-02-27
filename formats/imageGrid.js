import _ from 'lodash';
import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';
import { BlockEmbed } from '../blots/block';

const MAX_IMAGE_LENGTH = 3;

class ImageGrid extends BlockEmbed {
  constructor(scroll, domNode) {
    super(scroll, domNode);
    domNode.setAttribute('id', imageGridId());
  }

  static create(value) {
    const node = super.create();
    const { data } = value;
    node.setAttribute('image-grid-data', JSON.stringify(data));

    const cursor = document.createElement('div');
    cursor.classList.add('vertical-bar', 'cursor');
    node.appendChild(cursor);

    const guideline = document.createElement('div');
    guideline.classList.add('vertical-bar', 'guideline');
    node.appendChild(guideline);

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
    node.appendChild(dropHelperWrapper);

    const imageGridItemWrapper = document.createElement('div');
    imageGridItemWrapper.classList.add('image-grid-item-wrapper');

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

      const captionElement = document.createElement('input');
      captionElement.setAttribute('type', 'text');
      captionElement.setAttribute('maxlength', '40');
      captionElement.setAttribute('placeholder', 'Write a caption');
      captionElement.setAttribute('spellcheck', 'false');
      captionElement.classList.add('caption');
      captionElement.value = caption;
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

    imageGridItemWrapper.firstElementChild.classList.add('left');
    imageGridItemWrapper.lastElementChild.classList.add('right');
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

  static getMaxLength() {
    return MAX_IMAGE_LENGTH;
  }

  value() {
    const imageGridItemWrapper = this.domNode.querySelector('.image-grid-item-wrapper');
    if (!imageGridItemWrapper.onclick) {
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

  showFakeCursor(index = 0) {
    this.hideFakeCursor();
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
    });
  }

  hideFakeCursor() {
    const cursor = this.domNode.querySelector('.cursor');
    cursor.style.display = 'none';
    cursor.style.animation = 'none';
    this.scroll.emitter.emit(Emitter.events.IMAGE_GRID_FOCUS, undefined);
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
