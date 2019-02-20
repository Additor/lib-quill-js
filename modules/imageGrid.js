import _ from 'lodash';
import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';

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
          this.splitImageGrid(cursorOffset);
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
      const imageNode = image.domNode.querySelector('IMG');
      const url = imageNode.getAttribute('src');
      const imageData = {
        image: url,
        attributes: image.formats(),
      };

      const imgCommentIds = _.filter(
        image.domNode.parentNode.classList,
        className => _.includes(className, 'comment_'),
      );

      if (!_.isEmpty(imgCommentIds)) {
        imageData.attributes['inline-comment'] = imgCommentIds;
      }

      return imageData;
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

  // deleteAndSplitImageGrid(dropPositionIndex, blotWillBeRemoved) {
  //   console.log('insertHere!!', dropPositionIndex);
  //   console.log('delete!!', blotWillBeRemoved);
  // }

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
      .insert('\n')
      .insert(...deltaRight)
      .insert('\n');
    blot.remove();
    this.quill.updateContents(updateDelta, 'user');
    // TODO: 앞 이미지의 fakeCursor 보여주기
  }

  insertImageToImageGrid(targetBlot, newImageBlot, dropedPositionIndex) {
    const {
      'image-grid': { data: beforeData },
    } = targetBlot.delta().ops[0].insert;

    const newImageData = {
      image: newImageBlot.domNode.querySelector('IMG').getAttribute('src'),
      attributes: newImageBlot.formats(),
    };
    const originImageGridIndex = this.quill.getIndex(targetBlot);

    const dataLeft = beforeData.slice(0, dropedPositionIndex);
    const dataRight = beforeData.slice(dropedPositionIndex, beforeData.length);

    const afterData = [...dataLeft, newImageData, ...dataRight];

    const updateDelta = new Delta().retain(originImageGridIndex).insert({
      'image-grid': {
        data: afterData,
      },
    });
    targetBlot.remove();
    newImageBlot.remove();
    this.quill.updateContents(updateDelta, 'user');
  }

  insertCommentToImageGrid(targetBlot, commentId, imageIndex) {
    const {
      'image-grid': { data: beforeData },
    } = targetBlot.delta().ops[0].insert;
    debugger;

    const imageGridIndex = this.quill.getIndex(targetBlot);
    const afterData = [...beforeData];
    if (_.isEmpty(afterData[imageIndex].attributes['inline-comment'])) {
      afterData[imageIndex].attributes['inline-comment'] = [
        `comment_${commentId}`,
      ];
    } else {
      afterData[imageIndex].attributes['inline-comment'].push(
        `comment_${commentId}`,
      );
    }
    const updateDelta = new Delta()
      .retain(imageGridIndex)
      .delete(1)
      .insert({
        'image-grid': {
          data: afterData,
        },
      });
    this.quill.updateContents(updateDelta, 'user');
  }

  // removeImageFromImageGrid() {
  // }

  listenImageGridFocus() {
    this.quill.on(Quill.events.IMAGE_GRID_FOCUS, data => {
      this.imageGridFocusData = data;
    });
  }
}

export default ImageGrid;
