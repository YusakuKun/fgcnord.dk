import { Route, Routes } from "react-router-dom";

import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/lib/auth";
import { Admin } from "@/pages/Admin";
import { BlivMedlem } from "@/pages/BlivMedlem";
import Galleri from "@/pages/Galleri";
import { Home } from "@/pages/Home";
import { Lobby } from "@/pages/Lobby";
import { Om } from "@/pages/Om";
import { PauseMusik } from "@/pages/PauseMusik";
import { Placeholder } from "@/pages/Placeholder";
import { Rangliste } from "@/pages/Rangliste";
import { StageStrike } from "@/pages/StageStrike";
import { TournamentBracket } from "@/pages/TournamentBracket";
import { TournamentLanding } from "@/pages/TournamentLanding";
import { TournamentMe } from "@/pages/TournamentMe";
import { Turneringer } from "@/pages/Turneringer";

import "./App.css";

function App() {
  return (
    <AuthProvider>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="turneringer" element={<Turneringer />} />
        <Route path="lobby" element={<Lobby />} />
        <Route path="rangliste" element={<Rangliste />} />
        <Route path="stage-strike" element={<StageStrike />} />
        <Route path="t/:code" element={<TournamentLanding />} />
        <Route path="t/:code/mig" element={<TournamentMe />} />
        <Route path="t/:code/bracket" element={<TournamentBracket />} />
        <Route path="om" element={<Om />} />
        <Route path="galleri" element={<Galleri />} />
        <Route path="bliv-medlem" element={<BlivMedlem />} />
        <Route path="admin" element={<Admin />} />
        <Route path="pausemusik" element={<PauseMusik />} />
        <Route path="*" element={<Placeholder />} />
      </Route>
    </Routes>
    </AuthProvider>
  );
}

export default App;
