// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

// importe o setToken do seu util
import { setToken } from "../utils/authFetch";

const LoginPage = () => {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!usuario || !senha) {
      setErro("Preencha usuário e senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        "https://two025-estok-backend.onrender.com/api/estok/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // pega a api key do env (garanta que VITE_AUTH_KEY esteja definida)
            "x-api-key": import.meta.env.VITE_AUTH_KEY || ""
          },
          body: JSON.stringify({
            email: usuario.trim(),
            password: senha
          })
        }
      );

      if (!res.ok) {
        // Tratamento por status HTTP
        if (res.status === 401) {
          setErro("Email ou senha incorretos.");
        } else if (res.status === 500) {
          setErro("Erro no servidor. Tente novamente mais tarde.");
        } else {
          // tenta pegar mensagem do backend, se houver
          const errBody = await res.json().catch(() => null);
          const msg = errBody?.message || "Erro ao autenticar";
          setErro(msg);
        }
        setLoading(false);
        return;
      }

      const data = await res.json();

      // seu backend retorna accessToken
      if (!data || !data.accessToken) {
        setErro("Resposta inválida do servidor.");
        setLoading(false);
        return;
      }

      // salva token usando o util centralizado
      setToken(data.accessToken);

      // opcional: salva dados do usuário pra usar no front
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // navega para dashboard (ou onde quiser)
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error(err);
      setErro("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-header">
        <span className="login-logo-box">
          <img src="public/estok-logo.png" alt="Logo Estok" className="login-logo-img" />
        </span>
        <span className="login-app-name">ESTOK</span>
      </div>
      <div className="login-card">
        <h2 className="login-title">Entrar</h2>
        <p className="login-subtitle">É bom te ver novamente!</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="login-input"
            placeholder="Digite seu usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
          <input
            type="password"
            className="login-input"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
          {erro && <div className="login-erro">{erro}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <a href="#" className="login-link">
          Esqueceu sua senha?
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
