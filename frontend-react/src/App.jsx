import React from "react";

import { ContractsProvider } from "./providers/ContractsProvider";
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
  <ContractsProvider>
    <HomePage />
  </ContractsProvider>
);

export default App;
