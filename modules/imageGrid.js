import _ from 'lodash';
import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';

import ImageGridFormat from '../formats/imageGrid';

const SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

class ImageGrid extends Module {
  constructor(...args) {
    super(...args);
    this.listenImageGridFocus();
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('keydown', this.handleKeyDownFakeCursor.bind(this));
  }

  static register() {
    Quill.register(ImageGridFormat);
  }

  handleMouseDown() {
    const fakeCursors = document.querySelectorAll('.image-grid .cursor');
    if (fakeCursors.length > 0) {
      fakeCursors.forEach(cursor => {
        cursor.style.display = 'none';
      });
    }
  }

  handleKeyDownFakeCursor(ev) {
    if (!this.imageGridFocusData) return;

    const { cursorOffset, blot, maxCursorOffset } = this.imageGridFocusData;
    const imageGridIndex = this.quill.getIndex(blot);
    const imageGridLastIndex = imageGridIndex + blot.length();
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
          if (cursorOffset === 0) {
            const [imageBeforeLine] = this.quill.getLine(imageGridIndex - 1);
            this.quill.setSelection(this.quill.getIndex(imageBeforeLine), 0, Quill.sources.USER);
          } else {
            this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
          }
        } else {
          blot.showFakeCursor(0);
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
        if (imageGridLastIndex < quillLength - 1) {
          if (cursorOffset === 0) {
            this.quill.setSelection(imageGridLastIndex, 0, Quill.sources.USER);
          } else {
            const [nextLine] = this.quill.getLine(imageGridLastIndex);
            this.quill.setSelection(
              imageGridLastIndex + nextLine.length() - 1,
              0,
              Quill.sources.USER,
            );
          }
        } else {
          blot.showFakeCursor(maxCursorOffset);
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
          const targetBlotIndex = this.quill.getIndex(blot);
          this.removeImageFromImageGrid(blot, cursorOffset - 1);
          const [afterLine] = this.quill.getLine(targetBlotIndex);
          if (afterLine.statics.blotName === 'image') {
            if (cursorOffset === 1) {
              afterLine.showFakeCursor();
            } else if (cursorOffset === 2) {
              afterLine.showFakeCursor(false);
            }
          } else if (afterLine.statics.blotName === 'image-grid') {
            afterLine.showFakeCursor(cursorOffset - 1);
          }
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
          const targetBlotIndex = this.quill.getIndex(blot);
          this.removeImageFromImageGrid(blot, cursorOffset);
          const [afterLine] = this.quill.getLine(targetBlotIndex);
          if (afterLine.statics.blotName === 'image') {
            if (cursorOffset === 0) {
              afterLine.showFakeCursor();
            } else {
              afterLine.showFakeCursor(false);
            }
          } else if (afterLine.statics.blotName === 'image-grid') {
            afterLine.showFakeCursor(cursorOffset);
          }
        }
        break;
      case 90: // z
        if (ev[SHORTKEY]) {
          if (ev.shiftKey) {
            this.quill.history.redo();
          } else {
            this.quill.history.undo();
          }
          prevented = true;
        }
        break;
      case 89: // y
        if (ev[SHORTKEY]) {
          if (/Win/i.test(navigator.platform)) {
            this.quill.history.redo();
            prevented = true;
          }
        }
        break;
      default:
        if (ev.key.length === 1) {
          if (cursorOffset === 0) {
            if (imageGridIndex === 0) {
              this.quill.updateContents([{ insert: '\n' }]);
            }
            this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
          } else {
            const [nextLine] = this.quill.getLine(imageGridIndex + 1);
            if (
              imageGridIndex === quillLength - 1 ||
              _.includes(nextLine.statics.blotName, 'image')
            ) {
              this.quill.updateContents(
                new Delta()
                  .retain(imageGridIndex + 1)
                  .insert('\n'),
                Quill.sources.USER,
              );
            }
            this.quill.setSelection(imageGridIndex + 1, 0, Quill.sources.USER);
          }
        }
    }
    if (prevented) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  makeOperations(images) {
    const ops = [];
    if (images.length === 1) {
      // AdditorImage
      ops.push({
        image: images[0].image,
      });
      ops.push(images[0].attributes);
    } else {
      // ImageGrid
      ops.push({
        'image-grid': { data: images },
      });
    }
    return ops;
  }

