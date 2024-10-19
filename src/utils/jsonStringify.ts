export default function jsonStringify<T>(param: {
  data: any;
  error: (error: any) => T;
}): string | T {
  try {
    return JSON.stringify(param.data);
  } catch (e) {
    return param.error(e);
  }
}
