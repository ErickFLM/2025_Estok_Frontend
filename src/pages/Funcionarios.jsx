// src/pages/Funcionarios.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Funcionarios.css";
import Footer from "../components/Footer";
import authFetch from "../utils/authFetch"; // precisa aceitar (input, init, { onUnauthorized })

const STORAGE_KEY = "estok_funcionarios";
const API_CREATE = "https://two025-estok-backend.onrender.com/api/estok/employee/create-employee";
const API_GET = "https://two025-estok-backend.onrender.com/api/estok/employee/get-employees";
// coloque sua chave em .env como VITE_AUTH_KEY
const API_KEY = import.meta.env.VITE_AUTH_KEY;

const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);
const passwordChecks = (pwd) => ({
  length: pwd.length >= 8,
  upper: /[A-Z]/.test(pwd),
  lower: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[^A-Za-z0-9]/.test(pwd),
});

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // estados apenas para adicionar
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoGenero, setNovoGenero] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoSenha, setNovoSenha] = useState("");
  const [erroNovo, setErroNovo] = useState("");

  // estados de requisição
  const [novoLoading, setNovoLoading] = useState(false);
  const [novoStatusMsg, setNovoStatusMsg] = useState("");
  const [novoStatusOk, setNovoStatusOk] = useState(null); // null = nada, true = sucesso, false = erro

  const navigate = useNavigate();

  // Carrega do servidor ao entrar na página
  useEffect(() => {
    let mounted = true;

    const loadFromCache = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setFuncionarios(parsed);
        } catch (e) {
          console.warn("Erro ao parsear cache:", e);
        }
      }
    };

    const fetchFuncionarios = async () => {
      if (!mounted) return;
      setListLoading(true);
      setListError("");
      try {
        const res = await authFetch(API_GET, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(API_KEY ? { "x-api-key": API_KEY } : {}),
          },
        }, {
          onUnauthorized: () => navigate("/login", { replace: true }),
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Sessão expirada. Faça login novamente.");
          } else if (res.status === 500) {
            throw new Error("Erro no servidor. Tente novamente mais tarde.");
          } else {
            const errBody = await res.json().catch(() => null);
            throw new Error((errBody && (errBody.error || errBody.message)) || `Erro ${res.status}`);
          }
        }

        const body = await res.json();

        // body esperado: { status: true, data: [...] } ou apenas array
        const items = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        const mapped = items.map((it) => ({
          id: it.id,
          usuario: it.nome ?? it.name ?? "",
          genero:
            it.cod_genero === 1 ? "Masculino" :
            it.cod_genero === 2 ? "Feminino" :
            it.cod_genero === 3 ? "Outro" :
            it.genero ?? it.gender_name ?? "",
          email: it.email ?? "",
          senha: it.senha ?? "",
        }));

        if (mounted) {
          setFuncionarios(mapped);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
        }
      } catch (err) {
        console.error("Erro ao carregar funcionários:", err);
        if (mounted) setListError(err.message || "Erro ao carregar funcionários.");
      } finally {
        if (mounted) setListLoading(false);
      }
    };

    // primeiro mostra cache rápido, mas sempre busca do servidor
    loadFromCache();
    fetchFuncionarios();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    // mantém cache atualizado sempre que funcionarios mudar
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(funcionarios));
    } catch (e) {
      console.warn("Erro ao salvar cache:", e);
    }
  }, [funcionarios]);

  const handleAbrirNovo = () => {
    setNovoNome("");
    setNovoGenero("");
    setNovoEmail("");
    setNovoSenha("");
    setErroNovo("");
    setNovoStatusMsg("");
    setNovoStatusOk(null);
    setModalNovoOpen(true);
  };

  const handleAdicionarFuncionario = async (e) => {
    e.preventDefault();
    setErroNovo("");
    setNovoStatusMsg("");
    setNovoStatusOk(null);

    if (!novoNome.trim() || !novoGenero || !novoEmail.trim() || !novoSenha) {
      setErroNovo("Preencha todos os campos.");
      return;
    }
    if (!validateEmail(novoEmail.trim())) {
      setErroNovo("Informe um e-mail válido.");
      return;
    }
    const checks = passwordChecks(novoSenha);
    if (!(checks.length && checks.upper && checks.lower && checks.number && checks.special)) {
      setErroNovo("A senha não atende aos requisitos obrigatórios.");
      return;
    }

    const payload = {
      name: novoNome.trim(),
      email: novoEmail.trim(),
      gender_name: novoGenero,
      password: novoSenha,
    };

    setNovoLoading(true);
    try {
      const res = await authFetch(API_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { "x-api-key": API_KEY } : {}),
        },
        body: JSON.stringify(payload),
      }, {
        onUnauthorized: () => navigate("/login", { replace: true }),
      });

      // tenta interpretar resposta
      const ct = res.headers.get("content-type") || "";
      const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => null);

      if (res.ok) {
        const createdId = body?.data?.id ?? body?.id ?? Date.now();
        const newItem = {
          id: createdId,
          usuario: payload.name,
          genero: payload.gender_name,
          email: payload.email,
          senha: payload.password,
        };
        setFuncionarios((prev) => {
          const updated = [...prev, newItem];
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
          return updated;
        });

        setNovoStatusOk(true);
        setNovoStatusMsg(
          typeof body === "string"
            ? body || "Funcionário criado com sucesso."
            : body?.message || "Funcionário criado com sucesso."
        );

        // limpa campos
        setNovoNome("");
        setNovoGenero("");
        setNovoEmail("");
        setNovoSenha("");
        // opcional: fechar modal automaticamente
        // setModalNovoOpen(false);
      } else {
        // erro do servidor: exibir mensagem vindo do backend (body.error/body.message) ou texto cru
        const msg = (body && (body.error || body.message)) || (typeof body === "string" ? body : `Erro ${res.status}`);
        setNovoStatusOk(false);
        setNovoStatusMsg(msg);
      }
    } catch (err) {
      console.error("Erro ao criar funcionário:", err);
      setNovoStatusOk(false);
      setNovoStatusMsg(err.message || "Erro de rede. Tente novamente.");
    } finally {
      setNovoLoading(false);
    }
  };

  const checksForNovo = passwordChecks(novoSenha);
  const overlayClickNovo = () => { if (!novoLoading) setModalNovoOpen(false); };

  return (
    <div className="container">
      <Sidebar />
      <main className="func-main">
        <div className="func-header">
          <h2>Funcionários</h2>
          <button className="func-add-btn" onClick={handleAbrirNovo}>
            <span className="material-icons-sharp">person_add</span>
            Adicionar Funcionário
          </button>
        </div>

        {listLoading && <div style={{ padding: "1rem" }}>Carregando funcionários...</div>}
        {listError && <div className="func-erro" style={{ marginBottom: "1rem" }}>{listError}</div>}

        <div className="func-cards">
          {funcionarios.map((f, idx) => (
            <div className="func-card" key={f.id ?? idx}>
              <div className="func-nome">
                <label style={{ fontWeight: 500, color: "#7d8da1", fontSize: "0.98rem" }}>Usuário</label>
                <input className="func-input" type="text" value={f.usuario} readOnly style={{ marginBottom: "0.7rem", background: "#f6f6f9" }} />

                <label style={{ fontWeight: 500, color: "#7d8da1", fontSize: "0.98rem" }}>Gênero</label>
                <input className="func-input" type="text" value={f.genero || ""} readOnly style={{ marginBottom: "0.7rem", background: "#f6f6f9" }} />

                <label style={{ fontWeight: 500, color: "#7d8da1", fontSize: "0.98rem" }}>E-mail</label>
                <input className="func-input" type="text" value={f.email || ""} readOnly style={{ marginBottom: "0.7rem", background: "#f6f6f9" }} />

                <label style={{ fontWeight: 500, color: "#7d8da1", fontSize: "0.98rem" }}>Senha</label>
                <input className="func-input" type="password" value={f.senha} readOnly style={{ background: "#f6f6f9" }} />
              </div>
            </div>
          ))}

          {funcionarios.length === 0 && !listLoading && <div className="func-empty">Nenhum funcionário cadastrado.</div>}
        </div>

        {modalNovoOpen && (
          <div className="func-modal-overlay" onClick={overlayClickNovo}>
            <div className="func-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Novo Funcionário</h3>
              <form onSubmit={handleAdicionarFuncionario}>
                <label style={{ width: "100%", marginBottom: "0.5rem" }}>
                  Nome
                  <input type="text" className="func-input" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Nome do funcionário" autoFocus disabled={novoLoading} />
                </label>

                <label style={{ width: "100%", marginBottom: "0.5rem" }}>
                  Gênero
                  <select className="func-input" value={novoGenero} onChange={(e) => setNovoGenero(e.target.value)} disabled={novoLoading}>
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </label>

                <label style={{ width: "100%", marginBottom: "0.5rem" }}>
                  E-mail
                  <input type="email" className="func-input" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="email@exemplo.com" disabled={novoLoading} />
                </label>

                <label style={{ width: "100%", marginBottom: "0.25rem" }}>
                  Senha
                  <input type="password" className="func-input" value={novoSenha} onChange={(e) => setNovoSenha(e.target.value)} placeholder="Senha" disabled={novoLoading} />
                </label>

                <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                  <div style={{ marginBottom: "0.25rem", color: checksForNovo.length ? "#2b8a3e" : "#666" }}>• 8 caracteres ou mais</div>
                  <div style={{ marginBottom: "0.25rem", color: checksForNovo.upper && checksForNovo.lower ? "#2b8a3e" : "#666" }}>• Letra maiúscula e minúscula</div>
                  <div style={{ marginBottom: "0.25rem", color: checksForNovo.special ? "#2b8a3e" : "#666" }}>• Caractere especial</div>
                  <div style={{ marginBottom: "0.25rem", color: checksForNovo.number ? "#2b8a3e" : "#666" }}>• Número</div>
                </div>

                {erroNovo && <div className="func-erro">{erroNovo}</div>}

                {novoStatusOk !== null && (
                  <div style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    color: novoStatusOk ? "#155724" : "#721c24",
                    background: novoStatusOk ? "#d4edda" : "#f8d7da",
                    border: novoStatusOk ? "1px solid #c3e6cb" : "1px solid #f5c6cb",
                  }}>
                    {novoStatusMsg}
                    {!novoStatusOk && <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>Tente novamente.</div>}
                  </div>
                )}

                <div className="func-modal-btns">
                  <button type="submit" className="func-btn salvar" disabled={novoLoading}>
                    {novoLoading ? "Enviando..." : "Adicionar"}
                  </button>
                  <button type="button" className="func-btn fechar" onClick={() => !novoLoading && setModalNovoOpen(false)} disabled={novoLoading}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default Funcionarios;
