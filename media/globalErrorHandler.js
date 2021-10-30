(() => {
  window.vsCodeApi = acquireVsCodeApi();

  window.addEventListener("error", function (e) {
    window.vsCodeApi.postMessage({
      type: "error",
      payload: {
        data: e.message,
      },
    });
  });
})();
