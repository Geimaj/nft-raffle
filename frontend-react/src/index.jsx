/* Add JavaScript code here! */
console.log("Hello World! You did it! Welcome to Snowpack :D");

import ReactDOM from "react-dom";
import React from "react";

function App() {
  return <strong>hi shai</strong>;
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// Hot Module Replacement (HMR) - Remove this snippet to remove HMR.
// Learn more: https://www.snowpack.dev/concepts/hot-module-replacement
if (undefined /* [snowpack] import.meta.hot */) {
  undefined /* [snowpack] import.meta.hot */
    .accept();
}
