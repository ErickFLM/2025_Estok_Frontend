import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Produtos.css";
import Footer from "../components/Footer";

const Produtos = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const response = await fetch(
          "https://two025-estok-backend.onrender.com/api/estok/product/get-product-status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": import.meta.env.VITE_AUTH_KEY,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar produtos");
        }

        const data = await response.json();

        // 🔹 Junta todas as listas em uma só
        const allProducts = [
          ...data.lowStock.map((p) => ({ ...p, status: "lowStock" })),
          ...data.mediumStock.map((p) => ({ ...p, status: "mediumStock" })),
          ...data.highStock.map((p) => ({ ...p, status: "highStock" })),
          ...data.expired.map((p) => ({ ...p, expired: true })),
        ];

        // 🔹 Remove duplicados e unifica status
        const merged = [];
        allProducts.forEach((p) => {
          const key = `${p.produto}-${p.tipo}-${p.marca}`;
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
          } else {
            merged.push({
              produto: p.produto,
              tipo: p.tipo,
              marca: p.marca,
              qtd_atual: p.qtd_atual,
              qtd_max: p.qtd_max,
              validade: new Date(p.validade).toLocaleDateString("pt-BR"),
              critico: p.status === "lowStock",
              reposicao: p.status === "mediumStock",
              normal: p.status === "highStock",
              vencido: !!p.expired,
            });
          }
        });

        setProdutos(merged);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, []);

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
        <div className="produtos-grid">
          {produtos.length === 0 ? (
            <p>Nenhum produto encontrado.</p>
          ) : (
            produtos.map((p, index) => (
              <div key={index} className="produto-card">
                <div className="produto-img-container">
                  <img
                    src={`../public/${p.produto}.png`}
                    alt={p.produto}
                    className="produto-img"
                    onError={(e) =>
                      (e.target.src = "../public/default.png")
                    } // fallback se não achar a imagem
                  />
                </div>
                <div className="produto-info">
                  <div className="produto-nome">
                    {p.produto}
                  </div>
                  <div className="produto-categoria">Categoria: {p.tipo}</div>
                  <div className="produto-marca">Marca: {p.marca}</div>
                  <div className="produto-validade">
                    Validade: {p.validade}
                  </div>
                  <div className="produto-status">
                    {p.vencido && (
                      <span className="produto-status-btn vencido">
                        Produto vencido
                      </span>
                    )}
                    {p.critico && (
                      <span className="produto-status-btn critico">
                        Nível crítico
                      </span>
                    )}
                    {p.reposicao && (
                      <span className="produto-status-btn reposicao">
                        Reposição necessária
                      </span>
                    )}
                    {p.normal && (
                      <span className="produto-status-btn normal">
                        Estoque normal
                      </span>
                    )}
                  </div>
                </div>
                <div className="produto-quantidade">
                  {p.qtd_atual}
                </div>
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
