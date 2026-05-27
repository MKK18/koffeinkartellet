import { AuthProvider, useAuth } from "./auth.jsx";
import LoginScreen from "./LoginScreen.jsx";
import Catalog from "./Catalog.jsx";
import { C, sans } from "./ui.jsx";

function Gate() {
  const { user, ready } = useAuth();
  if (!ready) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg, color: C.muted, fontFamily: sans }}>
        Loading…
      </div>
    );
  }
  return user ? <Catalog /> : <LoginScreen />;
}

export default function Root() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
