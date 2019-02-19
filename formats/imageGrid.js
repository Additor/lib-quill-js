import { sanitize } from '../formats/link';
import Emitter from '../core/emitter';
import Quill from '../core/quill';
import { BlockEmbed } from '../blots/block';

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

    const imageGridItemWrapper = document.createElement('div');
    imageGridItemWrapper.classList.add('image-grid-item-wrapper');

    const sumOfRatios = data.reduce((accumulator, { attributes: { ratio } }) => accumulator + Number(ratio), 0);

    data.forEach(eachImageData => {
      const {
        image: imageSrc,
        attributes: { ratio, caption },
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
      imaegGridItemContainer.appendChild(imageElement);
      imaegGridItemContainer.appendChild(captionElement);
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

  showFakeCursor(index = 0) {
    const cursor = this.domNode.querySelector('.cursor');
    const { height } = this.domNode.querySelector('.ql-img img').getBoundingClientRect();
    cursor.style.height = `${height}px`;

    let leftPosition = '';
    if (index < 0) {
      leftPosition = `calc(100% + 5px)`;
    } else {
      let sumOfWidths = -5;
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

    const maxCursorOffset = this.domNode.querySelectorAll('.ql-img').length;
    const cursorOffset = index < 0 ? maxCursorOffset : index;
    setTimeout(() => {
      this.scroll.domNode.blur();
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
    this.scroll.emitter.emit(Emitter.events.IMAGE_GRID_FOCUS, undefined);
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
