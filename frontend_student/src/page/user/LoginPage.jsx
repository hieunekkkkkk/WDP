import React from "react";
import { SignIn } from "@clerk/clerk-react";

function LoginPage() {
  return (
    <div className="loginContainer">
      <SignIn forceRedirectUrl="/auth-callback" signUpUrl="/signup" />
    </div>
  );
}

export default LoginPage;
