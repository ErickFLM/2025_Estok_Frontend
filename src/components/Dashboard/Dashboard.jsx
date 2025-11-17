// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Card from "../Card/Card";
import { HistoricoPrateleiraCard } from "../HistoricoPrateleiraCard";
import ProdutosModal from "./ProdutosModal";
import "./Dashboard.css";
import authFetch from "../../utils/authFetch"; // garanta que authFetch aceite onUnauthorized

const modalTitles = {
  reposicao: "Produtos precisando de reposição",
  criticos: "Produtos com nível crítico de estoque",
  vencidos: "Produtos próximos do vencimento",
};

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(null);
  const [stockData, setStockData] = useState({
    lowStock: [],
    mediumStock: [],
    highStock: [],
    expired: [],
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setErro("");

      try {
        const res = await authFetch(
          "https://two025-estok-backend.onrender.com/api/estok/product/get-product-status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": import.meta.env.VITE_AUTH_KEY || "",
            },
          },
          {
            onUnauthorized: () => navigate("/login", { replace: true }),
          }
        );

        if (!res.ok) {
          if (res.status === 401) {
            // authFetch já chamou onUnauthorized, mas mostramos mensagem breve
            if (mounted) setErro("Sessão expirada. Faça login novamente.");
            return;
          } else if (res.status === 500) {
            if (mounted) setErro("Erro no servidor. Tente novamente mais tarde.");
            return;
          } else {
            const errBody = await res.json().catch(() => null);
            if (mounted) setErro(errBody?.message || "Erro ao buscar dados do estoque.");
            return;
          }
        }

        const data = await res.json();

        // Função para formatar listas (mantendo segurança caso backend retorne undefined)
        const format = (list = []) =>
          list.map((p, index) => ({
            id: p.id ?? `${Date.now()}-${index}`,
            produto: p.produto,
            tipo: p.tipo,
            marca: p.marca,
            qtd_max: p.qtd_max,
            qtd_atual: p.qtd_atual,
            validade: p.validade ? new Date(p.validade).toLocaleDateString("pt-BR") : "-",
          }));

        if (mounted) {
          setStockData({
            lowStock: format(data.lowStock || []),
            mediumStock: format(data.mediumStock || []),
            highStock: format(data.highStock || []),
            expired: format(data.expired || []),
          });
        }
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        if (mounted) setErro("Erro de conexão. Verifique sua internet e tente novamente.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // Define os produtos que vão pro modal
  let modalProdutos = [];
  if (modalOpen === "reposicao") modalProdutos = stockData.mediumStock;
  if (modalOpen === "criticos") modalProdutos = stockData.lowStock;
  if (modalOpen === "vencidos") modalProdutos = stockData.expired;

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <main>
          <h2>Dashboard</h2>
          <p>Carregando dados do estoque...</p>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <Sidebar />
        <main>
          <h2>Dashboard</h2>

          {erro && <div className="dashboard-erro">{erro}</div>}

          <div className="insights">
            <Card
              icon="two_pager_store"
              value={stockData.mediumStock.length}
              title="Produtos precisando de reposição"
              buttonLabel="Ver produtos"
              className="reposicao"
              onButtonClick={() => setModalOpen("reposicao")}
            />
            <Card
              icon="two_pager_store"
              value={stockData.lowStock.length}
              title="Produtos com nível crítico de estoque"
              buttonLabel="Ver produtos"
              className="atencao"
              onButtonClick={() => setModalOpen("criticos")}
            />
            <Card
              icon="two_pager_store"
              value={stockData.expired.length}
              title="Produtos próximos do vencimento"
              buttonLabel="Ver validade"
              className="vencimento"
              onButtonClick={() => setModalOpen("vencidos")}
            />
          </div>

          <div className="mt-8 historico-margin-top">
            <h2 className="mb-4 font-bold text-lg">Histórico de Movimentações</h2>
            <HistoricoPrateleiraCard />
          </div>
        </main>
      </div>

      <ProdutosModal
        open={!!modalOpen}
        onClose={() => setModalOpen(null)}
        title={modalTitles[modalOpen]}
        produtos={modalProdutos}
        tipo={modalOpen}
      />
    </>
  );
};

export default Dashboard;
