const app = require("./app");

const port = process.env.PORT || 5000;
app.listen(port, () => {
  /* eslint-disable no-console */
  // console.log(`Listening: http://localhost:${port}`);
  console.log(`Listening: http://192.168.20.113:${port}`);
  /* eslint-enable no-console */
});
