"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function toBoolean(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return false;
    }
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            value = toBoolean(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (/^[ \t]*(true|yes|1)[ \t]*$/i.test(value)) {
            return true;
        }
        if (/^[ \t]*(false|no|0)[ \t]*$/i.test(value)) {
            return false;
        }
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        return undefined;
    }
    else if (typeof value === 'number') {
        if (!strict) {
            return value !== 0;
        }
        if (value === 0) {
            return false;
        }
        else if (value === 1) {
            return true;
        }
        throw new TypeError(`'${value}' does not represent a Boolean`);
    }
    if (strict) {
        throw new TypeError(`'${typeof value}' cannot be converted to a Boolean`);
    }
    return undefined;
}
exports.toBoolean = toBoolean;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vbGVhbi1tYXJzaGFsbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hcnNoYWxsZXJzL2Jvb2xlYW4tbWFyc2hhbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVFBLG1CQUEwQixLQUFVLEVBQUUsU0FBa0IsS0FBSztJQUN6RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDckIsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDaEIsT0FBTyxLQUFLLENBQUE7S0FDZjtJQUdELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN0QixJQUFJLE1BQU0sRUFBRTtZQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGdDQUFnQyxDQUFDLENBQUE7U0FDakU7UUFFRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1NBQ3RDO2FBQU07WUFDSCxPQUFPLFNBQVMsQ0FBQTtTQUNuQjtLQUNKO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDNUIsT0FBTyxLQUFLLENBQUE7S0FDZjtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLElBQUksNkJBQTZCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzNDLE9BQU8sSUFBSSxDQUFBO1NBQ2Q7UUFFRCxJQUFJLDZCQUE2QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMzQyxPQUFPLEtBQUssQ0FBQTtTQUNmO1FBRUQsSUFBSSxNQUFNLEVBQUU7WUFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxnQ0FBZ0MsQ0FBQyxDQUFBO1NBQ2pFO1FBRUQsT0FBTyxTQUFTLENBQUE7S0FDbkI7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNsQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1QsT0FBTyxLQUFLLEtBQUssQ0FBQyxDQUFBO1NBQ3JCO1FBRUQsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQ2IsT0FBTyxLQUFLLENBQUE7U0FDZjthQUFNLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtZQUNwQixPQUFPLElBQUksQ0FBQTtTQUNkO1FBRUQsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssZ0NBQWdDLENBQUMsQ0FBQTtLQUNqRTtJQUVELElBQUksTUFBTSxFQUFFO1FBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLE9BQU8sS0FBSyxvQ0FBb0MsQ0FBQyxDQUFBO0tBQzVFO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDcEIsQ0FBQztBQTNERCw4QkEyREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbnZlcnRzIGEgSlNPTiB2YWx1ZSB0byBhIEJvb2xlYW4sIGlmIHBvc3NpYmxlLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSAtIHZhbHVlIHRvIGNvbnZlcnQgdG8gYSBCb29sZWFuXG4gKiBAcGFyYW0gc3RyaWN0IC0gd2hlbiB0cnVlLCBwYXJzaW5nIGlzIHN0cmljdCBhbmQgcmV0dXJucyB1bmRlZmluZWQgaWYgbm90IGFibGUgdG8gYmUgcGFyc2VkXG4gKlxuICogQHJldHVybiBwYXJzZWQgQm9vbGVhbiBvciB1bmRlZmluZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvQm9vbGVhbih2YWx1ZTogYW55LCBzdHJpY3Q6IGJvb2xlYW4gPSBmYWxzZSk6IGJvb2xlYW4gfCB1bmRlZmluZWQge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gRXh0cmFjdCAwIGluZGV4IG9mIGFuIGFycmF5XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCcke3ZhbHVlfScgZG9lcyBub3QgcmVwcmVzZW50IGEgQm9vbGVhbmApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFsdWUgPSB0b0Jvb2xlYW4odmFsdWVbMF0sIHN0cmljdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJykge1xuICAgICAgICByZXR1cm4gdmFsdWVcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgICBpZiAoL15bIFxcdF0qKHRydWV8eWVzfDEpWyBcXHRdKiQvaS50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuICAgICAgICAvLyBTdHJpY3QgcmVxdWlyZXMgZXhhY3QgbWF0Y2ggdG8gZmFsc2VcbiAgICAgICAgaWYgKC9eWyBcXHRdKihmYWxzZXxub3wwKVsgXFx0XSokL2kudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgJyR7dmFsdWV9JyBkb2VzIG5vdCByZXByZXNlbnQgYSBCb29sZWFuYClcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKCFzdHJpY3QpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSAhPT0gMFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCcke3ZhbHVlfScgZG9lcyBub3QgcmVwcmVzZW50IGEgQm9vbGVhbmApXG4gICAgfVxuXG4gICAgaWYgKHN0cmljdCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAnJHt0eXBlb2YgdmFsdWV9JyBjYW5ub3QgYmUgY29udmVydGVkIHRvIGEgQm9vbGVhbmApXG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxufVxuIl19