import _ from 'lodash';
import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';

import ImageGridFormat from '../formats/imageGrid';
import AdditorImage from "../formats/imageBlock";

const SHORT_KEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

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
          if (imageGridIndex > 0) {
            const [beforeLine] = this.quill.getLine(imageGridIndex - 1);
            if (beforeLine) {
              blot.hideFakeCursor();
              if (beforeLine.statics.blotName === 'image-grid') {
                beforeLine.showFakeCursor(-1);
              } else if (beforeLine.statics.blotName === 'image') {
                beforeLine.showFakeCursor(false);
              } else {
                this.quill.setSelection(
                  imageGridIndex - 1,
                  0,
                  Quill.sources.USER,
                );
              }
            }
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
        } else if (imageGridLastIndex < quillLength) {
          blot.hideFakeCursor();
          this.quill.setSelection(imageGridIndex + 1, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 40: // arrow down
        if (imageGridLastIndex < quillLength) {
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
          this.quill.component.forceUpdate();
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
            this.quill.component.forceUpdate();
          }
        } else {
          const targetBlotIndex = this.quill.getIndex(blot);
          this.removeImageFromImageGrid(blot, cursorOffset - 1);
          const [afterLine] = this.quill.getLine(targetBlotIndex);
          setTimeout(() => {
            if (afterLine.statics.blotName === 'image') {
              if (cursorOffset === 1) {
                afterLine.showFakeCursor();
              } else if (cursorOffset === 2) {
                afterLine.showFakeCursor(false);
              }
            } else if (afterLine.statics.blotName === 'image-grid') {
              afterLine.showFakeCursor(cursorOffset - 1);
            }
          }, 150);
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
          setTimeout(() => {
            if (afterLine.statics.blotName === 'image') {
              if (cursorOffset === 0) {
                afterLine.showFakeCursor();
              } else if (cursorOffset === 1) {
                afterLine.showFakeCursor();
              } else if (cursorOffset === 2) {
                afterLine.showFakeCursor(false);
              }
            } else if (afterLine.statics.blotName === 'image-grid') {
              afterLine.showFakeCursor(cursorOffset);
            }
          }, 150);
        }
        break;
      case 90: // z
        if (ev[SHORT_KEY]) {
          if (ev.shiftKey) {
            this.quill.history.redo();
          } else {
            this.quill.history.undo();
          }
          prevented = true;
        }
        break;
      case 89: // y
        if (ev[SHORT_KEY]) {
          if (/Win/i.test(navigator.platform)) {
            this.quill.history.redo();
            prevented = true;
          }
        }
        break;
      default:
        if (ev.key.length === 1) {
          if (cursorOffset === 0) {
            const [beforeLine] = this.quill.getLine(imageGridIndex - 1);
            const needNewLine = !!(
              (imageGridIndex === 0) ||
              (beforeLine && beforeLine.statics.blotName === 'image-grid') ||
              (beforeLine && beforeLine.statics.blotName === 'image')
            );

            if (needNewLine) {
              if (imageGridIndex === 0) {
                this.quill.updateContents([{ insert: '\n' }]);
              } else {
                this.quill.updateContents([
                  { retain: imageGridIndex },
                  { insert: '\n' },
                ]);
              }
              this.quill.setSelection(imageGridIndex, 0, Quill.sources.USER);
            } else {
              this.quill.setSelection(imageGridIndex - 1, 0, Quill.sources.USER);
            }
          } else {
            const [nextLine] = this.quill.getLine(imageGridIndex + 1);
            const needNewLine = !!(
              imageGridIndex === quillLength - 1 ||
              (nextLine && nextLine.statics.blotName === 'image-grid') ||
              (nextLine && nextLine.statics.blotName === 'image')
            );

            if (needNewLine) {
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
      image,
      attributes,
    } = imageData;
    const copiedImageDelta = new Delta()
      .retain(index)
      .insert(
        {
          image,
        },
        {
          caption: attributes.caption,
          ratio: attributes.ratio,
          width: attributes.width,
          style: attributes.style,
          'inline-comment': attributes['inline-comment'],
          'create-animation': 'fade-in-and-scale-up',
        },
      );
    this.quill.updateContents(copiedImageDelta, 'user');
  }

  shrink(targetNode, beforeShrink, afterShrink) {
    if (beforeShrink && typeof beforeShrink === 'function') {
      beforeShrink();
    }
    targetNode.addEventListener('animationend', () => {
      if (afterShrink && typeof afterShrink === 'function') {
        afterShrink();
      }
    });
    targetNode.classList.add('fade-out-and-scale-down');
  }

  insertImageGrid(originBlot, originIndexInBlot, targetImageBlot, dropHelperIndex) {
    let imageGridData = null; // TODO: dropHelperIndex === -1 일때 노드 추가하면서 delete1 해야하는 이유가 뭘까 확인해보기
    if (originBlot.statics.blotName === 'image') {
      let images = null;
      if (dropHelperIndex === -1) { // top: -1
        const { image } = originBlot.value();

        this.insertImageToPrevLine(
          {
            image,
            attributes: originBlot.formats(),
          },
          targetImageBlot,
        );

        this.shrink(
          originBlot.domNode.querySelector('img'),
          () => {
            originBlot.domNode.querySelector('.caption').style.display = 'none';
          },
          () => {
            const originBlotIndex = this.quill.getIndex(originBlot);
            const originImageDeleteDelta = new Delta()
              .retain(originBlotIndex)
              .delete(1);
            this.quill.updateContents(originImageDeleteDelta, 'user');
            this.quill.setSelection(null);
          },
        );
        return;
      } else if (dropHelperIndex === 0) {
        images = [originBlot, targetImageBlot];
      } else if (dropHelperIndex === 1) {
        images = [targetImageBlot, originBlot];
      } else {
        console.error('dropHelperIndex error: ', dropHelperIndex);
        return;
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
      this.shrink(
        originBlot.domNode.querySelector('img'),
        () => {
          originBlot.domNode.querySelector('.caption').style.display = 'none';
        },
        () => {
          const originBlotIndex = this.quill.getIndex(originBlot);
          const originImageDeleteDelta = new Delta()
            .retain(originBlotIndex)
            .delete(1);
          this.quill.updateContents(originImageDeleteDelta, 'user');
        },
      );
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
        if (nextOriginData.length === 1) {
          // image-grid -> image blot 변경됨
          const nextOriginOps = this.makeOperations(nextOriginData);
          const originImageDeleteDelta = new Delta()
            .retain(originBlotIndex)
            .delete(1)
            .insert(...nextOriginOps);
          this.quill.updateContents(originImageDeleteDelta, 'user');
          this.quill.setSelection(null);
        } else {
          this.quill.formatText(
            originBlotIndex,
            1,
            'remove-data',
            {
              index: originIndexInBlot,
              data: nextOriginData,
            },
            'user',
          );
        }
        return;
      } else if (dropHelperIndex === 0) {
        imageGridData = [removedItem, targetImageData];
      } else if (dropHelperIndex === 1) {
        imageGridData = [targetImageData, removedItem];
      }

      if (originBlot.scroll === targetImageBlot.scroll) {
        const originBlotIndex = this.quill.getIndex(originBlot);
        if (nextOriginData.length === 1) {
          const nextOriginOps = this.makeOperations(nextOriginData);
          const originGridUpdatedDelta = new Delta()
            .retain(originBlotIndex)
            .delete(1)
            .insert(...nextOriginOps);
          this.quill.updateContents(originGridUpdatedDelta, 'user');
        } else {
          this.quill.formatText(
            originBlotIndex,
            1,
            'remove-data',
            {
              index: originIndexInBlot,
              data: nextOriginData,
            },
            'user',
          );
        }
      }
    }
    const targetImageIndex = this.quill.getIndex(targetImageBlot);
    const newImageGridOps = this.makeOperations(imageGridData);
    const imageGridDelta = new Delta()
      .retain(targetImageIndex)
      .delete(1)
      .insert(...newImageGridOps, {
        'created-data': {
          index: dropHelperIndex,
          animation: 'fade-in-and-scale-up',
        },
      });
    this.quill.updateContents(imageGridDelta, 'user');
    this.forceComponentUpdateAfterTransition();
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

    const updateDelta = new Delta().retain(originImageGridIndex).delete(1);
    updateDelta.insert(...nextLeftOps);
    updateDelta.insert(...nextRightOps);

    this.quill.updateContents(updateDelta, 'user');
    this.quill.setSelection(originImageGridIndex + 1, 0, Quill.sources.USER);
    this.forceComponentUpdateAfterTransition();
  }

  insertImageToImageGrid(targetBlot, newImageBlot, dropIndex) {
    const prevTargetData = this.getDataFromImageGridBlot(targetBlot);
    if (prevTargetData.length > 2 && dropIndex > -1) return;
    const nextTargetData = [...prevTargetData];

    let newImageData;
    if (newImageBlot instanceof AdditorImage) {
      newImageData = {
        image: newImageBlot.value().image,
        attributes: newImageBlot.formats(),
      };
    } else {
      newImageData = newImageBlot;
    }

    if (dropIndex === -1) {
      this.insertImageToPrevLine(newImageData, targetBlot);
      if (newImageBlot.domNode) {
        this.shrink(
          newImageBlot.domNode.querySelector('img'),
          () => {
            newImageBlot.domNode.querySelector('.caption').style.display = 'none';
          },
          () => {
            newImageBlot.remove();
          },
        );
      }
      return;
    }
    nextTargetData.splice(dropIndex, 0, newImageData);

    const targetBlotIndex = this.quill.getIndex(targetBlot);

    this.quill.formatText(
      targetBlotIndex,
      1,
      'add-data',
      {
        index: dropIndex,
        data: nextTargetData,
      },
      'user',
    );

    if (newImageBlot.domNode) {
      this.shrink(
        newImageBlot.domNode.querySelector('img'),
        () => {
          newImageBlot.domNode.querySelector('.caption').style.display = 'none';
        },
        () => {
          newImageBlot.remove();
        },
      );
    }
    this.forceComponentUpdateAfterTransition();
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
    this.quill.updateContents(updateDelta, 'user-comment');
  }

  // grid-grid, grid-text
  removeImageFromImageGrid(originBlot, originIndexInBlot, targetBlot, targetIndexInBlot) {
    const prevOriginData = this.getDataFromImageGridBlot(originBlot);
    const nextOriginData = [...prevOriginData];
    const [removedItem] = nextOriginData.splice(originIndexInBlot, 1);

    const originBlotIndex = this.quill.getIndex(originBlot);
    const updateDelta = new Delta();
    if (nextOriginData.length === 1) { // nextOriginData is image
      const nextOriginOps = this.makeOperations(nextOriginData);
      updateDelta
        .retain(originBlotIndex)
        .delete(1)
        .insert(...nextOriginOps)
        .insert('\n');
      this.quill.updateContents(updateDelta, 'user');
    } else {
      this.quill.formatText(
        originBlotIndex,
        1,
        'remove-data',
        {
          index: originIndexInBlot,
          data: nextOriginData,
        },
        'user',
      );
    }

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

        this.quill.formatText(
          targetIndex,
          1,
          'add-data',
          {
            index: targetIndexInBlot,
            data: nextTargetData,
          },
          'user',
        );
      } else {
        const newAttributes = _.cloneDeep(attributes);
        newAttributes['create-animation'] = 'fade-in-and-scale-up';
        const imageInsertDelta = new Delta()
          .retain(targetIndex)
          .insert({ image }, newAttributes);
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

  forceComponentUpdateAfterTransition() {
    setTimeout(() => {
      this.quill.component.forceUpdate();
    }, 300);
  }
}

export default ImageGrid;
