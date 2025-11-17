// src/pages/Produtos.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer";
import "./Produtos.css";
import authFetch from "../utils/authFetch"; // certifique-se de ter a versão com onUnauthorized

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchProdutos = async () => {
      setLoading(true);
      setErro("");

      try {
        const res = await authFetch(
          "https://two025-estok-backend.onrender.com/api/estok/product/get-product-status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // mantém a x-api-key que seu backend exige
              "x-api-key": import.meta.env.VITE_AUTH_KEY || ""
            }
          },
          {
            // callback para navegar sem reload quando o token expirar/401
            onUnauthorized: () => navigate("/login", { replace: true })
          }
        );

        if (!res.ok) {
          // tratamento específico por status
          if (res.status === 401) {
            // authFetch já chama onUnauthorized, mas deixamos a mensagem também
            setErro("Sessão expirada. Faça login novamente.");
          } else if (res.status === 500) {
            setErro("Erro no servidor. Tente novamente mais tarde.");
          } else {
            const errBody = await res.json().catch(() => null);
            setErro(errBody?.message || "Erro ao buscar produtos.");
          }
          return;
        }

        const data = await res.json();

        // 🔹 Junta todas as listas em uma só (adicionando flags)
        const allProducts = [
          ...(Array.isArray(data.lowStock) ? data.lowStock : []).map((p) => ({ ...p, status: "lowStock" })),
          ...(Array.isArray(data.mediumStock) ? data.mediumStock : []).map((p) => ({ ...p, status: "mediumStock" })),
          ...(Array.isArray(data.highStock) ? data.highStock : []).map((p) => ({ ...p, status: "highStock" })),
          ...(Array.isArray(data.expired) ? data.expired : []).map((p) => ({ ...p, expired: true })),
        ];

        // 🔹 Remove duplicados e unifica status
        const merged = [];
        allProducts.forEach((p) => {
          const existing = merged.find(
            (m) =>
              m.produto === p.produto &&
              m.tipo === p.tipo &&
              m.marca === p.marca
          );

          if (existing) {
            if (p.status === "lowStock") existing.critico = true;
            if (p.status === "mediumStock") existing.reposicao = true;
            if (p.status === "highStock") existing.normal = true;
            if (p.expired) existing.vencido = true;
            // atualizar qtd_atual/qtd_max se quiser manter valores mais recentes
            if (p.qtd_atual != null) existing.qtd_atual = p.qtd_atual;
            if (p.qtd_max != null) existing.qtd_max = p.qtd_max;
            if (p.validade) existing.validade = new Date(p.validade).toLocaleDateString("pt-BR");
          } else {
            merged.push({
              produto: p.produto,
              tipo: p.tipo,
              marca: p.marca,
              qtd_atual: p.qtd_atual,
              qtd_max: p.qtd_max,
              validade: p.validade ? new Date(p.validade).toLocaleDateString("pt-BR") : "-",
              critico: p.status === "lowStock",
              reposicao: p.status === "mediumStock",
              normal: p.status === "highStock",
              vencido: !!p.expired,
            });
          }
        });

        if (mounted) setProdutos(merged);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        if (mounted) {
          // erros de rede ou exceções
          setErro("Erro de conexão. Verifique sua internet e tente novamente.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProdutos();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <main>
          <h2 className="produtos-title">Produtos</h2>
          <p>Carregando produtos...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="container">
      <Sidebar />
      <main>
        <h2 className="produtos-title">Produtos</h2>

        {erro && <div className="produtos-erro">{erro}</div>}

        <div className="produtos-grid">
          {produtos.length === 0 ? (
            <p>Nenhum produto encontrado.</p>
          ) : (
            produtos.map((p, index) => (
              <div key={index} className="produto-card">
                <div className="produto-img-container">
                  <img
                    src={`/${p.produto}.png`} // assets na pasta public: /nome.png
                    alt={p.produto}
                    className="produto-img"
                    onError={(e) => (e.target.src = "/default.png")} // fallback para public/default.png
                  />
                </div>

                <div className="produto-info">
                  <div className="produto-nome">{p.produto}</div>
                  <div className="produto-categoria">Categoria: {p.tipo}</div>
                  <div className="produto-marca">Marca: {p.marca}</div>
                  <div className="produto-validade">Validade: {p.validade}</div>

                  <div className="produto-status">
                    {p.vencido && (
                      <span className="produto-status-btn vencido">Produto vencido</span>
                    )}
                    {p.critico && (
                      <span className="produto-status-btn critico">Nível crítico</span>
                    )}
                    {p.reposicao && (
                      <span className="produto-status-btn reposicao">Reposição necessária</span>
                    )}
                    {p.normal && (
                      <span className="produto-status-btn normal">Estoque normal</span>
                    )}
                  </div>
                </div>

                <div className="produto-quantidade">{p.qtd_atual}</div>
              </div>
            ))
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default Produtos;
