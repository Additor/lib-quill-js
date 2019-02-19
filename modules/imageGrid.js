import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import _ from 'lodash';

import ImageGridFormat from '../formats/imageGrid';

class ImageGrid extends Module {
  static register() {
    Quill.register(ImageGridFormat);
    // Quill.register('utils/functionName', functionName);
  }

  constructor(...args) {
    super(...args);
    this.listenImageGridFocus();
    window.addEventListener('keydown', this.handleKeyDownFakeCursor.bind(this));
    window.addEventListener('drop', this.handleImageDrop.bind(this));
    window.addEventListener('dragstart', this.handleKeyDownFakeCursor.bind(this));
  }

  handleImageDrop(ev) {

  }

  handleImageDragStart() {
    // image 위치이동 가능해야 함
    // image 밖으로 꺼내는 것 가능해야 함
  }

  handleKeyDownFakeCursor(ev) {
    if (!this.imageGridFocusData) return;

    const { cursorOffset, blot, maxCursorOffset } = this.imageGridFocusData;
    const imageGridIndex = this.quill.getIndex(blot);
    const quillLength = this.quill.getLength();
    let prevented = false;
    switch (ev.keyCode) {
      // TODO: shift selection 처리 필요
      case 37: // arrow left
        if (cursorOffset === 0) {
          if (imageGridIndex > 0) {
            this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
          }
        } else {
          blot.showFakeCursor(cursorOffset - 1);
        }
        prevented = true;
        break;
      case 38: // arrow up
        if (imageGridIndex > 0) {
          this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 39: // arrow right
        if (cursorOffset < maxCursorOffset) {
          blot.showFakeCursor(cursorOffset + 1);
        } else if (imageGridIndex < quillLength) {
          this.quill.setSelection(imageGridIndex + 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 40: // arrow down
        if (imageGridIndex < quillLength) {
          this.quill.setSelection(imageGridIndex + 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 13: // enter
        if (cursorOffset === maxCursorOffset) {
          const delta = new Delta().retain(imageGridIndex + 1).insert('\n');
          this.quill.updateContents(delta, 'user');
          this.quill.setSelection(imageGridIndex + 1, 'user');
        } else if (cursorOffset === 0) {
          const delta = new Delta().retain(imageGridIndex).insert('\n');
          this.quill.updateContents(delta, 'user');
        } else {
          this.splitImageGrid();
          console.log('TODO: 1. 현재 포커스 위치 찾고 2. 이미지/이미지그리드 이미지그리드/이미지 이미지/이미지 셋 중 하나의 형태로 분리한다. 3. 사이에 개행을 추가한다');
        }
        prevented = true;
        break;
      case 8: // backspace
        if (cursorOffset === maxCursorOffset) {
          // TODO: else 케이스에 포함되어야함.. 그리드에서는 블랏 동째로 한꺼번에 지우는건 없음
          blot.remove();
          this.quill.update(Quill.sources.USER);
          this.quill.setSelection(imageGridIndex, Quill.sources.SILENT);
        } else if (cursorOffset === 0) {
          if (imageGridIndex > 0) {
            const [line] = this.quill.getLine(imageGridIndex - 1);
            if (line.length() <= 1) {
              line.remove();
            } else {
              this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
            }
          }
        } else {
          console.log('TODO: 1. 현재 포커스 위치 찾고 2. 왼쪽에 있는 이미지 하나를 지운다 3. 여전히 그리드인지 확인하고 그리드가 더이상 아니게 되면(이미지 길이 하나) 이미지 블랏으로 변경한다.');
        }
        prevented = true;
        break;
      case 46: // delete
        if (cursorOffset === maxCursorOffset) {
          if (imageGridIndex < quillLength) {
            const [line] = this.quill.getLine(imageGridIndex + 1);
            if (line.length() <= 1) {
              line.remove();
            } else {
              this.quill.setSelection(imageGridIndex + 1, 0, Quill.sources.USER);
            }
          }
        } else if (cursorOffset === 0) {
          // TODO: else 케이스에 포함되어야 함.. 그리드에서는 블랏 통째로 한꺼번에 지우는 것 없음.
          blot.remove();
          this.quill.update(Quill.sources.USER);
          this.quill.setSelection(imageGridIndex, Quill.sources.SILENT);
        } else {
          console.log('TODO: 1. 현재 포커스 위치 찾고 2. 오른쪽에 있는 이미지 하나를 지운다 3. 여전히 그리드인지 확인하고 그리드가 더이상 아니게 되면(이미지 길이 하나) 이미지 블랏으로 변경한다.');
        }
        break;
      default:
    }
    if (prevented) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  insertImageGrid(originBlot, targetImageBlot, isLeft) {
    let images = null;

    if (isLeft) {
      images = [originBlot, targetImageBlot];
    } else {
      images = [targetImageBlot, originBlot];
    }

    const imageGridData = images.map(image => {
      const url = image.domNode.querySelector('IMG').getAttribute('src');
      return {
        image: url,
        attributes: image.formats(),
      };
    });

    const originImageIndex = this.quill.getIndex(originBlot);
    const targetImageIndex = this.quill.getIndex(targetImageBlot);
    const imageGridDelta = new Delta()
      .retain(targetImageIndex)
      .insert(
        {
          'image-grid': {
            data: imageGridData,
          },
        },
        {},
      )
      .delete(2);
    this.quill.updateContents(imageGridDelta, 'user');
  }

  splitImageGrid(splitCursorIndex) {
    // delta() data 꺼내와서 clone 후 splice
    // 길이 하나이면 Image delta 만들고, 2개이상이면 grid 만든다
  }

  // insertImageToImageGrid() {
  // }

  // removeImageFromImageGrid() {
  // }

  listenImageGridFocus() {
    this.quill.on(Quill.events.IMAGE_GRID_FOCUS, data => {
      this.imageGridFocusData = data;
    });
  }
}

export default ImageGrid;
