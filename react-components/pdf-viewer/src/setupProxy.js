const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    createProxyMiddleware("/files", {
      target: "http://qstand.art",
      changeOrigin: true,
    })
  );
};
