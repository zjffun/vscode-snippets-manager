(() => {
  window.vsCodeApi = acquireVsCodeApi();

  window.addEventListener("error", function (e) {
    const errMsg = e && e.message;

    window.vsCodeApi.postMessage({
      type: "error",
      payload: {
        errMsg,
      },
    });
  });
})();
