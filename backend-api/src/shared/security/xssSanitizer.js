const sanitizeHtml = require('sanitize-html');

/**
 * Lọc sạch mã độc XSS từ dữ liệu nhập vào của WYSIWYG Editor
 * Cho phép các thẻ định dạng văn bản an toàn nhưng loại bỏ hoàn toàn <script>, <iframe>, thuộc tính inline sự kiện (onload, onerror)
 */
const sanitizeContent = (dirtyHtml) => {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') return '';

  return sanitizeHtml(dirtyHtml, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'class'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      table: ['class'],
      th: ['class'],
      td: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  });
};

module.exports = {
  sanitizeContent
};
