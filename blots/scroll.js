import { Scope, ScrollBlot, ContainerBlot } from 'parchment';
import _ from 'lodash';
import Emitter from '../core/emitter';
import Block, { BlockEmbed } from './block';
import Break from './break';
import Container from './container';

function isLine(blot) {
  return blot instanceof Block || blot instanceof BlockEmbed;
}

class Scroll extends ScrollBlot {
  constructor(registry, domNode, { emitter }) {
    super(registry, domNode);
    this.emitter = emitter;
    // Some reason fixes composition issues with character languages in Windows/Chrome, Safari
    this.domNode.addEventListener('DOMNodeInserted', () => {});
    this.domNode.addEventListener('compositionstart', () => {
      this.composing = true;
    });
    this.domNode.addEventListener('compositionupdate', () => {
      this.composing = true;
    });
    this.domNode.addEventListener('compositionend', () => {
      this.composing = false;
    });
    this.domNode.addEventListener('keydown', e => {
      if (e.key !== 'Enter') this.composing = false;
      else {
        setTimeout(() => {
          this.composing = false;
        });
      }
    });
    this.optimize();
    this.enable();
  }

  batchStart() {
    this.batch = true;
  }

  batchEnd() {
    this.batch = false;
    this.optimize();
  }

  emitMount(blot) {
    this.emitter.emit(Emitter.events.SCROLL_BLOT_MOUNT, blot);
  }

  emitUnmount(blot) {
    this.emitter.emit(Emitter.events.SCROLL_BLOT_UNMOUNT, blot);
  }

  deleteAt(index, length) {
    const [first, offset] = this.line(index);
    const [last] = this.line(index + length);
    super.deleteAt(index, length);
    if (last != null && first !== last && offset > 0) {
      if (first instanceof BlockEmbed || last instanceof BlockEmbed) {
        this.optimize();
        return;
      }
      const ref =
        last.children.head instanceof Break ? null : last.children.head;
      first.moveChildren(last, ref);
      first.remove();
    }
    this.optimize();
  }

  enable(enabled = true) {
    this.domNode.setAttribute('contenteditable', enabled);
  }

  formatAt(index, length, format, value) {
    super.formatAt(index, length, format, value);
    this.optimize();
  }

  insertAt(index, value, def) {
    if (index >= this.length()) {
      if (def == null || this.scroll.query(value, Scope.BLOCK) == null) {
        const blot = this.scroll.create(this.statics.defaultChild.blotName);
        this.appendChild(blot);
        if (def == null && value.endsWith('\n')) {
          blot.insertAt(0, value.slice(0, -1), def);
        } else {
          blot.insertAt(0, value, def);
        }
      } else {
        const embed = this.scroll.create(value, def);
        this.appendChild(embed);
      }
    } else {
      super.insertAt(index, value, def);
    }
    this.optimize();
  }

  insertBefore(blot, ref) {
    if (blot.statics.scope === Scope.INLINE_BLOT) {
      const wrapper = this.scroll.create(this.statics.defaultChild.blotName);
      wrapper.appendChild(blot);
      super.insertBefore(wrapper, ref);
    } else {
      super.insertBefore(blot, ref);
    }
  }

  isEnabled() {
    return this.domNode.getAttribute('contenteditable') === 'true';
  }

  leaf(index) {
    return this.path(index).pop() || [null, -1];
  }

  line(index) {
    if (index === this.length()) {
      return this.line(index - 1);
    }
    return this.descendant(isLine, index);
  }

  lines(index = 0, length = Number.MAX_VALUE) {
    const getLines = (blot, blotIndex, blotLength) => {
      let lines = [];
      let lengthLeft = blotLength;
      blot.children.forEachAt(
        blotIndex,
        blotLength,
        (child, childIndex, childLength) => {
          if (isLine(child)) {
            lines.push(child);
          } else if (child instanceof ContainerBlot) {
            lines = lines.concat(getLines(child, childIndex, lengthLeft));
          }
          lengthLeft -= childLength;
        },
      );
      return lines;
    };
    return getLines(this, index, length);
  }

  optimize(mutations = [], context = {}) {
    if (this.batch === true) return;
    super.optimize(mutations, context);
    if (mutations.length > 0) {
      this.emitter.emit(Emitter.events.SCROLL_OPTIMIZE, mutations, context);
    }
  }

  path(index) {
    return super.path(index).slice(1); // Exclude self
  }

  remove() {
    // Never remove self
  }

  update(mutations) {
    if (this.batch === true) return;
    let source = Emitter.sources.USER;
    if (typeof mutations === 'string') {
      source = mutations;
    }
    if (!Array.isArray(mutations)) {
      mutations = this.observer.takeRecords();
    }

    const domControlError = _.some(mutations, mutation => {
      let error = false;
      if (!_.isEmpty(mutation.removedNodes)) {
        const removedNode = mutation.removedNodes[0];
        if (removedNode.nodeName === '#text') {
          if (removedNode.nodeValue) {
            error = true;
          }
        } else if (_.get(removedNode, 'childNodes[0].nodeName') === '#text') {
          if (_.get(removedNode, 'childNodes[0].nodeValue')) {
            error = true;
          }
        }
      }
      return error;
    });

    const isCharacterData = _.some(mutations, mutation => mutation.type === 'characterData');

    if (domControlError && !isCharacterData) {
      // dom 조작으로 인해 노트의 내용이 사라진 경우, scroll-error 이벤트를 emit 한다.
      // characterData 가 존재하는 경우 유저가 조작한 케이스이므로 그 상황은 예외로 처리한다.
      this.emitter.emit(Emitter.events.SCROLL_ERROR, source, mutations);
      return;
    }

    if (mutations.length > 0) {
      this.emitter.emit(Emitter.events.SCROLL_BEFORE_UPDATE, source, mutations);
    }
    super.update(mutations.concat([])); // pass copy
    if (mutations.length > 0) {
      this.emitter.emit(Emitter.events.SCROLL_UPDATE, source, mutations);
    }
  }
}
Scroll.blotName = 'scroll';
Scroll.className = 'ql-editor';
Scroll.tagName = 'DIV';
Scroll.defaultChild = Block;
Scroll.allowedChildren = [Block, BlockEmbed, Container];

export default Scroll;
