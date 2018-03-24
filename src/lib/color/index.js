const PREFIX = '<';
const POSTFIX = '>';

const color = ( color_num, string ) => {
    return PREFIX + color_num + ' ' + string + POSTFIX;
};

module.exports = color;
