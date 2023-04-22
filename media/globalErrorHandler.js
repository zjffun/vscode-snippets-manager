(() => {
  window.vsCodeApi = acquireVsCodeApi();

  window.addEventListener("error", function (e) {
    let data = e.message;

    try {
      data = e.error.message;
    } catch (error) {
      console.error(error);
    }

    window.vsCodeApi.postMessage({
      type: "error",
      payload: {
        data,
      },
    });
  });
})();
