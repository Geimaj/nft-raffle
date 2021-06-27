import React from "react";

import { RaffleContractProvider } from "./providers/RaffleContractProvider";
import Navbar from "./components/Navbar/Navbar";

const App = () => (
  <RaffleContractProvider>
    <Navbar />
  </RaffleContractProvider>
);

export default App;