  getDataFromImageGridBlot(imageGridBlot) {
    const {
      'image-grid': { data },
    } = imageGridBlot.delta().ops[0].insert;
    return data;
  }

  insertImageToPrevLine(imageData, targetBlot) {
    const index = this.quill.getIndex(targetBlot);

    const {
      image: imageSrc,
      attributes: { caption, ratio, width, style }
    } = imageData;

    const copiedImageDelta = new Delta().retain(index).insert(
      { image: imageSrc },
      {
        caption,
        ratio,
        width,
        style,
      },
    );
    this.quill.updateContents(copiedImageDelta, 'user');

    // TODO: comment 처리 필요
    // const originImg = originBlot.domNode; // ?코멘트 어케 바뀌나??
    // if (_.toUpper(originImg.parentNode.nodeName) === 'COMMENT') {
    //   // 코멘트가 있는 이미지인 경우 코멘트도 이동시켜준다.
    //   const commentIds = _.toArray(originImg.parentNode.classList);
    //   this.quill.formatText(index, 1, 'inline-comment', commentIds, 'user-comment');
    // }
  }

  insertImageGrid(originBlot, originIndexInBlot, targetImageBlot, dropHelperIndex) {
    let imageGridData = null; // TODO: dropHelperIndex === -1 일때 노드 추가하면서 delete1 해야하는 이유가 뭘까 확인해보기
    if (originBlot.statics.blotName === 'image') {
      let images = null;
      if (dropHelperIndex === -1) { // top: -1

        const { caption, ratio, width, style } = originBlot.formats();
        const { image } = originBlot.value();

        this.insertImageToPrevLine(
          {
            image,
            attributes: { caption, ratio, width, style },
          },
          targetImageBlot,
        );
        // TODO: comment 처리 필요함

        const originBlotIndex = this.quill.getIndex(originBlot);
        const originImageDeleteDelta = new Delta()
          .retain(originBlotIndex)
          .delete(1);
        this.quill.updateContents(originImageDeleteDelta, 'user');
        this.quill.setSelection(null);

        return;
      } else if (dropHelperIndex === 0) {
        images = [originBlot, targetImageBlot];
      } else if (dropHelperIndex === 1) {
        images = [targetImageBlot, originBlot];
      }
      imageGridData = images.map(image => {
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
      const originBlotIndex = this.quill.getIndex(originBlot);
      const originImageDeleteDelta = new Delta()
        .retain(originBlotIndex)
        .delete(1);
      this.quill.updateContents(originImageDeleteDelta, 'user');
    } else if (originBlot.statics.blotName === 'image-grid') { // 지우기
      const prevOriginData = this.getDataFromImageGridBlot(originBlot);
      const nextOriginData = [...prevOriginData];

      const [removedItem] = nextOriginData.splice(originIndexInBlot, 1);
      const targetImageData = {
        image: targetImageBlot.value().image,
        attributes: targetImageBlot.formats(),
      };
      if (dropHelperIndex === -1) {
        this.insertImageToPrevLine(removedItem, targetImageBlot);

        const originBlotIndex = this.quill.getIndex(originBlot);
        const nextOriginOps = this.makeOperations(nextOriginData);
        const originImageDeleteDelta = new Delta()
          .retain(originBlotIndex)
          .delete(1)
          .insert(...nextOriginOps);
        this.quill.updateContents(originImageDeleteDelta, 'user');
        this.quill.setSelection(null);

        return;
      } else if (dropHelperIndex === 0) {
        imageGridData = [removedItem, targetImageData];
      } else if (dropHelperIndex === 1) {
        imageGridData = [targetImageData, removedItem];
      }

      const originBlotIndex = this.quill.getIndex(originBlot);
      const nextOriginOps = this.makeOperations(nextOriginData);
      const originGridUpdatedDelta = new Delta()
        .retain(originBlotIndex)
        .delete(1)
        .insert(...nextOriginOps);

      this.quill.updateContents(originGridUpdatedDelta, 'user');
    }
    const targetImageIndex = this.quill.getIndex(targetImageBlot);
    const newImageGridOps = this.makeOperations(imageGridData);
    const imageGridDelta = new Delta()
      .retain(targetImageIndex)
      .delete(1)
      .insert(...newImageGridOps);
    this.quill.updateContents(imageGridDelta, 'user');
  }

  splitImageGrid(splitCursorIndex) {
    const { blot } = this.imageGridFocusData;
    this.imageGridFocusData = null;

    const originImageGridIndex = this.quill.getIndex(blot);
    const prevData = this.getDataFromImageGridBlot(blot);

    const nextDataLeft = prevData.slice(0, splitCursorIndex);
    const nextDataRight = prevData.slice(splitCursorIndex, prevData.length);

    const nextLeftOps = this.makeOperations(nextDataLeft);
    const nextRightOps = this.makeOperations(nextDataRight);

    if (nextLeftOps.length === 0 || nextRightOps.length === 0) {
      return;
    }

    const updateDelta = new Delta()
      .retain(originImageGridIndex)
      .insert(...nextLeftOps)
      .insert(...nextRightOps)
      .delete(1);
    // this.quill.setSelection(originImageGridIndex, 0, Quill.sources.USER); // TODO: 뒤 이미지의 왼쪽 fakeCursor 보여주기
    this.quill.updateContents(updateDelta, 'user');
  }

  insertImageToImageGrid(targetBlot, newImageBlot, dropIndex) {
    const prevTargetData = this.getDataFromImageGridBlot(targetBlot);
    const nextTargetData = [...prevTargetData];

    const newImageData = {
      image: newImageBlot.value().image,
      attributes: newImageBlot.formats(),
    };
    if (dropIndex === -1) {
      // TODO: comment 처리 필요
      this.insertImageToPrevLine(newImageData, targetBlot);
      newImageBlot.remove();
      return;
    }
    nextTargetData.splice(dropIndex, 0, newImageData);

    const targetBlotIndex = this.quill.getIndex(targetBlot);
    const nextTargetOps = this.makeOperations(nextTargetData);
    const updateDelta = new Delta()
      .retain(targetBlotIndex)
      .insert(...nextTargetOps);
    this.quill.updateContents(updateDelta, 'user');
    targetBlot.remove();
    newImageBlot.remove();
  }

  changeImageSquence(targetBlot, originItemIndex, dropIndex) {
    if (dropIndex === -1) {
      const prevTargetData = this.getDataFromImageGridBlot(targetBlot);
      const nextTargetData = [...prevTargetData];
      const [imageItemWillBeMoved] = nextTargetData.splice(originItemIndex, 1);
      this.insertImageToPrevLine(imageItemWillBeMoved, targetBlot);

      const originImageGridIndex = this.quill.getIndex(targetBlot);
      const nextTargetOps = this.makeOperations(nextTargetData);
      const updateDelta = new Delta()
        .retain(originImageGridIndex)
        .insert(...nextTargetOps);
      this.quill.updateContents(updateDelta, 'user');
      targetBlot.remove();
      return;
    }

    if (
      dropIndex >= originItemIndex &&
      (dropIndex - originItemIndex === 0 || dropIndex - originItemIndex === 1)
    ) {
      return;
    }
    const prevTargetData = this.getDataFromImageGridBlot(targetBlot);
    const nextTargetData = [...prevTargetData];
    const [imageItemWillBeMoved] = nextTargetData.splice(originItemIndex, 1);
    if (dropIndex >= originItemIndex) {
      nextTargetData.splice(dropIndex - 1, 0, imageItemWillBeMoved);
    } else {
      nextTargetData.splice(dropIndex, 0, imageItemWillBeMoved);
    }
    const originImageGridIndex = this.quill.getIndex(targetBlot);
    const nextTargetOps = this.makeOperations(nextTargetData);
    const updateDelta = new Delta()
      .retain(originImageGridIndex)
      .insert(...nextTargetOps);
    this.quill.updateContents(updateDelta, 'user');
    targetBlot.remove();
  }

  insertCommentToImageGrid(targetBlot, commentId, imageIndex) {
    const {
      'image-grid': { data: beforeData },
    } = targetBlot.delta().ops[0].insert;

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

  // grid-grid, grid-text
  removeImageFromImageGrid(originBlot, originIndexInBlot, targetBlot, targetIndexInBlot) {
    const prevOriginData = this.getDataFromImageGridBlot(originBlot);
    const nextOriginData = [...prevOriginData];
    const [removedItem] = nextOriginData.splice(originIndexInBlot, 1);

    const targetBlotIndex = this.quill.getIndex(originBlot);
    const nextOriginOps = this.makeOperations(nextOriginData);
    const updateDelta = new Delta()
      .retain(targetBlotIndex)
      .insert(...nextOriginOps);
    this.quill.updateContents(updateDelta, 'user');
    originBlot.remove();

    if (removedItem && targetBlot) {
      const targetIndex = this.quill.getIndex(targetBlot);
      const { image, attributes } = removedItem;

      if (targetBlot.statics.blotName === 'image-grid') {
        if (targetIndexInBlot === -1) {
          this.insertImageToPrevLine(removedItem, targetBlot);
          return;
        }
        const prevTargetData = this.getDataFromImageGridBlot(targetBlot);
        const nextTargetData = [...prevTargetData];
        nextTargetData.splice(targetIndexInBlot, 0, removedItem);
        const nextTargetOps = this.makeOperations(nextTargetData);
        const gridUpdateDelta = new Delta()
          .retain(targetIndex)
          .insert(...nextTargetOps);
        this.quill.updateContents(gridUpdateDelta, 'user');
        targetBlot.remove();
      } else {
        const imageInsertDelta = new Delta()
          .retain(targetIndex)
          .insert({ image }, attributes);
        this.quill.updateContents(imageInsertDelta, 'user');
      }
    }
  }

  /**
   * drop되었을 때 호출되는 함수
   * @param {object} originBlotInfo
   * @param {object} targetBlotInfo
   */
  handleDrop(originBlotInfo, targetBlotInfo) {
    const { originBlot = null, originIndexInGrid = null } = originBlotInfo;
    const { targetBlot = null, targetIndexInGrid = null } = targetBlotInfo;

    if (targetBlot.statics.blotName === 'image-grid') {
      if (originBlot.statics.blotName === 'image-grid') {
        if (targetBlot === originBlot) {
          this.changeImageSquence(targetBlot, originIndexInGrid, targetIndexInGrid);
        } else {
          this.removeImageFromImageGrid(originBlot, originIndexInGrid, targetBlot, targetIndexInGrid);
        }
      } else if (originBlot.statics.blotName === 'image') {
        this.insertImageToImageGrid(targetBlot, originBlot, targetIndexInGrid);
      } else {
        console.log('이상한걸 그리드에 넣으려고 한다!');
      }
    } else if (targetBlot.statics.blotName === 'image') {
      this.insertImageGrid(originBlot, originIndexInGrid, targetBlot, targetIndexInGrid);
    } else {
      if (originBlot.statics.blotName === 'image-grid') {
        this.removeImageFromImageGrid(originBlot, originIndexInGrid, targetBlot);
      } else if (originBlot.statics.blotName === 'image') {
        // 현재 이미지그리드에서 다른 텍스트라인으로 이동할때만 호출해서 여기로 들어올 일이 없음
        console.log('그냥 예전처럼 이동시켜줘 ')
      }
    }
  }

  listenImageGridFocus() {
    this.quill.on(Quill.events.IMAGE_GRID_FOCUS, data => {
      this.imageGridFocusData = data;
    });
  }
}

export default ImageGrid;
