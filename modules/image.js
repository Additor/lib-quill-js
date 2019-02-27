import Delta from 'quill-delta';
import Quill from '../core/quill';
import Module from '../core/module';
import image from '../formats/imageBlock';

class Image extends Module {
  static register() {
    Quill.register(image);
  }

  constructor(...args) {
    super(...args);
    this.listenImageFocus();
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('touchstart', this.handleMouseDown.bind(this));
    window.addEventListener('keydown', this.handleKeyDownFakeCursor.bind(this));
  }

  handleMouseDown() {
    const fakeCursors = document.querySelectorAll('.ql-img .cursor');
    if (fakeCursors.length > 0) {
      fakeCursors.forEach(cursor => {
        cursor.style.display = 'none';
      });
    }
  }

  handleKeyDownFakeCursor(ev) {
    if (!this.imageFocusData) return;

    const { cursorOffset, blot } = this.imageFocusData;
    const imageIndex = this.quill.getIndex(blot);
    const imageLastIndex = imageIndex + blot.length();
    const quillLength = this.quill.getLength();
    let prevented = false;
    switch (ev.keyCode) { //TODO: shift selection 처리 필요
      case 37: // arrow left
        if (cursorOffset === 0) {
          if (imageIndex > 0) {
            this.quill.setSelection(imageIndex - 1, 0, Quill.sources.USER);
          }
        } else {
          blot.showFakeCursor();
        }
        prevented = true;
        break;
      case 38: // arrow up
        if (imageIndex > 0) {
          if (cursorOffset === 0) {
            const [imageBeforeLine] = this.quill.getLine(imageIndex - 1);
            this.quill.setSelection(this.quill.getIndex(imageBeforeLine), 0, Quill.sources.USER);
          } else {
            this.quill.setSelection(imageIndex - 1, 0, Quill.sources.USER);
          }
        }
        prevented = true;
        break;
      case 39: // arrow right
        if (cursorOffset === 0) {
          blot.showFakeCursor(false);
        } else if (imageLastIndex < quillLength) {
          this.quill.setSelection(imageLastIndex, 0, Quill.sources.USER);
        }
        prevented = true;
        break;
      case 40: // arrow down
        if (imageLastIndex < quillLength - 1) {
          if (cursorOffset === 0) {
            this.quill.setSelection(imageLastIndex, 0, Quill.sources.USER);
          } else {
            const [nextLine] = this.quill.getLine(imageLastIndex);
            this.quill.setSelection(imageLastIndex + nextLine.length() - 1, 0, Quill.sources.USER);
          }
        }
        prevented = true;
        break;
      case 13: // enter
        if (cursorOffset === 0) {
          const delta = new Delta().retain(imageIndex).insert('\n');
          this.quill.updateContents(delta, 'user');
        } else {
          const delta = new Delta().retain(imageLastIndex).insert('\n');
          this.quill.updateContents(delta, 'user');
          this.quill.setSelection(imageLastIndex, 'user');
        }
        prevented = true;
        break;
      case 8: // backspace
        if (cursorOffset === 0) {
          if (imageIndex > 0) {
            const [line] = this.quill.getLine(imageIndex - 1);
            if (line.length() <= 1) {
              line.remove();
            } else {
              this.quill.setSelection(imageIndex - 1, 0, Quill.sources.USER);
            }
          }
        } else {
          blot.remove();
          this.quill.update(Quill.sources.USER);
          this.quill.setSelection(imageIndex, Quill.sources.SILENT);
        }
        prevented = true;
        break;
      case 46: // delete
        if (cursorOffset === 0) {
          this.quill.updateContents(
            new Delta()
              .retain(imageIndex)
              .insert('\n')
              .delete(1),
            Quill.sources.USER,
          );
          this.quill.setSelection(imageIndex, Quill.sources.SILENT);
        } else {
          if (imageLastIndex < quillLength) {
            const [line] = this.quill.getLine(imageIndex + 1);
            if (line.length() <= 1) {
              line.remove();
            } else {
              this.quill.setSelection(imageIndex + 1, 0, Quill.sources.USER);
            }
          }
        }
        break;
      default:
        if (ev.key.length === 1) {
          if (cursorOffset === 0) {
            if (imageIndex === 0) {
              this.quill.updateContents([{ insert: '\n' }]);
            }
            this.quill.setSelection(imageIndex - 1, 0, Quill.sources.USER);
          } else {
            if (imageIndex === quillLength - 1) {
              this.quill.updateContents(
                new Delta()
                  .retain(imageIndex + 1)
                  .insert('\n'),
                Quill.sources.USER,
              );
            }
            this.quill.setSelection(imageIndex + 1, 0, Quill.sources.USER);
          }
        }
    }

    if (prevented) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  listenImageFocus() {
    this.quill.on(Quill.events.IMAGE_FOCUS, data => {
      this.imageFocusData = data;
    });
  }
}

export default Image;
