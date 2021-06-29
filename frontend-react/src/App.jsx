import React from "react";

import { RaffleContractProvider } from "./providers/RaffleContractProvider";
import Navbar from "./components/blocks/Navbar/Navbar";
import Hero from "./components/blocks/Hero/Hero";

const HomePage = () => (
  <div>
    <Navbar />
    <Hero />
  </div>
);

const App = () => (
  <RaffleContractProvider>
    <HomePage />
  </RaffleContractProvider>
);

export default App;
