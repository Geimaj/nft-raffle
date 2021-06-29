import React from "react";

import { RaffleContractProvider } from "./providers/RaffleContractProvider";
import Navbar from "./components/blocks/Navbar/Navbar";
import CreateRaffleForm from "./components/CreateRaffleForm/CreateRaffleForm";

import Hero from "./components/blocks/Hero/Hero";

const HomePage = () => (
  <div>
    <Navbar />
    <Hero />
    <CreateRaffleForm />
  </div>
);

const App = () => (
  <RaffleContractProvider>
    <HomePage />
  </RaffleContractProvider>
);

export default App;
