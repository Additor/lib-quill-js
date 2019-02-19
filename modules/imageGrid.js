import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import _ from 'lodash';

import ImageGridFormat from '../formats/imageGrid';

class ImageGrid extends Module {
  static register() {
    Quill.register(ImageGridFormat);
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
          if (imageGridIndex > 0) { // TODO: 앞에있는놈이 이미지인경우 처리 필요
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
          this.splitImageGrid(cursorOffset);
        }
        prevented = true;
        break;
      case 8: // backspace
        if (cursorOffset === 0) {
          if (imageGridIndex > 0) {
            const [line] = this.quill.getLine(imageGridIndex - 1);
            if (line.length() <= 1) {
              line.remove();
            } else {
              this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
            }
          }
        } else {
          this.removeImageFromImageGrid(blot, cursorOffset - 1);
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
        } else {
          this.removeImageFromImageGrid(blot, cursorOffset);
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

    const targetImageIndex = this.quill.getIndex(targetImageBlot);
    const imageGridDelta = new Delta().retain(targetImageIndex).insert(
      {
        'image-grid': {
          data: imageGridData,
        },
      },
      {},
    );
    originBlot.remove();
    targetImageBlot.remove();
    this.quill.updateContents(imageGridDelta, 'user');
  }

  makeDelta(images) {
    const delta = [];
    if (images.length === 1) {
      // AdditorImage
      delta.push({
        image: images[0].image,
      });
      delta.push(images[0].attributes);
    } else {
      // ImageGrid
      delta.push({
        'image-grid': { data: images },
      });
    }
    return delta;
  }

  splitImageGrid(splitCursorIndex) {
    const { blot } = this.imageGridFocusData;

    const originImageGridIndex = this.quill.getIndex(blot);
    const {
      'image-grid': { data: beforeData },
    } = blot.delta().ops[0].insert;

    const dataLeft = beforeData.slice(0, splitCursorIndex);
    const dataRight = beforeData.slice(splitCursorIndex, beforeData.length);

    const deltaLeft = this.makeDelta(dataLeft);
    const deltaRight = this.makeDelta(dataRight);

    if (deltaLeft.length === 0 || deltaRight.length === 0) {
      return;
    }

    const updateDelta = new Delta()
      .retain(originImageGridIndex)
      .insert(...deltaLeft)
      .insert('\n') // image이면 넣고 imageGrid이면 넣지않아야함
      .insert(...deltaRight)
      .insert('\n');
    blot.remove();
    this.quill.setSelection(originImageGridIndex, 0, Quill.sources.USER); // TODO: 뒤 이미지의 왼쪽 fakeCursor 보여주기
    this.quill.updateContents(updateDelta, 'user');
  }

  insertImageToImageGrid(targetBlot, newImageBlot, dropIndex) {
    const {
      'image-grid': { data: beforeData },
    } = targetBlot.delta().ops[0].insert;

    const afterData = [...beforeData];

    const newImageData = {
      image: newImageBlot.domNode.querySelector('IMG').getAttribute('src'),
      attributes: newImageBlot.formats(),
    };

    afterData.splice(dropIndex, 0, newImageData);

    const originImageGridIndex = this.quill.getIndex(targetBlot);
    const updateDelta = new Delta().retain(originImageGridIndex).insert({
      'image-grid': {
        data: afterData,
      },
    });
    targetBlot.remove();
    newImageBlot.remove();
    this.quill.updateContents(updateDelta, 'user');
  }

  changeImageSquence(targetBlot, originItemIndex, dropIndex) {
    if (
      dropIndex >= originItemIndex &&
      (dropIndex - originItemIndex === 0 || dropIndex - originItemIndex === 1)
    ) {
      // 00, 01, 11, 12, 22, 23
      return;
    }

    const {
      'image-grid': { data: beforeData },
    } = targetBlot.delta().ops[0].insert;

    const afterData = [...beforeData];

    const [imageItemWillBeMoved] = afterData.splice(originItemIndex, 1);

    if (dropIndex >= originItemIndex) {
      afterData.splice(dropIndex - 1, 0, imageItemWillBeMoved);
    } else {
      afterData.splice(dropIndex, 0, imageItemWillBeMoved);
    }

    const originImageGridIndex = this.quill.getIndex(targetBlot);
    const updateDelta = new Delta().retain(originImageGridIndex).insert({
      'image-grid': {
        data: afterData,
      },
    });
    targetBlot.remove();
    this.quill.updateContents(updateDelta, 'user');
  }

  removeImageFromImageGrid(imageGridBlot, removeIndex, pasteTargetBlot) {
    const {
      'image-grid': { data: beforeData },
    } = imageGridBlot.delta().ops[0].insert;

    const afterData = [...beforeData];
    const [removedItem] = afterData.splice(removeIndex, 1);

    const targetBlotIndex = this.quill.getIndex(imageGridBlot);

    if (afterData.length > 1) {
      const updateDelta = new Delta().retain(targetBlotIndex).insert({
        'image-grid': {
          data: afterData,
        },
      });
      imageGridBlot.remove();
      this.quill.updateContents(updateDelta, 'user');
    } else {
      const { image, attributes } = afterData[0];
      const updateDelta = new Delta()
        .retain(targetBlotIndex)
        .insert({ image }, attributes)
        .insert('\n');
      imageGridBlot.remove();
      this.quill.updateContents(updateDelta, 'user');
    }

    if (removedItem && pasteTargetBlot) {
      const targetIndex = this.quill.getIndex(pasteTargetBlot);
      const { image, attributes } = removedItem;
      const imageInsertDelta = new Delta()
        .retain(targetIndex)
        .insert({ image }, attributes)
        .insert('\n');
      this.quill.updateContents(imageInsertDelta, 'user');
    }
    // this.quill.setSelection(index, 0, Quill.sources.USER); // TODO: 키보드로 지운 경우 기존 커서 유지해줘야함... (fakeCursor인경우에는?)
  }

  listenImageGridFocus() {
    this.quill.on(Quill.events.IMAGE_GRID_FOCUS, data => {
      this.imageGridFocusData = data;
    });
  }
}

export default ImageGrid;
