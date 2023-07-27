export const cellColumnIndex = (addr: string) => {
  var base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', i, j, result = 0;

  for (i = 0, j = addr.length - 1;i < addr.length;i += 1, j -= 1) {
    result += Math.pow(base.length, j) * (base.indexOf(addr[i]) + 1);
  }

  return result;
};

export const cellRowIndex = (addr: string) => {
  return parseInt(addr.replace(/[^0-9]/g, ''), 10);
};

export const indexToColumn = (index: number) => {
  let column = '';
  let temp = 0;

  while (index > 0) {
    temp = (index - 1) % 26;
    column = String.fromCharCode(temp + 65) + column;
    index = (index - temp - 1) / 26;
  }

  return column;
}

export const indexToRow = (index: number) => {
  return index;
}
