export default (key: string, snippetsObj: { [key: string]: any }) => {
  if (!snippetsObj[key]) {
    return key;
  }

  let newKey = key;
  let num = 1;
  while (snippetsObj[`${newKey}${num}`]) {
    num++;
  }
  return `${newKey}${num}`;
};
