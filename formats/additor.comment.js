import _ from 'lodash';
import Inline from '../blots/inline';

class InlineComment extends Inline {
  static create(value) {
    const node = super.create(value);
    if (_.isArray(value)) {
      _.forEach(value, className => {
        const formatted = InlineComment.formatClass(className);
        if (!node.classList.contains(formatted)) {
          node.classList.add(formatted);
        }
      });
    } else if (value.cid) {
      const formatted = InlineComment.formatClass(value.cid);
      node.classList.add(formatted);
    }
    return node;
  }
  static formats(domNode) {
    return _.toArray(domNode.classList); // 초기 렌더링 시 호출
  }
  static formatClass(className) {
    return _.startsWith(className, 'comment_') ? className : 'comment_' + className;
  }
  format(name, value) {
    if (name === 'inline-comment' && value) {
      if (_.isArray(value)) {
        // 초기 렌더링 시
        this.domNode.classList = [];
        _.forEach(value, className => {
          const formatted = InlineComment.formatClass(className);
          this.domNode.classList.add(formatted);
        });
      } else if (value.cid) {
        // formatText 호출 시
        const formatted = InlineComment.formatClass(value.cid);
        this.domNode.classList.add(formatted);
      }
    } else {
      super.format(name, value);
    }
  }
}

InlineComment.tagName = 'comment';
InlineComment.blotName = 'inline-comment';

export default InlineComment;
